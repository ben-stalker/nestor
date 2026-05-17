import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import OctopusConsumptionRepository from '../../src/repositories/OctopusConsumptionRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { OctopusSyncService } from '../../src/services/OctopusSyncService';
import * as OctopusClient from '../../src/services/OctopusClient';

// Mock OctopusClient module — jest.mock is hoisted above imports at runtime
jest.mock('../../src/services/OctopusClient', () => ({
  fetchConsumption: jest.fn(),
  fetchTariff: jest.fn(),
}));

// Mock crypto decrypt so we don't need a real machine key
jest.mock('../../src/utils/crypto', () => ({
  decrypt: jest.fn((v: string) => `decrypted:${v}`),
  encrypt: jest.fn((v: string) => `encrypted:${v}`),
  CryptoService: jest.fn(),
  initCrypto: jest.fn(),
  getMachineId: jest.fn(),
}));

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeInterval(offset: number) {
  const T0 = 1_700_000_000;
  const HALF = 1800;
  return {
    intervalStart: T0 + offset * HALF,
    intervalEnd: T0 + (offset + 1) * HALF,
    kwh: 0.5 + offset * 0.1,
  };
}

describe('OctopusSyncService', () => {
  let db: Database.Database;
  let consumptionRepo: OctopusConsumptionRepository;
  let settingsRepo: AppSettingsRepository;
  let service: OctopusSyncService;

  const mockFetchConsumption = OctopusClient.fetchConsumption as jest.Mock;
  const mockFetchTariff = OctopusClient.fetchTariff as jest.Mock;

  beforeEach(() => {
    db = makeDb();
    consumptionRepo = new OctopusConsumptionRepository(db);
    settingsRepo = new AppSettingsRepository(db);
    service = new OctopusSyncService(consumptionRepo, settingsRepo);
    jest.clearAllMocks();
  });

  afterEach(() => db.close());

  // ------------------------------------------------------ skip when not configured
  describe('skips when not configured', () => {
    it('skips and returns skipped=true when no API key', async () => {
      const result = await service.run();
      expect(result).toEqual({ electricityRows: 0, gasRows: 0, skipped: true });
      expect(mockFetchConsumption).not.toHaveBeenCalled();
    });

    it('skips when API key present but no MPAN', async () => {
      settingsRepo.set('octopus_api_key', 'some-enc-key');
      const result = await service.run();
      expect(result).toEqual({ electricityRows: 0, gasRows: 0, skipped: true });
      expect(mockFetchConsumption).not.toHaveBeenCalled();
    });

    it('skips when API key + MPAN present but no meter serial', async () => {
      settingsRepo.set('octopus_api_key', 'some-enc-key');
      settingsRepo.set('octopus_mpan', '1234567890123');
      const result = await service.run();
      expect(result).toEqual({ electricityRows: 0, gasRows: 0, skipped: true });
      expect(mockFetchConsumption).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------ electricity sync
  describe('electricity sync', () => {
    beforeEach(() => {
      settingsRepo.set('octopus_api_key', 'enc-api-key');
      settingsRepo.set('octopus_mpan', '1234567890123');
      settingsRepo.set('octopus_meter_serial', 'E1A2B3C4');
    });

    it('fetches and upserts electricity consumption rows', async () => {
      const intervals = [makeInterval(0), makeInterval(1), makeInterval(2)];
      mockFetchConsumption.mockResolvedValue(intervals);
      mockFetchTariff.mockResolvedValue(null);

      const result = await service.run();

      expect(result.skipped).toBe(false);
      expect(result.electricityRows).toBe(3);
      expect(result.gasRows).toBe(0);

      const stored = consumptionRepo.listForRange('electricity', 0, 9_999_999_999);
      expect(stored).toHaveLength(3);
    });

    it('passes decrypted API key to fetchConsumption', async () => {
      mockFetchConsumption.mockResolvedValue([]);
      mockFetchTariff.mockResolvedValue(null);

      await service.run();

      expect(mockFetchConsumption).toHaveBeenCalledWith(
        'decrypted:enc-api-key',
        '1234567890123',
        'E1A2B3C4',
        'electricity',
        expect.any(String),
        expect.any(String),
      );
    });

    it('uses latestIntervalStart as the from epoch for subsequent syncs', async () => {
      // Pre-seed one row
      consumptionRepo.upsert({
        fuelType: 'electricity',
        intervalStart: 1_700_100_000,
        intervalEnd: 1_700_101_800,
        kwh: 0.4,
      });
      mockFetchConsumption.mockResolvedValue([]);
      mockFetchTariff.mockResolvedValue(null);

      await service.run();

      const [, , , , fromIso] = mockFetchConsumption.mock.calls[0] as unknown[];
      const fromEpoch = Math.floor(new Date(fromIso as string).getTime() / 1000);
      expect(fromEpoch).toBe(1_700_100_000);
    });

    it('handles electricity fetch error gracefully, still returns skipped=false', async () => {
      mockFetchConsumption.mockRejectedValue(new Error('API down'));
      mockFetchTariff.mockResolvedValue(null);

      const result = await service.run();
      expect(result.skipped).toBe(false);
      expect(result.electricityRows).toBe(0);
    });
  });

  // ------------------------------------------------------ gas sync
  describe('gas sync', () => {
    beforeEach(() => {
      settingsRepo.set('octopus_api_key', 'enc-api-key');
      settingsRepo.set('octopus_mpan', '1234567890123');
      settingsRepo.set('octopus_meter_serial', 'E1A2B3C4');
      settingsRepo.set('octopus_gas_mprn', '7654321');
      settingsRepo.set('octopus_gas_meter_serial', 'G9Z8Y7');
    });

    it('fetches and upserts gas consumption when MPRN is configured', async () => {
      const elecIntervals = [makeInterval(0)];
      const gasIntervals = [makeInterval(10), makeInterval(11)];

      mockFetchConsumption
        .mockResolvedValueOnce(elecIntervals) // electricity
        .mockResolvedValueOnce(gasIntervals); // gas
      mockFetchTariff.mockResolvedValue(null);

      const result = await service.run();

      expect(result.electricityRows).toBe(1);
      expect(result.gasRows).toBe(2);

      const gasStored = consumptionRepo.listForRange('gas', 0, 9_999_999_999);
      expect(gasStored).toHaveLength(2);
    });

    it('calls fetchConsumption with gas fuel type and correct credentials', async () => {
      mockFetchConsumption.mockResolvedValue([]);
      mockFetchTariff.mockResolvedValue(null);

      await service.run();

      const gasCalls = (mockFetchConsumption.mock.calls as unknown[][]).filter(
        (call) => call[3] === 'gas',
      );
      expect(gasCalls).toHaveLength(1);
      expect(gasCalls[0][1]).toBe('7654321');
      expect(gasCalls[0][2]).toBe('G9Z8Y7');
    });

    it('handles gas fetch error gracefully without failing electricity rows', async () => {
      const elecIntervals = [makeInterval(0), makeInterval(1)];
      mockFetchConsumption
        .mockResolvedValueOnce(elecIntervals) // electricity succeeds
        .mockRejectedValueOnce(new Error('gas API error')); // gas fails
      mockFetchTariff.mockResolvedValue(null);

      const result = await service.run();
      expect(result.electricityRows).toBe(2);
      expect(result.gasRows).toBe(0);
      expect(result.skipped).toBe(false);
    });
  });

  // ------------------------------------------------------ tariff refresh
  describe('tariff refresh', () => {
    beforeEach(() => {
      settingsRepo.set('octopus_api_key', 'enc-api-key');
      settingsRepo.set('octopus_mpan', '1234567890123');
      settingsRepo.set('octopus_meter_serial', 'E1A2B3C4');
      settingsRepo.set('octopus_tariff_code', 'E-1R-VAR-22-11-01-A');
      mockFetchConsumption.mockResolvedValue([]);
    });

    it('stores unit rate and standing charge from fetchTariff', async () => {
      mockFetchTariff.mockResolvedValue({ unitRatePence: 28.5, standingChargePence: 45.0 });

      await service.run();

      expect(settingsRepo.get<number>('octopus_unit_rate')).toBeCloseTo(28.5);
      expect(settingsRepo.get<number>('octopus_standing_charge')).toBeCloseTo(45.0);
    });

    it('does not write tariff settings when fetchTariff returns null', async () => {
      mockFetchTariff.mockResolvedValue(null);

      await service.run();

      expect(settingsRepo.get<number>('octopus_unit_rate')).toBeUndefined();
    });

    it('does not call fetchTariff when no tariff code configured', async () => {
      settingsRepo.delete('octopus_tariff_code');

      await service.run();

      expect(mockFetchTariff).not.toHaveBeenCalled();
    });
  });
});

import logger from '../utils/logger';
import type OctopusConsumptionRepository from '../repositories/OctopusConsumptionRepository';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import * as OctopusClient from './OctopusClient';
import { decrypt } from '../utils/crypto';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export interface SyncResult {
  electricityRows: number;
  gasRows: number;
  skipped: boolean;
}

export class OctopusSyncService {
  constructor(
    private readonly repo: OctopusConsumptionRepository,
    private readonly settingsRepo: AppSettingsRepository,
  ) {}

  async run(): Promise<SyncResult> {
    const encKey = this.settingsRepo.get<string>('octopus_api_key');
    if (!encKey) {
      logger.debug({ job: 'octopus-sync' }, 'No Octopus API key configured — skipping');
      return { electricityRows: 0, gasRows: 0, skipped: true };
    }

    let apiKey: string;
    try {
      apiKey = decrypt(encKey);
    } catch (err) {
      logger.error({ err, job: 'octopus-sync' }, 'Failed to decrypt Octopus API key');
      return { electricityRows: 0, gasRows: 0, skipped: true };
    }

    const mpan = this.settingsRepo.get<string>('octopus_mpan');
    const meterSerial = this.settingsRepo.get<string>('octopus_meter_serial');

    if (!mpan || !meterSerial) {
      logger.debug({ job: 'octopus-sync' }, 'No MPAN/meter serial configured — skipping');
      return { electricityRows: 0, gasRows: 0, skipped: true };
    }

    const nowEpoch = Math.floor(Date.now() / 1000);
    const toIso = new Date().toISOString();

    // Electricity sync
    const latestElec = this.repo.latestIntervalStart('electricity');
    const fromElecEpoch = latestElec ?? nowEpoch - THIRTY_DAYS_SECONDS;
    const fromElecIso = new Date(fromElecEpoch * 1000).toISOString();

    let electricityRows = 0;
    try {
      const elecIntervals = await OctopusClient.fetchConsumption(
        apiKey,
        mpan,
        meterSerial,
        'electricity',
        fromElecIso,
        toIso,
      );
      elecIntervals.forEach((interval) => {
        this.repo.upsert({ fuelType: 'electricity', ...interval });
      });
      electricityRows = elecIntervals.length;
      logger.info({ job: 'octopus-sync', electricityRows }, 'Electricity consumption synced');
    } catch (err) {
      logger.error({ err, job: 'octopus-sync' }, 'Failed to sync electricity consumption');
    }

    // Gas sync (optional)
    let gasRows = 0;
    const gasMprn = this.settingsRepo.get<string>('octopus_gas_mprn');
    const gasMeterSerial = this.settingsRepo.get<string>('octopus_gas_meter_serial');

    if (gasMprn && gasMeterSerial) {
      const latestGas = this.repo.latestIntervalStart('gas');
      const fromGasEpoch = latestGas ?? nowEpoch - THIRTY_DAYS_SECONDS;
      const fromGasIso = new Date(fromGasEpoch * 1000).toISOString();

      try {
        const gasIntervals = await OctopusClient.fetchConsumption(
          apiKey,
          gasMprn,
          gasMeterSerial,
          'gas',
          fromGasIso,
          toIso,
        );
        gasIntervals.forEach((interval) => {
          this.repo.upsert({ fuelType: 'gas', ...interval });
        });
        gasRows = gasIntervals.length;
        logger.info({ job: 'octopus-sync', gasRows }, 'Gas consumption synced');
      } catch (err) {
        logger.error({ err, job: 'octopus-sync' }, 'Failed to sync gas consumption');
      }
    }

    // Tariff refresh
    const tariffCode = this.settingsRepo.get<string>('octopus_tariff_code');
    if (tariffCode) {
      try {
        const tariff = await OctopusClient.fetchTariff(apiKey, tariffCode);
        if (tariff) {
          this.settingsRepo.set('octopus_unit_rate', tariff.unitRatePence);
          this.settingsRepo.set('octopus_standing_charge', tariff.standingChargePence);
          logger.info({ job: 'octopus-sync', tariff }, 'Tariff rates refreshed');
        }
      } catch (err) {
        logger.warn({ err, job: 'octopus-sync' }, 'Failed to refresh tariff rates');
      }
    }

    return { electricityRows, gasRows, skipped: false };
  }
}

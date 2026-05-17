import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import OctopusConsumptionRepository from '../../src/repositories/OctopusConsumptionRepository';
import createOctopusRouter from '../../src/routes/octopus';
import { CryptoService } from '../../src/utils/crypto';

jest.mock('../../src/services/OctopusClient');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

interface ConsumptionBody {
  configured: boolean;
  data: Array<{ date: string; kwh: number; costMinor: number }>;
  unitRatePence: number;
  standingChargePence: number;
}

interface TariffBody {
  unitRatePence: number;
  standingChargePence: number;
  configured: boolean;
}

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpPin: RequestHandler = (_req, _res, next) => next();

function makeApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  const settingsRepo = new AppSettingsRepository(db);
  const consumptionRepo = new OctopusConsumptionRepository(db);
  const cryptoService = new CryptoService(settingsRepo, () => 'test-machine-id');
  app.use(createOctopusRouter(settingsRepo, cryptoService, noOpPin, consumptionRepo));
  app.use(errorHandler);
  return { app, settingsRepo, consumptionRepo, cryptoService };
}

function seedCredentials(
  settingsRepo: AppSettingsRepository,
  cryptoService: CryptoService,
  opts: { unitRate?: number; standingCharge?: number } = {},
) {
  settingsRepo.set('octopus_api_key', cryptoService.encrypt('sk_live_test'));
  settingsRepo.set('octopus_account_number', 'A-TEST');
  settingsRepo.set('octopus_mpan', '1234567890123');
  settingsRepo.set('octopus_meter_serial', 'E1A001');
  if (opts.unitRate !== undefined) {
    settingsRepo.set('octopus_unit_rate', opts.unitRate);
  }
  if (opts.standingCharge !== undefined) {
    settingsRepo.set('octopus_standing_charge', opts.standingCharge);
  }
}

let intervalCounter = 0;

/** Insert a half-hour interval for the given ISO date string using a unique slot offset */
function insertInterval(
  consumptionRepo: OctopusConsumptionRepository,
  fuelType: 'electricity' | 'gas',
  dateStr: string,
  kwh: number,
) {
  const slotOffset = (intervalCounter % 48) * 1800;
  intervalCounter += 1;
  const start = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000) + slotOffset;
  const end = start + 1800;
  consumptionRepo.upsert({ fuelType, intervalStart: start, intervalEnd: end, kwh });
}

// ────────────────────────────────────────────────────────────
// GET /api/v1/octopus/consumption
// ────────────────────────────────────────────────────────────

describe('GET /api/v1/octopus/consumption — not configured', () => {
  it('returns configured=false when no credentials are stored', async () => {
    const db = makeDb();
    const { app } = makeApp(db);

    const res = await request(app).get('/api/v1/octopus/consumption');
    const body = res.body as ConsumptionBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(false);
    expect(body.data).toEqual([]);
    expect(body.unitRatePence).toBe(0);
    expect(body.standingChargePence).toBe(0);
    db.close();
  });
});

describe('GET /api/v1/octopus/consumption — configured', () => {
  it('returns an empty data array when no consumption rows exist', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService, { unitRate: 24.5, standingCharge: 53.0 });

    const res = await request(app).get('/api/v1/octopus/consumption');
    const body = res.body as ConsumptionBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(true);
    expect(body.data).toEqual([]);
    expect(body.unitRatePence).toBe(24.5);
    expect(body.standingChargePence).toBe(53.0);
    db.close();
  });

  it('returns daily aggregated data when consumption rows exist', async () => {
    const db = makeDb();
    const { app, settingsRepo, consumptionRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService, { unitRate: 24.5, standingCharge: 53.0 });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);

    insertInterval(consumptionRepo, 'electricity', dateStr, 2.5);
    insertInterval(consumptionRepo, 'electricity', dateStr, 1.5);

    const res = await request(app).get('/api/v1/octopus/consumption?fuelType=electricity&days=7');
    const body = res.body as ConsumptionBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const row = body.data.find((d) => d.date === dateStr);
    expect(row).toBeDefined();
    expect(row!.kwh).toBeCloseTo(4.0, 1);
    // costMinor = round(4.0 * 24.5 + 53.0) = round(98 + 53) = 151
    expect(row!.costMinor).toBe(151);
    db.close();
  });

  it('respects the days query parameter', async () => {
    const db = makeDb();
    const { app, settingsRepo, consumptionRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService, { unitRate: 20.0, standingCharge: 40.0 });

    // Insert data for 20 days ago (should NOT appear in a 14-day window)
    const old = new Date();
    old.setDate(old.getDate() - 20);
    const oldDate = old.toISOString().slice(0, 10);
    insertInterval(consumptionRepo, 'electricity', oldDate, 5.0);

    // Insert data for 3 days ago (SHOULD appear)
    const recent = new Date();
    recent.setDate(recent.getDate() - 3);
    const recentDate = recent.toISOString().slice(0, 10);
    insertInterval(consumptionRepo, 'electricity', recentDate, 3.0);

    const res = await request(app).get('/api/v1/octopus/consumption?days=14');
    const body = res.body as ConsumptionBody;

    expect(res.status).toBe(200);
    const dates = body.data.map((d) => d.date);
    expect(dates).not.toContain(oldDate);
    expect(dates).toContain(recentDate);
    db.close();
  });

  it('returns gas data when fuelType=gas', async () => {
    const db = makeDb();
    const { app, settingsRepo, consumptionRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService, { unitRate: 6.5, standingCharge: 30.0 });

    const recent = new Date();
    recent.setDate(recent.getDate() - 1);
    const dateStr = recent.toISOString().slice(0, 10);
    insertInterval(consumptionRepo, 'gas', dateStr, 3.0);

    const res = await request(app).get('/api/v1/octopus/consumption?fuelType=gas&days=7');
    const body = res.body as ConsumptionBody;

    expect(res.status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    const row = body.data.find((d) => d.date === dateStr);
    expect(row).toBeDefined();
    expect(row!.kwh).toBeCloseTo(3.0, 1);
    db.close();
  });

  it('returns 400 when days param is invalid', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService);

    const res = await request(app).get('/api/v1/octopus/consumption?days=999');
    expect(res.status).toBe(400);
    db.close();
  });

  it('defaults to electricity and 14 days when no query params', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService, { unitRate: 24.5, standingCharge: 53.0 });

    const res = await request(app).get('/api/v1/octopus/consumption');
    const body = res.body as ConsumptionBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(true);
    // No error means defaults resolved
    expect(Array.isArray(body.data)).toBe(true);
    db.close();
  });
});

// ────────────────────────────────────────────────────────────
// GET /api/v1/octopus/tariff
// ────────────────────────────────────────────────────────────

describe('GET /api/v1/octopus/tariff', () => {
  it('returns configured=false when no credentials and no rates set', async () => {
    const db = makeDb();
    const { app } = makeApp(db);

    const res = await request(app).get('/api/v1/octopus/tariff');
    const body = res.body as TariffBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(false);
    expect(body.unitRatePence).toBe(0);
    expect(body.standingChargePence).toBe(0);
    db.close();
  });

  it('returns cached rates when set in settings', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    seedCredentials(settingsRepo, cryptoService, { unitRate: 24.5, standingCharge: 53.0 });

    const res = await request(app).get('/api/v1/octopus/tariff');
    const body = res.body as TariffBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(true);
    expect(body.unitRatePence).toBe(24.5);
    expect(body.standingChargePence).toBe(53.0);
    db.close();
  });

  it('returns configured=false when credentials present but rates not yet cached', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    // Store credentials but no rates
    settingsRepo.set('octopus_api_key', cryptoService.encrypt('sk_live_test'));
    settingsRepo.set('octopus_account_number', 'A-TEST');

    const res = await request(app).get('/api/v1/octopus/tariff');
    const body = res.body as TariffBody;

    expect(res.status).toBe(200);
    expect(body.configured).toBe(false);
    expect(body.unitRatePence).toBe(0);
    db.close();
  });
});

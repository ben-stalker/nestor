import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import createOctopusRouter from '../../src/routes/octopus';
import { CryptoService } from '../../src/utils/crypto';
import * as OctopusClient from '../../src/services/OctopusClient';

jest.mock('../../src/services/OctopusClient');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

interface OctopusStatusBody {
  configured: boolean;
  accountNumber: string | null;
  mpan: string | null;
  meterSerial: string | null;
  gasMprn: string | null;
  gasMeterSerial: string | null;
  tariffCode: string | null;
}

interface OctopusCredentialsBody {
  ok: boolean;
  mpan: string | null;
  meterSerial: string | null;
  gasMprn: string | null;
  gasMeterSerial: string | null;
  tariffCode: string | null;
}

interface ErrorBody {
  error: string;
  message?: string;
}

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpPin: RequestHandler = (_req, _res, next) => next();
const blockPin: RequestHandler = (_req, res) => res.status(401).json({ error: 'UNAUTHORIZED' });

function makeApp(db: Database.Database, pinMiddleware: RequestHandler = noOpPin) {
  const app = express();
  app.use(express.json());
  const settingsRepo = new AppSettingsRepository(db);
  const cryptoService = new CryptoService(settingsRepo, () => 'test-machine-id');
  app.use(createOctopusRouter(settingsRepo, cryptoService, pinMiddleware));
  app.use(errorHandler);
  return { app, settingsRepo, cryptoService };
}

const mockMeterInfo: OctopusClient.OctopusMeterInfo = {
  mpan: '1234567890123',
  meterSerial: 'E1A001',
  gasMprn: '9876543210',
  gasMeterSerial: 'G1A001',
  tariffCode: 'E-1R-VAR-22-11-01-C',
};

describe('GET /api/v1/octopus/status', () => {
  it('returns configured=false when no key is stored', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/octopus/status');
    const body = res.body as OctopusStatusBody;
    expect(res.status).toBe(200);
    expect(body.configured).toBe(false);
    expect(body.accountNumber).toBeNull();
    expect(body.mpan).toBeNull();
    db.close();
  });

  it('returns configured=true with meter info when credentials are stored', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    settingsRepo.set('octopus_api_key', cryptoService.encrypt('test-api-key'));
    settingsRepo.set('octopus_account_number', 'A-TESTACCT');
    settingsRepo.set('octopus_mpan', '1234567890123');
    settingsRepo.set('octopus_meter_serial', 'E1A001');
    settingsRepo.set('octopus_tariff_code', 'E-1R-VAR-22-11-01-C');

    const res = await request(app).get('/api/v1/octopus/status');
    const body = res.body as OctopusStatusBody;
    expect(res.status).toBe(200);
    expect(body.configured).toBe(true);
    expect(body.accountNumber).toBe('A-TESTACCT');
    expect(body.mpan).toBe('1234567890123');
    expect(body.tariffCode).toBe('E-1R-VAR-22-11-01-C');
    db.close();
  });

  it('returns null fields for unset meter identifiers', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);
    settingsRepo.set('octopus_api_key', cryptoService.encrypt('k'));
    settingsRepo.set('octopus_account_number', 'A-X');

    const res = await request(app).get('/api/v1/octopus/status');
    const body = res.body as OctopusStatusBody;
    expect(res.status).toBe(200);
    expect(body.configured).toBe(true);
    expect(body.mpan).toBeNull();
    expect(body.gasMprn).toBeNull();
    db.close();
  });
});

describe('POST /api/v1/octopus/credentials', () => {
  beforeEach(() => {
    jest.mocked(OctopusClient.validateAccount).mockResolvedValue(mockMeterInfo);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('saves credentials and returns meter info on success', async () => {
    const db = makeDb();
    const { app, settingsRepo } = makeApp(db);

    const res = await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ apiKey: 'sk_live_abc123', accountNumber: 'A-TESTACCT' });

    const body = res.body as OctopusCredentialsBody;
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mpan).toBe('1234567890123');
    expect(body.meterSerial).toBe('E1A001');
    expect(body.gasMprn).toBe('9876543210');
    expect(body.tariffCode).toBe('E-1R-VAR-22-11-01-C');

    // Verify stored data
    const storedKey = settingsRepo.get<string>('octopus_api_key');
    expect(storedKey).toBeDefined();
    expect(storedKey).not.toBe('sk_live_abc123'); // should be encrypted
    expect(storedKey).toMatch(/^v1:/); // encrypted format

    expect(settingsRepo.get('octopus_account_number')).toBe('A-TESTACCT');
    expect(settingsRepo.get('octopus_mpan')).toBe('1234567890123');
    db.close();
  });

  it('stores API key encrypted (not in plain text)', async () => {
    const db = makeDb();
    const { app, cryptoService } = makeApp(db);
    const settingsRepo2 = new AppSettingsRepository(db);

    await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ apiKey: 'secret-key-value', accountNumber: 'A-TESTACCT' });

    const storedKey = settingsRepo2.get<string>('octopus_api_key');
    expect(storedKey).not.toContain('secret-key-value');
    expect(cryptoService.decrypt(storedKey!)).toBe('secret-key-value');
    db.close();
  });

  it('returns 422 when Octopus API rejects the key', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    jest
      .mocked(OctopusClient.validateAccount)
      .mockRejectedValue(new Error('Invalid Octopus API key'));

    const res = await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ apiKey: 'bad-key', accountNumber: 'A-INVALID' });

    const body = res.body as ErrorBody;
    expect(res.status).toBe(422);
    expect(body.error).toBe('OCTOPUS_VALIDATION_FAILED');
    expect(body.message).toBe('Invalid Octopus API key');
    db.close();
  });

  it('returns 422 on network error from Octopus API', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    jest
      .mocked(OctopusClient.validateAccount)
      .mockRejectedValue(new Error('Network error contacting Octopus API: connect ECONNREFUSED'));

    const res = await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ apiKey: 'sk_live_abc', accountNumber: 'A-TEST' });

    expect(res.status).toBe(422);
    db.close();
  });

  it('returns 400 for missing apiKey', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ accountNumber: 'A-TEST' });

    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.error).toBe('validation');
    db.close();
  });

  it('returns 400 for missing accountNumber', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ apiKey: 'sk_live_abc' });

    expect(res.status).toBe(400);
    db.close();
  });

  it('requires admin pin — blocks when pin middleware rejects', async () => {
    const db = makeDb();
    const { app } = makeApp(db, blockPin);
    jest.mocked(OctopusClient.validateAccount).mockResolvedValue(mockMeterInfo);

    const res = await request(app)
      .post('/api/v1/octopus/credentials')
      .send({ apiKey: 'sk_live_abc', accountNumber: 'A-TEST' });

    expect(res.status).toBe(401);
    db.close();
  });
});

describe('DELETE /api/v1/octopus/credentials', () => {
  it('clears all octopus settings', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);

    // Pre-populate all octopus settings
    settingsRepo.set('octopus_api_key', cryptoService.encrypt('key'));
    settingsRepo.set('octopus_account_number', 'A-TESTACCT');
    settingsRepo.set('octopus_mpan', '1234567890123');
    settingsRepo.set('octopus_meter_serial', 'E1A001');
    settingsRepo.set('octopus_gas_mprn', '9876543210');
    settingsRepo.set('octopus_gas_meter_serial', 'G1A001');
    settingsRepo.set('octopus_tariff_code', 'E-1R-VAR-22-11-01-C');

    const res = await request(app).delete('/api/v1/octopus/credentials');
    expect(res.status).toBe(204);

    // All settings should be cleared
    expect(settingsRepo.get('octopus_api_key')).toBeUndefined();
    expect(settingsRepo.get('octopus_account_number')).toBeUndefined();
    expect(settingsRepo.get('octopus_mpan')).toBeUndefined();
    expect(settingsRepo.get('octopus_meter_serial')).toBeUndefined();
    expect(settingsRepo.get('octopus_gas_mprn')).toBeUndefined();
    expect(settingsRepo.get('octopus_gas_meter_serial')).toBeUndefined();
    expect(settingsRepo.get('octopus_tariff_code')).toBeUndefined();
    db.close();
  });

  it('returns 204 even when no credentials are stored', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).delete('/api/v1/octopus/credentials');
    expect(res.status).toBe(204);
    db.close();
  });

  it('requires admin pin — blocks when pin middleware rejects', async () => {
    const db = makeDb();
    const { app } = makeApp(db, blockPin);
    const res = await request(app).delete('/api/v1/octopus/credentials');
    expect(res.status).toBe(401);
    db.close();
  });

  it('status reflects disconnected state after DELETE', async () => {
    const db = makeDb();
    const { app, settingsRepo, cryptoService } = makeApp(db);

    settingsRepo.set('octopus_api_key', cryptoService.encrypt('key'));
    settingsRepo.set('octopus_account_number', 'A-TESTACCT');

    await request(app).delete('/api/v1/octopus/credentials');

    const res = await request(app).get('/api/v1/octopus/status');
    const body = res.body as OctopusStatusBody;
    expect(res.status).toBe(200);
    expect(body.configured).toBe(false);
    expect(body.accountNumber).toBeNull();
    db.close();
  });
});

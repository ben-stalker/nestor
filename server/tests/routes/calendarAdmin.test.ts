import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import CalendarAccountRepository from '../../src/repositories/CalendarAccountRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import createGoogleCalendarRouter from '../../src/routes/googleCalendar';
import { initCrypto } from '../../src/utils/crypto';
import type CalendarService from '../../src/services/CalendarService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const stubCalService = {
  syncAccount: jest.fn().mockResolvedValue(undefined),
  syncAllAccounts: jest.fn().mockResolvedValue(undefined),
} as unknown as CalendarService;

function makeApp(accountRepo: CalendarAccountRepository, settingsRepo: AppSettingsRepository) {
  const app = express();
  app.use(express.json());
  app.use(createGoogleCalendarRouter(accountRepo, settingsRepo, stubCalService));
  app.use(errorHandler);
  return app;
}

describe('GET /api/v1/calendar/accounts', () => {
  it('returns empty list when no accounts', async () => {
    const db = makeDb();
    const accountRepo = new CalendarAccountRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(accountRepo, settingsRepo);

    const res = await request(app).get('/api/v1/calendar/accounts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns created accounts', async () => {
    const db = makeDb();
    const accountRepo = new CalendarAccountRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    initCrypto(settingsRepo);
    accountRepo.create({
      provider: 'apple',
      display_name: 'My iCloud',
      caldav_url: 'https://caldav.icloud.com',
      credentials: { username: 'user@me.com', password: 'app-pass' },
      sync_interval_mins: 15,
    });
    const app = makeApp(accountRepo, settingsRepo);

    const res = await request(app).get('/api/v1/calendar/accounts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as { display_name: string }[])[0].display_name).toBe('My iCloud');
  });
});

describe('DELETE /api/v1/calendar/accounts/:id', () => {
  it('deletes an account', async () => {
    const db = makeDb();
    const accountRepo = new CalendarAccountRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    initCrypto(settingsRepo);
    const acc = accountRepo.create({
      provider: 'apple',
      display_name: 'iCloud',
      caldav_url: null,
      credentials: {},
      sync_interval_mins: 15,
    });
    const app = makeApp(accountRepo, settingsRepo);

    const res = await request(app).delete(`/api/v1/calendar/accounts/${acc.id}`);
    expect(res.status).toBe(204);
    expect(accountRepo.list()).toHaveLength(0);
  });

  it('returns 404 for unknown account', async () => {
    const db = makeDb();
    const accountRepo = new CalendarAccountRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(accountRepo, settingsRepo);

    const res = await request(app).delete('/api/v1/calendar/accounts/9999');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/calendar/accounts/:id/sync-interval', () => {
  it('updates sync interval', async () => {
    const db = makeDb();
    const accountRepo = new CalendarAccountRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    initCrypto(settingsRepo);
    const acc = accountRepo.create({
      provider: 'google',
      display_name: 'Google',
      caldav_url: null,
      credentials: {},
      sync_interval_mins: 15,
    });
    const app = makeApp(accountRepo, settingsRepo);

    const res = await request(app)
      .patch(`/api/v1/calendar/accounts/${acc.id}/sync-interval`)
      .send({ interval: 30 });
    expect(res.status).toBe(204);
    expect(accountRepo.get(acc.id)?.sync_interval_mins).toBe(30);
  });
});

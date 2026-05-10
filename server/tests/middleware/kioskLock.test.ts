import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import createKioskLockMiddleware from '../../src/middleware/kioskLock';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(repo: AppSettingsRepository) {
  const app = express();
  app.use(express.json());
  app.use(createKioskLockMiddleware(repo));
  app.get('/test', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('kioskLock middleware', () => {
  let db: Database.Database;
  let repo: AppSettingsRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new AppSettingsRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('allows requests when kiosk_lock is not set', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);
  });

  it('allows requests when kiosk_lock is null', async () => {
    repo.set('kiosk_lock', null);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  it('blocks requests when kiosk_lock is set to a profile ID', async () => {
    repo.set('kiosk_lock', '42');
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
    expect((res.body as { code: string }).code).toBe('KIOSK_LOCKED');
  });

  it('returns the expected error message when blocked', async () => {
    repo.set('kiosk_lock', '1');
    const res = await request(app).get('/test');
    expect((res.body as { error: string }).error).toBe('Kiosk mode is active');
  });

  it('allows requests again after kiosk_lock is cleared', async () => {
    repo.set('kiosk_lock', '5');
    const blockedRes = await request(app).get('/test');
    expect(blockedRes.status).toBe(403);

    repo.delete('kiosk_lock');
    const allowedRes = await request(app).get('/test');
    expect(allowedRes.status).toBe(200);
  });
});

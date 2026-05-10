import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import createRequireAdminPin from '../../src/middleware/requireAdminPin';
import ProfileRepository from '../../src/repositories/ProfileRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(repo: ProfileRepository) {
  const app = express();
  app.use(express.json());
  app.use(createRequireAdminPin(repo));
  app.get('/test', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

interface ErrorBody {
  error: string;
  code: string;
}

describe('requireAdminPin middleware', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('returns 403 INVALID_ADMIN_PIN when X-Admin-Pin header is missing', async () => {
    repo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '1234' });
    const res = await request(app).get('/test');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('INVALID_ADMIN_PIN');
  });

  it('returns 403 INVALID_ADMIN_PIN when PIN is wrong', async () => {
    repo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '1234' });
    const res = await request(app).get('/test').set('X-Admin-Pin', 'wrong');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('INVALID_ADMIN_PIN');
  });

  it('returns 403 when no admin profiles exist', async () => {
    repo.create({ name: 'Child', type: 'child', colour: '#aabbcc', pin: '1234' });
    const res = await request(app).get('/test').set('X-Admin-Pin', '1234');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('INVALID_ADMIN_PIN');
  });

  it('returns 403 when admin has no PIN set', async () => {
    repo.create({ name: 'Admin', type: 'admin', colour: '#112233' });
    const res = await request(app).get('/test').set('X-Admin-Pin', 'anything');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('INVALID_ADMIN_PIN');
  });

  it('calls next() when the correct admin PIN is sent', async () => {
    repo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: 'secret' });
    const res = await request(app).get('/test').set('X-Admin-Pin', 'secret');
    expect(res.status).toBe(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);
  });

  it('accepts any admin PIN when multiple admins exist', async () => {
    repo.create({ name: 'Admin1', type: 'admin', colour: '#112233', pin: 'pin-one' });
    repo.create({ name: 'Admin2', type: 'admin', colour: '#445566', pin: 'pin-two' });
    const res1 = await request(app).get('/test').set('X-Admin-Pin', 'pin-one');
    expect(res1.status).toBe(200);
    const res2 = await request(app).get('/test').set('X-Admin-Pin', 'pin-two');
    expect(res2.status).toBe(200);
  });

  it('reuses cached hashes within 15s (does not re-query repo)', async () => {
    repo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: 'mypin' });
    const spy = jest.spyOn(repo, 'listAdminPinHashes');

    await request(app).get('/test').set('X-Admin-Pin', 'mypin');
    await request(app).get('/test').set('X-Admin-Pin', 'mypin');
    await request(app).get('/test').set('X-Admin-Pin', 'mypin');

    // Cache should mean the repo is only queried once across the three requests
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('re-queries repo after cache expires', async () => {
    jest.useFakeTimers();
    const freshDb = makeDb();
    const freshRepo = new ProfileRepository(freshDb);
    freshRepo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: 'mypin' });
    const freshApp = makeApp(freshRepo);
    const spy = jest.spyOn(freshRepo, 'listAdminPinHashes');

    await request(freshApp).get('/test').set('X-Admin-Pin', 'mypin');
    // Advance past the 15s TTL
    jest.advanceTimersByTime(16_000);
    await request(freshApp).get('/test').set('X-Admin-Pin', 'mypin');

    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
    jest.useRealTimers();
    freshDb.close();
  });
});

import Database from 'better-sqlite3';
import express, { type RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import createAdminRouter from '../../src/routes/admin';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

const noopLimiter: RequestHandler = (_req, _res, next) => next();

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(settingsRepo: AppSettingsRepository, profileRepo: ProfileRepository) {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/admin', createAdminRouter(settingsRepo, profileRepo, noopLimiter));
  app.use(errorHandler);
  return app;
}

interface ErrorBody {
  error: string;
  code: string;
}
interface ValidBody {
  valid: boolean;
}

describe('POST /api/v1/admin/kiosk-lock', () => {
  let db: Database.Database;
  let settingsRepo: AppSettingsRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    settingsRepo = new AppSettingsRepository(db);
    profileRepo = new ProfileRepository(db);
    app = makeApp(settingsRepo, profileRepo);
  });

  afterEach(() => db.close());

  it('sets kiosk_lock to the given profileId', async () => {
    const res = await request(app).post('/api/v1/admin/kiosk-lock').send({ profileId: '7' });
    expect(res.status).toBe(204);
    expect(settingsRepo.get<string>('kiosk_lock')).toBe('7');
  });

  it('returns 400 when profileId is missing', async () => {
    const res = await request(app).post('/api/v1/admin/kiosk-lock').send({});
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe('VALIDATION_ERROR');
  });

  it('overwrites a previous kiosk_lock value', async () => {
    settingsRepo.set('kiosk_lock', '1');
    await request(app).post('/api/v1/admin/kiosk-lock').send({ profileId: '2' });
    expect(settingsRepo.get<string>('kiosk_lock')).toBe('2');
  });
});

describe('POST /api/v1/admin/kiosk-unlock', () => {
  let db: Database.Database;
  let settingsRepo: AppSettingsRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    settingsRepo = new AppSettingsRepository(db);
    profileRepo = new ProfileRepository(db);
    app = makeApp(settingsRepo, profileRepo);
    // Set a locked state
    settingsRepo.set('kiosk_lock', '3');
  });

  afterEach(() => db.close());

  it('returns { valid: false } when no admin profiles exist', async () => {
    const res = await request(app).post('/api/v1/admin/kiosk-unlock').send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect((res.body as ValidBody).valid).toBe(false);
    // kiosk_lock is still set
    expect(settingsRepo.get<string>('kiosk_lock')).toBe('3');
  });

  it('returns { valid: false } when PIN is wrong', async () => {
    profileRepo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '9999' });
    const res = await request(app).post('/api/v1/admin/kiosk-unlock').send({ pin: '1111' });
    expect(res.status).toBe(200);
    expect((res.body as ValidBody).valid).toBe(false);
    expect(settingsRepo.get<string>('kiosk_lock')).toBe('3');
  });

  it('clears kiosk_lock and returns { valid: true } when PIN is correct', async () => {
    profileRepo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '4321' });
    const res = await request(app).post('/api/v1/admin/kiosk-unlock').send({ pin: '4321' });
    expect(res.status).toBe(200);
    expect((res.body as ValidBody).valid).toBe(true);
    expect(settingsRepo.get<string | null>('kiosk_lock')).toBeUndefined();
  });

  it('accepts PIN from any admin profile', async () => {
    profileRepo.create({ name: 'Admin1', type: 'admin', colour: '#112233', pin: 'aaaa' });
    profileRepo.create({ name: 'Admin2', type: 'admin', colour: '#445566', pin: 'bbbb' });

    const res = await request(app).post('/api/v1/admin/kiosk-unlock').send({ pin: 'bbbb' });
    expect((res.body as ValidBody).valid).toBe(true);
  });

  it('returns 400 when pin is missing', async () => {
    const res = await request(app).post('/api/v1/admin/kiosk-unlock').send({});
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/admin/verify-pin', () => {
  let db: Database.Database;
  let settingsRepo: AppSettingsRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    settingsRepo = new AppSettingsRepository(db);
    profileRepo = new ProfileRepository(db);
    app = makeApp(settingsRepo, profileRepo);
  });

  afterEach(() => db.close());

  it('returns { valid: false } when no admin profiles exist', async () => {
    const res = await request(app).post('/api/v1/admin/verify-pin').send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect((res.body as ValidBody).valid).toBe(false);
  });

  it('returns { valid: false } when PIN is wrong', async () => {
    profileRepo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '9999' });
    const res = await request(app).post('/api/v1/admin/verify-pin').send({ pin: '1111' });
    expect(res.status).toBe(200);
    expect((res.body as ValidBody).valid).toBe(false);
  });

  it('returns { valid: true } when PIN is correct and does NOT modify any state', async () => {
    profileRepo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '4321' });
    settingsRepo.set('kiosk_lock', '5');
    const res = await request(app).post('/api/v1/admin/verify-pin').send({ pin: '4321' });
    expect(res.status).toBe(200);
    expect((res.body as ValidBody).valid).toBe(true);
    // kiosk_lock must NOT be cleared — verify-pin has no side effects
    expect(settingsRepo.get<string>('kiosk_lock')).toBe('5');
  });

  it('accepts PIN from any admin profile', async () => {
    profileRepo.create({ name: 'Admin1', type: 'admin', colour: '#112233', pin: 'aaaa' });
    profileRepo.create({ name: 'Admin2', type: 'admin', colour: '#445566', pin: 'bbbb' });
    const res = await request(app).post('/api/v1/admin/verify-pin').send({ pin: 'bbbb' });
    expect((res.body as ValidBody).valid).toBe(true);
  });

  it('returns 400 when pin is missing', async () => {
    const res = await request(app).post('/api/v1/admin/verify-pin').send({});
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe('VALIDATION_ERROR');
  });
});

describe('kiosk-lock is not blocked by its own middleware', () => {
  it('activate and unlock routes work even when kiosk is locked', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const profileRepo = new ProfileRepository(db);

    // Apply the kiosk lock middleware manually to simulate a locked app
    const app = express();
    app.use(express.json());
    // Simulate kiosk middleware blocking on another route
    app.get('/blocked', (_req, res) => {
      const lock = settingsRepo.get<string | null>('kiosk_lock');
      if (lock) {
        res.status(403).json({ code: 'KIOSK_LOCKED' });
        return;
      }
      res.json({ ok: true });
    });
    // Admin routes NOT wrapped in kiosk middleware
    app.use('/api/v1/admin', createAdminRouter(settingsRepo, profileRepo, noopLimiter));
    app.use(errorHandler);

    profileRepo.create({ name: 'Admin', type: 'admin', colour: '#112233', pin: '5678' });
    settingsRepo.set('kiosk_lock', '10');

    // Blocked route is indeed blocked
    const blockedRes = await request(app).get('/blocked');
    expect(blockedRes.status).toBe(403);

    // Unlock still works
    const unlockRes = await request(app).post('/api/v1/admin/kiosk-unlock').send({ pin: '5678' });
    expect((unlockRes.body as ValidBody).valid).toBe(true);
    expect(settingsRepo.get('kiosk_lock')).toBeUndefined();

    db.close();
  });
});

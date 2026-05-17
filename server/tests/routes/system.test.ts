import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import createSettingsRouter from '../../src/routes/settings';
import createSystemRouter from '../../src/routes/system';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(settingsRepo: AppSettingsRepository, db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use(createSystemRouter(settingsRepo, db));
  app.use(errorHandler);
  return app;
}

describe('GET /api/v1/system/version', () => {
  it('returns version object', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/version');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('updateAvailable');
  });

  it('reflects update_available_version from settings', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('update_available_version', '2.0.0');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/version');
    expect(res.status).toBe(200);
    expect((res.body as { updateAvailable: string }).updateAvailable).toBe('2.0.0');
  });
});

describe('GET /api/v1/system/backup', () => {
  it('returns JSON attachment with settings', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'en');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/backup');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.body).toHaveProperty('settings');
    expect((res.body as { settings: Record<string, unknown> }).settings).toHaveProperty(
      'language',
      'en',
    );
  });
});

describe('POST /api/v1/system/restore', () => {
  it('restores settings from payload', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app)
      .post('/api/v1/system/restore')
      .send({ settings: { language: 'fr' } });
    expect(res.status).toBe(204);
    expect(settingsRepo.get('language')).toBe('fr');
  });

  it('returns 400 for invalid body', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app).post('/api/v1/system/restore').send('bad');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/system/factory-reset', () => {
  it('clears all data', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'en');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).post('/api/v1/system/factory-reset');
    expect(res.status).toBe(204);

    const after = settingsRepo.get('language');
    expect(after).toBeUndefined();
  });
});

describe('PATCH /api/v1/settings', () => {
  it('saves multiple settings keys', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = express();
    app.use(express.json());
    app.use('/api/v1/settings', createSettingsRouter(settingsRepo));
    app.use(errorHandler);

    const res = await request(app)
      .patch('/api/v1/settings')
      .send({ language: 'de', locale: 'de-DE' });
    expect(res.status).toBe(204);
    expect(settingsRepo.get('language')).toBe('de');
    expect(settingsRepo.get('locale')).toBe('de-DE');
  });
});

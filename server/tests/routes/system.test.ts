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

// A no-op admin pin middleware for tests (always passes)
const noopAdminPin = (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
  next();

function makeApp(settingsRepo: AppSettingsRepository, db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use(createSystemRouter(settingsRepo, db, noopAdminPin));
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

  it('includes hasUpdate flag', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('update_available_version', '99.0.0');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/version');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasUpdate');
  });
});

describe('POST /api/v1/system/update', () => {
  it('returns 202 with status updating', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app).post('/api/v1/system/update').send({});
    expect(res.status).toBe(202);
    expect((res.body as { status: string }).status).toBe('updating');
  });
});

describe('POST /api/v1/system/rollback', () => {
  it('returns 501 not implemented', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app).post('/api/v1/system/rollback').send({});
    expect(res.status).toBe(501);
    expect((res.body as { status: string }).status).toBe('not_implemented');
  });
});

describe('GET /api/v1/system/backup', () => {
  it('returns JSON attachment with tables key', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'en');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/backup');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.body).toHaveProperty('tables');
    expect(res.body).toHaveProperty('schema_version', 1);
    expect(res.body).toHaveProperty('exported_at');
  });

  it('includes settings data in the backup', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'en');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/backup');
    expect(res.status).toBe(200);
    // Legacy settings key for backwards compat
    expect(res.body).toHaveProperty('settings');
    expect((res.body as { settings: Record<string, unknown> }).settings).toHaveProperty(
      'language',
      'en',
    );
  });

  it('backup tables includes app_settings table', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'de');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).get('/api/v1/system/backup');
    expect(res.status).toBe(200);
    const body = res.body as { tables: Record<string, unknown[]> };
    expect(body.tables).toHaveProperty('app_settings');
    expect(Array.isArray(body.tables.app_settings)).toBe(true);
  });
});

describe('POST /api/v1/system/restore', () => {
  it('restores from new-format backup (schema_version 1)', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    // Build a valid new-format backup
    const backupRes = await request(app).get('/api/v1/system/backup');
    expect(backupRes.status).toBe(200);

    // Modify a setting, then restore the backup
    settingsRepo.set('language', 'fr');
    const backupBody = backupRes.body as Record<string, unknown>;
    const restoreRes = await request(app).post('/api/v1/system/restore').send(backupBody);
    expect(restoreRes.status).toBe(204);
  });

  it('restores settings from legacy-format backup', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app)
      .post('/api/v1/system/restore')
      .send({ settings: { language: 'fr' } });
    expect(res.status).toBe(204);
    expect(settingsRepo.get('language')).toBe('fr');
  });

  it('returns 400 for wrong schema_version', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app)
      .post('/api/v1/system/restore')
      .send({ schema_version: 99, tables: {}, exported_at: new Date().toISOString(), photos: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid body (no recognised keys)', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    const app = makeApp(settingsRepo, db);

    const res = await request(app).post('/api/v1/system/restore').send('bad');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/system/factory-reset', () => {
  it('clears all data and returns 204', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'en');
    const app = makeApp(settingsRepo, db);

    const res = await request(app).post('/api/v1/system/factory-reset');
    expect(res.status).toBe(204);

    // After reset, setup_complete is set to false
    const setupComplete = settingsRepo.get('setup_complete');
    expect(setupComplete).toBe(false);
  });

  it('wipes all settings rows and sets setup_complete to false', async () => {
    const db = makeDb();
    const settingsRepo = new AppSettingsRepository(db);
    settingsRepo.set('language', 'en');
    settingsRepo.set('locale', 'en-GB');
    const app = makeApp(settingsRepo, db);

    await request(app).post('/api/v1/system/factory-reset');

    // Only setup_complete should remain (set by the reset itself)
    const all = settingsRepo.getAll();
    expect(all).toHaveProperty('setup_complete', false);
    expect(all).not.toHaveProperty('language');
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

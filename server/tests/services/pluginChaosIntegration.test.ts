/**
 * Verifies plugin error isolation: when the chaos plugin always throws on init,
 * the core server endpoints remain healthy and no 500s propagate.
 */
import path from 'node:path';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import { initCrypto } from '../../src/utils/crypto';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import PluginSettingsRepository from '../../src/repositories/PluginSettingsRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import { PluginManager, setActivePluginManager } from '../../src/services/pluginManager';
import {
  clearPluginRegistry,
  scanPluginsDirectory,
  pluginRegistry,
} from '../../src/services/pluginLoader';
import { widgetRegistry } from '../../src/services/pluginRegistries';
import createPluginsRouter from '../../src/routes/plugins';
import healthRouter from '../../src/routes/health';
import errorHandler from '../../src/middleware/errorHandler';
import { noopAdminPin } from '../helpers/auth';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
const PLUGINS_DIR = path.join(__dirname, '..', '..', '..', 'plugins');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

describe('plugin chaos isolation', () => {
  let db: Database.Database;
  let app: express.Express;
  let pluginManager: PluginManager;

  beforeEach(async () => {
    clearPluginRegistry();
    widgetRegistry.clear();

    db = makeDb();
    const alertRepo = new AlertRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    const pluginSettingsRepo = new PluginSettingsRepository(db, {
      encrypt: (s) => s,
      decrypt: (s) => s,
    });

    // Force chaos plugin to always throw
    pluginSettingsRepo.set('_test-chaos', 'always_throw', 'true');

    scanPluginsDirectory(PLUGINS_DIR);
    pluginManager = new PluginManager({ alertRepo, settingsRepo, pluginSettingsRepo });
    setActivePluginManager(pluginManager);

    // Enable chaos plugin — should fail silently
    await pluginManager.enablePlugin('_test-chaos');

    app = express();
    app.use(express.json());
    app.use(healthRouter);
    app.use(
      createPluginsRouter({
        manager: pluginManager,
        settingsRepo,
        pluginSettingsRepo,
        requireAdminPin: noopAdminPin,
      }),
    );
    app.use(errorHandler);
  });

  afterEach(() => {
    clearPluginRegistry();
    widgetRegistry.clear();
    db.close();
  });

  it('chaos plugin registers as error state, not crashed', () => {
    const entry = pluginRegistry.get('_test-chaos');
    expect(entry?.status).toBe('error');
    expect(entry?.errorMessage).toBeTruthy();
  });

  it('health endpoint stays 200 with chaos plugin active', async () => {
    const checks = [1, 2, 3, 4, 5];
    const results = await Promise.all(checks.map(() => request(app).get('/health')));
    results.forEach((res) => expect(res.status).toBe(200));
  });

  it('plugin list endpoint returns 200 with chaos plugin in error state', async () => {
    const res = await request(app).get('/api/v1/plugins');
    expect(res.status).toBe(200);
    const body = res.body as Array<{ id: string; status: string }>;
    const chaos = body.find((p) => p.id === '_test-chaos');
    expect(chaos).toBeDefined();
    expect(chaos?.status).toBe('error');
  });

  it('enabling the chaos plugin again still does not crash the server', async () => {
    // Re-enabling an already-errored plugin should be safe
    const ok = await pluginManager.enablePlugin('_test-chaos');
    expect(ok).toBe(false);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

import path from 'node:path';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/db/migrationRunner';
import AlertRepository from '../../src/repositories/AlertRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import PluginSettingsRepository from '../../src/repositories/PluginSettingsRepository';
import { PluginManager } from '../../src/services/pluginManager';
import {
  clearPluginRegistry,
  scanPluginsDirectory,
  pluginRegistry,
} from '../../src/services/pluginLoader';
import { widgetRegistry } from '../../src/services/pluginRegistries';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
const PLUGINS_DIR = path.join(__dirname, '..', '..', '..', 'plugins');

describe('chaos plugin error isolation', () => {
  beforeEach(() => {
    clearPluginRegistry();
    widgetRegistry.clear();
  });

  it('always_throw=true causes error status without crashing manager', async () => {
    scanPluginsDirectory(PLUGINS_DIR);
    expect(pluginRegistry.has('_test-chaos')).toBe(true);
    const db = new Database(':memory:');
    runMigrations(db, MIGRATIONS_DIR);
    const alertRepo = new AlertRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    const pluginSettingsRepo = new PluginSettingsRepository(db, {
      encrypt: (s) => s,
      decrypt: (s) => s,
    });
    pluginSettingsRepo.set('_test-chaos', 'always_throw', 'true');
    const manager = new PluginManager({ alertRepo, settingsRepo, pluginSettingsRepo });
    const ok = await manager.enablePlugin('_test-chaos');
    expect(ok).toBe(false);
    const entry = pluginRegistry.get('_test-chaos');
    expect(entry?.status).toBe('error');
    expect(entry?.errorMessage).toContain('Chaos');
    db.close();
  });
});

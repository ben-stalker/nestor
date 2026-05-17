import fs from 'node:fs';
import os from 'node:os';
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
import {
  widgetRegistry,
  navModeRegistry,
  sidebarFilterRegistry,
  voiceHandlerRegistry,
  calendarSystemRegistry,
} from '../../src/services/pluginRegistries';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeTempPluginsDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nestor-plugins-'));
}

function writePlugin(
  dir: string,
  id: string,
  manifest: Record<string, unknown>,
  indexJs: string,
): void {
  const sub = path.join(dir, id);
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(
    path.join(sub, 'manifest.json'),
    JSON.stringify({ id, name: id, version: '0.1.0', author: 'T', ...manifest }),
    'utf8',
  );
  fs.writeFileSync(path.join(sub, 'index.js'), indexJs, 'utf8');
}

function makeManager(): {
  manager: PluginManager;
  db: Database.Database;
  alertRepo: AlertRepository;
  settingsRepo: AppSettingsRepository;
  pluginSettingsRepo: PluginSettingsRepository;
} {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  const alertRepo = new AlertRepository(db);
  const settingsRepo = new AppSettingsRepository(db);
  const pluginSettingsRepo = new PluginSettingsRepository(db, {
    encrypt: (s) => `enc(${s})`,
    decrypt: (s) => (s.startsWith('enc(') ? s.slice(4, -1) : ''),
  });
  const manager = new PluginManager({ alertRepo, settingsRepo, pluginSettingsRepo });
  return { manager, db, alertRepo, settingsRepo, pluginSettingsRepo };
}

describe('PluginManager', () => {
  beforeEach(() => {
    clearPluginRegistry();
    widgetRegistry.clear();
    navModeRegistry.clear();
    sidebarFilterRegistry.clear();
    voiceHandlerRegistry.clear();
    calendarSystemRegistry.clear();
  });

  it('enables a plugin and registers its widget', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'good',
      {},
      `module.exports = { init(ctx) { ctx.registerWidget({ id: 'w1', title: 'Hi' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { manager } = makeManager();
    const ok = await manager.enablePlugin('good');
    expect(ok).toBe(true);
    expect(widgetRegistry.size()).toBe(1);
    expect(pluginRegistry.get('good')?.status).toBe('enabled');
  });

  it('marks plugin as error and removes capabilities when init throws', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(dir, 'chaos', {}, `module.exports = { init() { throw new Error('explode'); } };`);
    scanPluginsDirectory(dir);
    const { manager } = makeManager();
    const ok = await manager.enablePlugin('chaos');
    expect(ok).toBe(false);
    const entry = pluginRegistry.get('chaos');
    expect(entry?.status).toBe('error');
    expect(entry?.errorMessage).toContain('explode');
    expect(widgetRegistry.size()).toBe(0);
  });

  it('disabling removes registered capabilities', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'multi',
      {},
      `module.exports = { init(ctx) {
        ctx.registerWidget({ id: 'w', title: 'W' });
        ctx.registerNavMode({ id: 'n', label: 'N' });
        ctx.registerSidebarFilter({ id: 'f', label: 'F' });
        ctx.registerVoiceHandler({ id: 'v', handler: () => null });
        ctx.registerCalendarSystem({ id: 'c', label: 'C' });
      } };`,
    );
    scanPluginsDirectory(dir);
    const { manager } = makeManager();
    await manager.enablePlugin('multi');
    expect(widgetRegistry.size()).toBe(1);
    expect(navModeRegistry.size()).toBe(1);
    await manager.disablePlugin('multi');
    expect(widgetRegistry.size()).toBe(0);
    expect(navModeRegistry.size()).toBe(0);
    expect(sidebarFilterRegistry.size()).toBe(0);
    expect(voiceHandlerRegistry.size()).toBe(0);
    expect(calendarSystemRegistry.size()).toBe(0);
    expect(pluginRegistry.get('multi')?.status).toBe('disabled');
  });

  it('pushAlert creates an alert tagged with plugin source', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'alerty',
      {},
      `module.exports = { init(ctx) { ctx.pushAlert({ message: 'hi from plugin', alertKey: 'k1' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { manager, alertRepo } = makeManager();
    await manager.enablePlugin('alerty');
    const active = alertRepo.listActive();
    expect(active).toHaveLength(1);
    expect(active[0].type).toBe('plugin:alerty');
    expect(active[0].message).toContain('k1');
  });

  it('pushAlert deduplicates same alertKey while enabled', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'dedupe',
      {},
      `module.exports = { init(ctx) {
        ctx.pushAlert({ message: 'one', alertKey: 'same' });
        ctx.pushAlert({ message: 'two', alertKey: 'same' });
      } };`,
    );
    scanPluginsDirectory(dir);
    const { manager, alertRepo } = makeManager();
    await manager.enablePlugin('dedupe');
    expect(alertRepo.listActive()).toHaveLength(1);
  });

  it('disable dismisses outstanding plugin alerts', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'dismissy',
      {},
      `module.exports = { init(ctx) { ctx.pushAlert({ message: 'live', alertKey: 'a' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { manager, alertRepo } = makeManager();
    await manager.enablePlugin('dismissy');
    expect(alertRepo.listActive()).toHaveLength(1);
    await manager.disablePlugin('dismissy');
    expect(alertRepo.listActive()).toHaveLength(0);
  });

  it('getSetting/setSetting round-trip through plugin settings repo', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(dir, 'setty', {}, `module.exports = { init(ctx) { ctx.setSetting('k', 'v'); } };`);
    scanPluginsDirectory(dir);
    const { manager, pluginSettingsRepo } = makeManager();
    await manager.enablePlugin('setty');
    expect(pluginSettingsRepo.get('setty', 'k')).toBe('v');
  });

  it('httpRequest enforces rate limit', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(dir, 'rate', {}, `module.exports = { init(ctx) { ctx.__test = ctx; } };`);
    scanPluginsDirectory(dir);
    const fetchFn = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok'),
        headers: new Map<string, string>(),
      }),
    ) as unknown as typeof fetch;
    const db = new Database(':memory:');
    runMigrations(db, MIGRATIONS_DIR);
    const alertRepo = new AlertRepository(db);
    const settingsRepo = new AppSettingsRepository(db);
    const pluginSettingsRepo = new PluginSettingsRepository(db, {
      encrypt: (s) => s,
      decrypt: (s) => s,
    });
    const manager = new PluginManager({ alertRepo, settingsRepo, pluginSettingsRepo, fetchFn });
    await manager.enablePlugin('rate');
    const ctx = manager.getContext('rate');
    expect(ctx).toBeDefined();
    // 10 should pass
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await ctx!.httpRequest('https://example.com');
    }
    await expect(ctx!.httpRequest('https://example.com')).rejects.toThrow(/rate limit/);
    db.close();
  });

  it('restartPlugin disables then enables', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'restarty',
      {},
      `let n = 0; module.exports = { init(ctx) { n += 1; ctx.registerWidget({ id: 'w' + n, title: 'x' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { manager } = makeManager();
    await manager.enablePlugin('restarty');
    expect(widgetRegistry.size()).toBe(1);
    await manager.restartPlugin('restarty');
    expect(widgetRegistry.size()).toBe(1);
    expect(pluginRegistry.get('restarty')?.status).toBe('enabled');
  });

  it('startEnabledFromSettings re-enables plugins listed in plugins_enabled', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'a1',
      {},
      `module.exports = { init(ctx) { ctx.registerWidget({ id: 'a1', title: 'A1' }); } };`,
    );
    writePlugin(
      dir,
      'a2',
      {},
      `module.exports = { init(ctx) { ctx.registerWidget({ id: 'a2', title: 'A2' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { manager, settingsRepo } = makeManager();
    settingsRepo.set('plugins_enabled', ['a1', 'a2']);
    await manager.startEnabledFromSettings();
    expect(widgetRegistry.size()).toBe(2);
  });
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/db/migrationRunner';
import AlertRepository from '../../src/repositories/AlertRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import PluginSettingsRepository from '../../src/repositories/PluginSettingsRepository';
import { PluginManager } from '../../src/services/pluginManager';
import {
  clearPluginRegistry,
  scanPluginsDirectory,
} from '../../src/services/pluginLoader';
import {
  widgetRegistry,
  navModeRegistry,
  sidebarFilterRegistry,
  voiceHandlerRegistry,
  calendarSystemRegistry,
} from '../../src/services/pluginRegistries';
import createPluginsRouter from '../../src/routes/plugins';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function noopRequireAdminPin(_req: express.Request, _res: express.Response, next: express.NextFunction): void {
  next();
}

function makeTempPluginsDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nestor-plugins-'));
}

function writePlugin(dir: string, id: string, indexJs: string): void {
  const sub = path.join(dir, id);
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(
    path.join(sub, 'manifest.json'),
    JSON.stringify({ id, name: id, version: '0.1.0', author: 'T' }),
    'utf8',
  );
  fs.writeFileSync(path.join(sub, 'index.js'), indexJs, 'utf8');
}

interface TestRig {
  app: express.Express;
  manager: PluginManager;
  db: Database.Database;
  pluginSettingsRepo: PluginSettingsRepository;
  settingsRepo: AppSettingsRepository;
}

function makeRig(opts?: { fetchFn?: typeof fetch }): TestRig {
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
  const app = express();
  app.use(express.json());
  app.use(
    createPluginsRouter({
      manager,
      settingsRepo,
      pluginSettingsRepo,
      requireAdminPin: noopRequireAdminPin,
      fetchFn: opts?.fetchFn,
    }),
  );
  return { app, manager, db, pluginSettingsRepo, settingsRepo };
}

describe('plugins routes', () => {
  beforeEach(() => {
    clearPluginRegistry();
    widgetRegistry.clear();
    navModeRegistry.clear();
    sidebarFilterRegistry.clear();
    voiceHandlerRegistry.clear();
    calendarSystemRegistry.clear();
  });

  it('GET /api/v1/plugins lists plugins with status', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(dir, 'alpha', `module.exports = { init() {} };`);
    scanPluginsDirectory(dir);
    const { app } = makeRig();
    const res = await request(app).get('/api/v1/plugins');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as { id: string; status: string }[])[0].id).toBe('alpha');
    expect((res.body as { id: string; status: string }[])[0].status).toBe('disabled');
  });

  it('POST /api/v1/plugins/:id/enable enables and POST /disable disables', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'beta',
      `module.exports = { init(ctx) { ctx.registerWidget({ id: 'b', title: 'B' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { app } = makeRig();
    const r1 = await request(app).post('/api/v1/plugins/beta/enable');
    expect(r1.status).toBe(204);
    expect(widgetRegistry.size()).toBe(1);
    const r2 = await request(app).post('/api/v1/plugins/beta/disable');
    expect(r2.status).toBe(204);
    expect(widgetRegistry.size()).toBe(0);
  });

  it('returns 404 when enabling unknown plugin', async () => {
    const { app } = makeRig();
    const res = await request(app).post('/api/v1/plugins/nope/enable');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/plugins/:id/settings returns decrypted plugin settings', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(dir, 'gamma', `module.exports = { init() {} };`);
    scanPluginsDirectory(dir);
    const { app, pluginSettingsRepo } = makeRig();
    pluginSettingsRepo.set('gamma', 'api_key', 'hello');
    const res = await request(app).get('/api/v1/plugins/gamma/settings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ api_key: 'hello' });
  });

  it('PUT /api/v1/plugins/:id/settings stores values', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(dir, 'delta', `module.exports = { init() {} };`);
    scanPluginsDirectory(dir);
    const { app, pluginSettingsRepo } = makeRig();
    const res = await request(app)
      .put('/api/v1/plugins/delta/settings')
      .send({ api_key: 'abc' });
    expect(res.status).toBe(204);
    expect(pluginSettingsRepo.get('delta', 'api_key')).toBe('abc');
  });

  it('GET /api/v1/plugins/registries returns capability snapshot', async () => {
    const dir = makeTempPluginsDir();
    writePlugin(
      dir,
      'epsilon',
      `module.exports = { init(ctx) { ctx.registerWidget({ id: 'e', title: 'E' }); } };`,
    );
    scanPluginsDirectory(dir);
    const { app } = makeRig();
    await request(app).post('/api/v1/plugins/epsilon/enable');
    const res = await request(app).get('/api/v1/plugins/registries');
    expect(res.status).toBe(200);
    const body = res.body as { widgets: unknown[]; navModes: unknown[] };
    expect(body.widgets).toHaveLength(1);
    expect(body.navModes).toEqual([]);
  });

  it('GET /api/v1/plugins/community returns empty when URL not configured', async () => {
    const { app } = makeRig();
    const res = await request(app).get('/api/v1/plugins/community');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: false, plugins: [] });
  });

  it('GET /api/v1/plugins/community fetches and parses index when configured', async () => {
    const fetchFn = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              plugins: [{ id: 'cool', name: 'Cool', description: 'd', author: 'a' }],
            }),
          ),
      }),
    ) as unknown as typeof fetch;
    const rig = makeRig({ fetchFn });
    rig.settingsRepo.set('community_plugin_index_url', 'https://example.com/index.json');
    const res = await request(rig.app).get('/api/v1/plugins/community');
    expect(res.status).toBe(200);
    expect((res.body as { configured: boolean }).configured).toBe(true);
    expect((res.body as { plugins: { id: string }[] }).plugins[0].id).toBe('cool');
  });

  it('POST /api/v1/plugins/community/install accepts intent', async () => {
    const { app } = makeRig();
    const res = await request(app)
      .post('/api/v1/plugins/community/install')
      .send({ id: 'cool', repoUrl: 'https://example.com/repo' });
    expect(res.status).toBe(202);
  });
});

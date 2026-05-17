import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import type PluginSettingsRepository from '../repositories/PluginSettingsRepository';
import type { PluginManager } from '../services/pluginManager';
import { listPlugins, getPlugin } from '../services/pluginLoader';
import { snapshotAllRegistries } from '../services/pluginRegistries';
import type { CommunityPluginEntry } from '../types/plugins';
import { PluginApiRiskSchema } from '../types/plugins';
import logger from '../utils/logger';

const SettingsBodySchema = z.record(z.string(), z.string());

const CommunityEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  author: z.string().default('unknown'),
  apiRisk: PluginApiRiskSchema.default('community'),
  repoUrl: z.string().url().optional(),
  homepageUrl: z.string().url().optional(),
});
const CommunityIndexSchema = z.object({
  plugins: z.array(CommunityEntrySchema),
});

export interface PluginsRouterDeps {
  manager: PluginManager;
  settingsRepo: AppSettingsRepository;
  pluginSettingsRepo: PluginSettingsRepository;
  requireAdminPin: RequestHandler;
  fetchFn?: typeof fetch;
}

export default function createPluginsRouter(deps: PluginsRouterDeps): Router {
  const router = Router();
  const { manager, settingsRepo, pluginSettingsRepo, requireAdminPin } = deps;
  const fetchImpl = deps.fetchFn ?? globalThis.fetch.bind(globalThis);

  // GET /api/v1/plugins — list installed plugins with status
  router.get('/api/v1/plugins', (_req, res) => {
    const plugins = listPlugins().map((p) => ({
      ...p.manifest,
      status: p.status,
      errorMessage: p.errorMessage,
    }));
    res.json(plugins);
  });

  // GET /api/v1/plugins/registries — snapshot of capability registries (for client hooks)
  router.get('/api/v1/plugins/registries', (_req, res) => {
    res.json(snapshotAllRegistries());
  });

  // GET /api/v1/plugins/community — fetch and parse the community index URL
  router.get('/api/v1/plugins/community', async (_req, res) => {
    const url = settingsRepo.get<string>('community_plugin_index_url');
    if (!url) {
      res.json({ configured: false, plugins: [] });
      return;
    }
    try {
      const resp = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) });
      if (!resp.ok) {
        res.status(502).json({ error: 'Failed to fetch community index', status: resp.status });
        return;
      }
      const text = await resp.text();
      const parsed = CommunityIndexSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        res.status(502).json({ error: 'Invalid community index', issues: parsed.error.issues });
        return;
      }
      const plugins: CommunityPluginEntry[] = parsed.data.plugins.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        author: p.author,
        apiRisk: p.apiRisk,
        repoUrl: p.repoUrl,
        homepageUrl: p.homepageUrl,
      }));
      res.json({ configured: true, plugins });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err, url }, 'pluginsRouter: community fetch failed');
      res.status(502).json({ error: 'Fetch failed', message });
    }
  });

  // POST /api/v1/plugins/community/install — placeholder (no git clone in test env)
  router.post('/api/v1/plugins/community/install', requireAdminPin, (req, res) => {
    const body = z
      .object({ id: z.string().min(1), repoUrl: z.string().url().optional() })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });
      return;
    }
    logger.info({ id: body.data.id, repoUrl: body.data.repoUrl }, 'community-install intent logged');
    res.status(202).json({ ok: true, message: 'Install request logged' });
  });

  function paramId(req: import('express').Request): string {
    const raw = req.params.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }

  router.post('/api/v1/plugins/:id/enable', requireAdminPin, async (req, res) => {
    const id = paramId(req);
    const entry = getPlugin(id);
    if (!entry) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    const ok = await manager.enablePlugin(id);
    if (!ok) {
      res.status(500).json({ error: 'Failed to enable plugin', message: entry.errorMessage });
      return;
    }
    res.status(204).end();
  });

  router.post('/api/v1/plugins/:id/disable', requireAdminPin, async (req, res) => {
    const id = paramId(req);
    const entry = getPlugin(id);
    if (!entry) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    await manager.disablePlugin(id);
    res.status(204).end();
  });

  router.post('/api/v1/plugins/:id/restart', requireAdminPin, async (req, res) => {
    const id = paramId(req);
    const entry = getPlugin(id);
    if (!entry) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    const ok = await manager.restartPlugin(id);
    res.status(ok ? 204 : 500).end();
  });

  router.get('/api/v1/plugins/:id/settings', requireAdminPin, (req, res) => {
    const id = paramId(req);
    const entry = getPlugin(id);
    if (!entry) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    const settings = pluginSettingsRepo.getAll(id);
    res.json(settings);
  });

  router.put('/api/v1/plugins/:id/settings', requireAdminPin, (req, res) => {
    const id = paramId(req);
    const entry = getPlugin(id);
    if (!entry) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    const parsed = SettingsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    Object.entries(parsed.data).forEach(([k, v]) => pluginSettingsRepo.set(id, k, v));
    res.status(204).end();
  });

  return router;
}

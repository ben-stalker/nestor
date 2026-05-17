import { execFile } from 'child_process';
import type Database from 'better-sqlite3';
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import logger from '../utils/logger';

// Version string — injected by the build or read from env; avoids runtime require().
const APP_VERSION = process.env.NESTOR_VERSION ?? 'unknown';

const ImportSchema = z.object({ settings: z.record(z.string(), z.unknown()).optional() });

export default function createSystemRouter(
  settingsRepo: AppSettingsRepository = new AppSettingsRepository(getDb()),
  db: Database.Database = getDb(),
): Router {
  const router = Router();

  // GET /api/v1/system/version — app version + update availability
  router.get('/api/v1/system/version', (_req, res) => {
    const updateAvailable = settingsRepo.get<string | null>('update_available_version') ?? null;
    res.json({ version: APP_VERSION, updateAvailable });
  });

  // POST /api/v1/system/update — trigger git pull + restart (best-effort)
  router.post('/api/v1/system/update', (_req, res) => {
    res.status(202).json({ message: 'Update initiated' });
    execFile(
      'sh',
      ['-c', 'git pull --rebase && npm run build && systemctl restart nestor-server'],
      (err) => {
        if (err) logger.warn({ err }, 'system update script failed');
      },
    );
  });

  // GET /api/v1/system/backup — export full settings as JSON download
  router.get('/api/v1/system/backup', (_req, res) => {
    const settings = settingsRepo.getAll();
    const payload = JSON.stringify(
      { version: 1, exported_at: new Date().toISOString(), settings },
      null,
      2,
    );
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="nestor-backup-${Date.now()}.json"`);
    res.send(payload);
  });

  // POST /api/v1/system/restore — import settings from JSON backup
  router.post('/api/v1/system/restore', (req, res) => {
    const result = ImportSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid backup file', details: result.error.flatten() });
      return;
    }
    if (result.data.settings) {
      try {
        settingsRepo.setMany(result.data.settings);
      } catch (err) {
        res.status(422).json({ error: 'Failed to restore settings', details: String(err) });
        return;
      }
    }
    res.status(204).end();
  });

  // POST /api/v1/system/factory-reset — wipe the database completely
  router.post('/api/v1/system/factory-reset', (_req, res) => {
    try {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
      tables.forEach(({ name }) => {
        db.prepare(`DELETE FROM ${name}`).run();
      });
      logger.warn('Factory reset executed — all data wiped');
      res.status(204).end();
    } catch (err) {
      logger.error({ err }, 'Factory reset failed');
      res.status(500).json({ error: 'Factory reset failed', details: String(err) });
    }
  });

  // GET /api/v1/system/tailscale — Tailscale status (read-only)
  router.get('/api/v1/system/tailscale', (_req, res) => {
    execFile('tailscale', ['status', '--json'], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        res.json({ available: false });
        return;
      }
      try {
        const status: unknown = JSON.parse(stdout);
        res.json({ available: true, status });
      } catch {
        res.json({ available: true, status: null });
      }
    });
  });

  // GET /api/v1/system/syncthing — Syncthing status (read-only ping)
  router.get('/api/v1/system/syncthing', (_req, res) => {
    const url = process.env.SYNCTHING_URL ?? 'http://127.0.0.1:8384';
    const apiKey = process.env.SYNCTHING_API_KEY ?? '';
    const headers: Record<string, string> = apiKey ? { 'X-API-Key': apiKey } : {};
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    fetch(`${url}/rest/system/ping`, { headers, signal: controller.signal })
      .then((r) => {
        clearTimeout(t);
        res.json({ available: r.ok });
      })
      .catch(() => {
        clearTimeout(t);
        res.json({ available: false });
      });
  });

  return router;
}

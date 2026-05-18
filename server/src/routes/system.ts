import { execFile } from 'child_process';
import type { RequestHandler } from 'express';
import type Database from 'better-sqlite3';
import { Router } from 'express';
import { getDb } from '../db/connection';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import ProfileRepository from '../repositories/ProfileRepository';
import { BackupService } from '../services/BackupService';
import { UpdateService } from '../services/UpdateService';
import createRequireAdminPin from '../middleware/requireAdminPin';
import logger from '../utils/logger';

export default function createSystemRouter(
  settingsRepo: AppSettingsRepository = new AppSettingsRepository(getDb()),
  db: Database.Database = getDb(),
  requireAdminPin: RequestHandler = createRequireAdminPin(new ProfileRepository(getDb())),
): Router {
  const router = Router();
  const updateService = new UpdateService(settingsRepo);

  // GET /api/v1/system/version — app version + update availability
  router.get('/api/v1/system/version', (_req, res) => {
    const { current, available, hasUpdate } = updateService.checkForUpdate();
    res.json({ version: current, updateAvailable: available, hasUpdate });
  });

  // POST /api/v1/system/update — trigger git pull + restart (admin pin required)
  router.post('/api/v1/system/update', requireAdminPin, (_req, res) => {
    res.status(202).json({ status: 'updating' });
    UpdateService.applyUpdate();
  });

  // POST /api/v1/system/rollback — stub rollback endpoint
  router.post('/api/v1/system/rollback', requireAdminPin, (_req, res) => {
    const result = UpdateService.rollback();
    if (result.status === 'not_implemented') {
      res.status(501).json({ status: 'not_implemented' });
      return;
    }
    res.status(202).json({ status: 'rolling_back' });
  });

  // GET /api/v1/system/backup — export all tables as JSON download
  router.get('/api/v1/system/backup', (_req, res) => {
    const payload = BackupService.exportAll(db);
    // Also include legacy `settings` key for backwards compat
    const body = { ...payload, settings: settingsRepo.getAll() };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="nestor-backup-${Date.now()}.json"`);
    res.send(JSON.stringify(body, null, 2));
  });

  // POST /api/v1/system/restore — import from JSON backup
  router.post('/api/v1/system/restore', (req, res) => {
    const body = req.body as unknown;

    // New-format backup: has schema_version + tables
    if (
      typeof body === 'object' &&
      body !== null &&
      'schema_version' in (body as Record<string, unknown>)
    ) {
      try {
        BackupService.importAll(db, body);
      } catch (err) {
        res.status(400).json({ error: 'Invalid backup file', details: String(err) });
        return;
      }
      res.status(204).end();
      return;
    }

    // Legacy-format backup: only has `settings` key
    if (
      typeof body === 'object' &&
      body !== null &&
      'settings' in (body as Record<string, unknown>)
    ) {
      const { settings } = body as Record<string, unknown>;
      if (typeof settings !== 'object' || settings === null) {
        res.status(400).json({ error: 'Invalid backup file: settings must be an object' });
        return;
      }
      try {
        settingsRepo.setMany(settings as Record<string, unknown>);
      } catch (err) {
        res.status(422).json({ error: 'Failed to restore settings', details: String(err) });
        return;
      }
      res.status(204).end();
      return;
    }

    res.status(400).json({ error: 'Invalid backup file' });
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
      // Mark setup as not complete
      settingsRepo.set('setup_complete', false);
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

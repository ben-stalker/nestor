import { Router } from 'express';
import { z } from 'zod';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import { getDb } from '../db/connection';

export default function createSettingsRouter(
  repo: AppSettingsRepository = new AppSettingsRepository(getDb()),
): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(repo.getAll());
  });

  // PATCH /api/v1/settings — update one or more settings keys
  router.patch('/', (req, res) => {
    const result = z.record(z.string(), z.unknown()).safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid body', details: result.error.flatten() });
      return;
    }
    try {
      repo.setMany(result.data);
      res.status(204).end();
    } catch (err) {
      res.status(422).json({ error: 'Failed to save settings', details: String(err) });
    }
  });

  return router;
}

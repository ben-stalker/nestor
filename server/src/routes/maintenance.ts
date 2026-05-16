import { Router } from 'express';
import type { RequestHandler } from 'express';
import HomeMaintenanceRepository from '../repositories/HomeMaintenanceRepository';
import {
  HomeMaintenanceInputSchema,
  HomeMaintenanceUpdateSchema,
  MAINTENANCE_TYPES,
} from '../types/house';

export default function createMaintenanceRouter(
  maintenanceRepo: HomeMaintenanceRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  router.get('/api/v1/maintenance', (req, res, next) => {
    try {
      const typeParam = req.query.type as string | undefined;
      if (typeParam && !MAINTENANCE_TYPES.includes(typeParam as never)) {
        res.status(400).json({ error: 'Invalid type', code: 'INVALID_TYPE' });
        return;
      }
      res.json(maintenanceRepo.list(typeParam as never));
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/maintenance', requireAdminPin, (req, res, next) => {
    try {
      const parsed = HomeMaintenanceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(maintenanceRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/maintenance/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = HomeMaintenanceUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const item = maintenanceRepo.update(id, parsed.data);
      if (!item) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/maintenance/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = maintenanceRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      maintenanceRepo.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

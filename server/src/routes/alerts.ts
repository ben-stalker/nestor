import { Router } from 'express';
import AlertRepository from '../repositories/AlertRepository';

export default function createAlertsRouter(alertRepo: AlertRepository): Router {
  const router = Router();

  router.get('/api/v1/alerts', (_req, res, next) => {
    try {
      const alerts = alertRepo.listActive();
      res.json(alerts);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/alerts/:id/dismiss', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res
          .status(400)
          .json({ error: 'INVALID_ID', message: 'Alert ID must be a positive integer' });
        return;
      }

      const alert = alertRepo.get(id);
      if (!alert) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Alert not found' });
        return;
      }

      alertRepo.dismiss(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

import { Router } from 'express';
import type { RequestHandler } from 'express';
import SubscriptionRepository from '../repositories/SubscriptionRepository';
import { SubscriptionInputSchema, SubscriptionUpdateSchema } from '../types/house';

export default function createSubscriptionsRouter(
  subRepo: SubscriptionRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  router.get('/api/v1/subscriptions', (_req, res, next) => {
    try {
      const items = subRepo.list();
      const totalMonthlyCost = items.reduce((sum, s) => sum + s.monthly_cost, 0);
      res.json({ subscriptions: items, totalMonthlyCost });
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/subscriptions', requireAdminPin, (req, res, next) => {
    try {
      const parsed = SubscriptionInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(subRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/subscriptions/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = SubscriptionUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const sub = subRepo.update(id, parsed.data);
      if (!sub) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(sub);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/subscriptions/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = subRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      subRepo.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

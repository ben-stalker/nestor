import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import BinScheduleRepository from '../repositories/BinScheduleRepository';
import { BinScheduleInputSchema, BinScheduleUpdateSchema } from '../types/house';
import { nextCollections } from '../services/binSchedule';

export default function createBinsRouter(
  binRepo: BinScheduleRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  router.get('/api/v1/bin-schedules', (_req, res, next) => {
    try {
      res.json(binRepo.list());
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/bin-schedules/upcoming', (req, res, next) => {
    try {
      const days = Math.min(Number(req.query.days ?? 14), 60);
      const bins = binRepo.list();
      const from = new Date();
      const result = bins.map((bin) => {
        const dates = nextCollections(
          {
            day_of_week: bin.day_of_week,
            frequency_weeks: bin.frequency_weeks,
            anchor_date: bin.anchor_date,
            bank_holiday_shift: bin.bank_holiday_shift,
          },
          from,
          days,
        )
          .filter((d) => {
            const diffDays = (d.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
            return diffDays <= days;
          })
          .map((d) => d.getTime());
        return { bin, dates };
      });
      res.json({ bins: result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/bin-schedules', requireAdminPin, (req, res, next) => {
    try {
      const parsed = BinScheduleInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(binRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/bin-schedules/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = BinScheduleUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const bin = binRepo.update(id, parsed.data);
      if (!bin) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(bin);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/bin-schedules/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = binRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      binRepo.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export { z };

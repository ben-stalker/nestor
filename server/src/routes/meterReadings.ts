import { Router } from 'express';
import type { RequestHandler } from 'express';
import MeterReadingRepository from '../repositories/MeterReadingRepository';
import { MeterReadingInputSchema, FUEL_TYPES } from '../types/house';

export default function createMeterReadingsRouter(
  meterRepo: MeterReadingRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  router.get('/api/v1/meter-readings', (req, res, next) => {
    try {
      const fuelType = req.query.fuelType as string | undefined;
      if (!fuelType || !FUEL_TYPES.includes(fuelType as never)) {
        res.status(400).json({ error: 'fuelType is required', code: 'MISSING_FUEL_TYPE' });
        return;
      }
      res.json(meterRepo.listByFuelType(fuelType));
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/meter-readings', requireAdminPin, (req, res, next) => {
    try {
      const parsed = MeterReadingInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(meterRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/meter-readings/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = meterRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      meterRepo.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

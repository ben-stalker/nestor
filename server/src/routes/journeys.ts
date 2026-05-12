import { Router } from 'express';
import { z } from 'zod';
import JourneyRepository from '../repositories/JourneyRepository';
import type { TransportAdapter } from '../services/TransportAdapter';
import { defaultAdapter } from '../services/TransportAdapter';

const TransportModeSchema = z.enum(['transit', 'drive', 'walk', 'cycle']);
const DaysActiveSchema = z.number().int().min(0).max(127);

const CreateJourneySchema = z.object({
  profile_id: z.number().int().positive(),
  label: z.string().min(1).max(100),
  origin: z.string().min(1).max(255),
  destination: z.string().min(1).max(255),
  transport_mode: TransportModeSchema.optional(),
  days_active: DaysActiveSchema.optional(),
  provider_id: z.string().optional(),
});

const UpdateJourneySchema = z.object({
  label: z.string().min(1).max(100).optional(),
  origin: z.string().min(1).max(255).optional(),
  destination: z.string().min(1).max(255).optional(),
  transport_mode: TransportModeSchema.optional(),
  days_active: DaysActiveSchema.optional(),
  provider_id: z.string().optional(),
});

export default function createJourneysRouter(
  journeyRepo: JourneyRepository,
  adapter: TransportAdapter = defaultAdapter,
): Router {
  const router = Router();

  router.get('/api/v1/journeys', (req, res, next) => {
    try {
      const profileId = Number(req.query.profile_id);
      if (!Number.isInteger(profileId) || profileId <= 0) {
        res
          .status(400)
          .json({ error: 'INVALID_PROFILE_ID', message: 'profile_id query param required' });
        return;
      }
      res.json(journeyRepo.listForProfile(profileId));
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/journeys/eta', async (req, res, next) => {
    try {
      const profileId = Number(req.query.profile_id);
      if (!Number.isInteger(profileId) || profileId <= 0) {
        res
          .status(400)
          .json({ error: 'INVALID_PROFILE_ID', message: 'profile_id query param required' });
        return;
      }

      const journeys = journeyRepo.listActiveToday(profileId);
      const etas = await Promise.all(journeys.map((j) => adapter.getEta(j)));
      res.json(etas);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/journeys', (req, res, next) => {
    try {
      const parsed = CreateJourneySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.message });
        return;
      }
      const journey = journeyRepo.create(parsed.data);
      res.status(201).json(journey);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/journeys/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }

      const existing = journeyRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const parsed = UpdateJourneySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.message });
        return;
      }

      const updated = journeyRepo.update(id, parsed.data);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/journeys/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }

      const deleted = journeyRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

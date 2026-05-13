import { Router } from 'express';
import { z } from 'zod';
import EventRepository from '../repositories/EventRepository';
import ProfileRepository from '../repositories/ProfileRepository';
import requirePermission from '../middleware/requirePermission';
import createRequireProfile from '../middleware/requireProfile';
import { EventInputSchema, EventUpdateSchema } from '../types/calendar';

export default function createCalendarRouter(
  eventRepo: EventRepository,
  profileRepo: ProfileRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  router.get('/api/v1/calendar/events', requireProfile, (req, res, next) => {
    try {
      const startRaw = Number(req.query.start);
      const endRaw = Number(req.query.end);

      if (!Number.isFinite(startRaw) || !Number.isFinite(endRaw)) {
        res.status(400).json({
          error: 'validation',
          code: 'INVALID_INPUT',
          details: ['start and end query params required as epoch ms'],
        });
        return;
      }

      let profileIds: number[] | undefined;
      const profileIdsRaw = req.query.profileIds;
      if (typeof profileIdsRaw === 'string' && profileIdsRaw.length > 0) {
        profileIds = profileIdsRaw
          .split(',')
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0);
      }

      const allEvents = eventRepo.findInRange(startRaw, endRaw, profileIds);
      // Custody events are only visible to admin profiles
      const isAdmin = req.profile?.type === 'admin';
      const events = isAdmin ? allEvents : allEvents.filter((e) => e.type !== 'custody');
      res.json(events);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/api/v1/calendar/events',
    requireProfile,
    requirePermission('add_calendar_event'),
    (req, res, next) => {
      try {
        const parsed = EventInputSchema.safeParse({ ...req.body, source: 'local' });
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }

        const event = eventRepo.create({ ...parsed.data, source: 'local' });
        res.status(201).json(event);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/api/v1/calendar/events/:id',
    requireProfile,
    requirePermission('edit_calendar_event'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }

        const existing = eventRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        if (existing.source !== 'local') {
          const isAdmin = req.profile?.type === 'admin';
          const hasAdminPin = typeof req.headers['x-admin-pin'] === 'string';
          if (!isAdmin || !hasAdminPin) {
            res
              .status(403)
              .json({ error: 'CalDAV events are read-only', code: 'CALDAV_READ_ONLY' });
            return;
          }
        }

        const parsed = EventUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }

        const updated = eventRepo.update(id, parsed.data);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/api/v1/calendar/events/:id',
    requireProfile,
    requirePermission('delete_calendar_event'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }

        const existing = eventRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        if (existing.source !== 'local') {
          const isAdmin = req.profile?.type === 'admin';
          const hasAdminPin = typeof req.headers['x-admin-pin'] === 'string';
          if (!isAdmin || !hasAdminPin) {
            res
              .status(403)
              .json({ error: 'CalDAV events are read-only', code: 'CALDAV_READ_ONLY' });
            return;
          }
        }

        eventRepo.delete(id);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

const RangeQuerySchema = z.object({
  start: z.string().transform(Number),
  end: z.string().transform(Number),
  profileIds: z.string().optional(),
});

export { RangeQuerySchema };

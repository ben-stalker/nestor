import { Router } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import type HealthLogRepository from '../repositories/HealthLogRepository';
import { HealthLogInput, HealthLogUpdateSchema } from '../types/healthLog';
import type { HealthLogType } from '../types/family';
import { renderHealthPdf } from '../services/healthPdf';
import { getScheduleForBaby } from '../services/VaccinationService';

export default function createHealthLogRouter(
  healthRepo: HealthLogRepository,
  profileRepo: ProfileRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // GET /api/v1/health-log/:profileId
  router.get(
    '/api/v1/health-log/:profileId',
    requireProfile,
    requirePermission('view_health_log'),
    (req, res, next) => {
      try {
        const profileId = Number(req.params.profileId);

        // Non-admin can only view own health log
        if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        const options: { logType?: HealthLogType; from?: number; to?: number } = {};
        if (req.query.logType) options.logType = req.query.logType as HealthLogType;
        if (req.query.from) options.from = Number(req.query.from);
        if (req.query.to) options.to = Number(req.query.to);

        res.json(healthRepo.listForProfile(profileId, options));
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/health-log/:profileId
  router.post(
    '/api/v1/health-log/:profileId',
    requireProfile,
    requirePermission('add_health_log'),
    (req, res, next) => {
      try {
        const profileId = Number(req.params.profileId);

        if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        const parsed = HealthLogInput.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const entry = healthRepo.create({
          profile_id: profileId,
          log_type: parsed.data.log_type,
          data_json: parsed.data as Record<string, unknown>,
          logged_at: Date.now(),
        });
        res.status(201).json(entry);
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/v1/health-log/:profileId/export.pdf — admin only
  router.get('/api/v1/health-log/:profileId/export.pdf', requireProfile, (req, res, next) => {
    void (async () => {
      try {
        if (req.profile!.type !== 'admin') {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        const profileId = Number(req.params.profileId);
        const profile = profileRepo.get(profileId);
        if (!profile) {
          res.status(404).json({ error: 'Profile not found', code: 'NOT_FOUND' });
          return;
        }

        const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
        const entries = healthRepo.listInRange(profileId, thirtyDaysAgo, Date.now());
        const pdf = await renderHealthPdf(entries, profile.name);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="health-log-${profileId}.pdf"`);
        res.send(Buffer.from(pdf));
      } catch (err) {
        next(err);
      }
    })();
  });

  // PATCH /api/v1/health-log/entries/:id
  router.patch(
    '/api/v1/health-log/entries/:id',
    requireProfile,
    requirePermission('add_health_log'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const entry = healthRepo.getById(id);
        if (!entry) {
          res.status(404).json({ error: 'Entry not found', code: 'NOT_FOUND' });
          return;
        }

        if (req.profile!.type !== 'admin' && req.profile!.id !== entry.profile_id) {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        const patch = HealthLogUpdateSchema.parse(req.body);
        const updated = healthRepo.update(id, patch);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/health-log/entries/:id
  router.delete(
    '/api/v1/health-log/entries/:id',
    requireProfile,
    requirePermission('add_health_log'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const entry = healthRepo.getById(id);
        if (!entry) {
          res.status(404).json({ error: 'Entry not found', code: 'NOT_FOUND' });
          return;
        }

        if (req.profile!.type !== 'admin' && req.profile!.id !== entry.profile_id) {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        healthRepo.delete(id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/v1/health-log/:profileId/baby-summary
  router.get('/api/v1/health-log/:profileId/baby-summary', requireProfile, (req, res, next) => {
    try {
      const profileId = Number(req.params.profileId);
      if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);

      const todayFeeds = healthRepo.listForProfile(profileId, {
        logType: 'feed',
        from: dayStart.getTime(),
        limit: 200,
      });
      const todayNappies = healthRepo.listForProfile(profileId, {
        logType: 'nappy',
        from: dayStart.getTime(),
        limit: 200,
      });
      const lastFeed = healthRepo.listForProfile(profileId, { logType: 'feed', limit: 1 });
      const lastSleep = healthRepo.listForProfile(profileId, { logType: 'sleep', limit: 1 });
      const recentAll = healthRepo.listForProfile(profileId, { limit: 20 });

      res.json({
        todayFeedCount: todayFeeds.length,
        todayNappyCount: todayNappies.length,
        lastFeedMs: lastFeed[0]?.logged_at ?? null,
        lastSleepEntry: lastSleep[0] ?? null,
        recentEntries: recentAll,
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/health-log/:profileId/mood-trend
  router.get('/api/v1/health-log/:profileId/mood-trend', requireProfile, (req, res, next) => {
    try {
      const profileId = Number(req.params.profileId);
      if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
      const entries = healthRepo.listForProfile(profileId, {
        logType: 'mood',
        from: thirtyDaysAgo,
        limit: 200,
      });

      // Group by ISO date (most recent per day wins)
      const byDay = entries.reduce<Map<string, { date: string; score: number }>>((acc, entry) => {
        const date = new Date(entry.logged_at).toISOString().slice(0, 10);
        if (!acc.has(date)) {
          acc.set(date, { date, score: Number(entry.data_json.score ?? 0) });
        }
        return acc;
      }, new Map());

      res.json(Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/health-log/:profileId/vaccinations
  router.get('/api/v1/health-log/:profileId/vaccinations', requireProfile, (req, res, next) => {
    try {
      const profileId = Number(req.params.profileId);
      if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const profile = profileRepo.get(profileId);
      if (!profile?.dob) {
        res.json([]);
        return;
      }

      const vaccinationLogs = healthRepo.listForProfile(profileId, {
        logType: 'vaccination',
        limit: 200,
      });
      const completedNames = vaccinationLogs.map((e) => String(e.data_json.name ?? ''));
      const schedule = getScheduleForBaby(profile.dob, completedNames);
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/health-log/:profileId/growth-data
  router.get('/api/v1/health-log/:profileId/growth-data', requireProfile, (req, res, next) => {
    try {
      const profileId = Number(req.params.profileId);
      if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const growthEntries = healthRepo.listForProfile(profileId, {
        logType: 'growth',
        limit: 500,
      });
      const weightEntries = healthRepo.listForProfile(profileId, {
        logType: 'weight',
        limit: 500,
      });

      const profile = profileRepo.get(profileId);
      const dobMs = profile?.dob ?? null;

      const points = [...growthEntries, ...weightEntries]
        .sort((a, b) => a.logged_at - b.logged_at)
        .map((e) => ({
          logged_at: e.logged_at,
          age_weeks: dobMs ? Math.floor((e.logged_at - dobMs) / (7 * 86_400_000)) : null,
          weight_kg: (e.data_json.weight_kg as number | undefined) ?? null,
          height_cm: (e.data_json.height_cm as number | undefined) ?? null,
          head_cm: (e.data_json.head_cm as number | undefined) ?? null,
          value_kg: (e.data_json.value_kg as number | undefined) ?? null,
        }));

      res.json({ dobMs, points });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

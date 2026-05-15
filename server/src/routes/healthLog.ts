import { Router } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import type HealthLogRepository from '../repositories/HealthLogRepository';
import { HealthLogInput, HealthLogUpdateSchema } from '../types/healthLog';
import type { HealthLogType } from '../types/family';
import { renderHealthPdf } from '../services/healthPdf';

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

  return router;
}

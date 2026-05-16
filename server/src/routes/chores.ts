import { Router } from 'express';
import type { RequestHandler } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import ChoreRepository from '../repositories/ChoreRepository';
import ChoreCompletionRepository from '../repositories/ChoreCompletionRepository';
import ChoreService, { AlreadyCompletedTodayError } from '../services/ChoreService';
import { ChoreInputSchema, ChoreUpdateSchema } from '../types/family';

export default function createChoresRouter(
  choreRepo: ChoreRepository,
  completionRepo: ChoreCompletionRepository,
  profileRepo: ProfileRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);
  const choreService = new ChoreService(choreRepo, completionRepo);

  // GET /api/v1/chores — list chores for a profile (or all for admin)
  router.get(
    '/api/v1/chores',
    requireProfile,
    requirePermission('view_chores'),
    (req, res, next) => {
      try {
        const filter: { assigned_profile_id?: number; adultOnly?: boolean } = {};
        if (req.query.profileId) {
          filter.assigned_profile_id = Number(req.query.profileId);
        } else if (req.profile!.type !== 'admin') {
          filter.assigned_profile_id = req.profile!.id;
        }
        if (req.query.profileType === 'adult') {
          filter.adultOnly = true;
        }
        res.json(choreRepo.list(filter));
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/chores — create (admin + admin pin)
  router.post(
    '/api/v1/chores',
    requireProfile,
    requirePermission('manage_chores'),
    requireAdminPin,
    (req, res, next) => {
      try {
        const parsed = ChoreInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const chore = choreRepo.create({
          ...parsed.data,
          points: parsed.data.points ?? 1,
          sort_order: parsed.data.sort_order ?? 0,
        });
        res.status(201).json(chore);
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /api/v1/chores/:id — update (admin + admin pin)
  router.patch(
    '/api/v1/chores/:id',
    requireProfile,
    requirePermission('manage_chores'),
    requireAdminPin,
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const parsedPatch = ChoreUpdateSchema.safeParse(req.body);
        if (!parsedPatch.success) {
          res.status(400).json({
            error: 'validation',
            code: 'INVALID_INPUT',
            details: parsedPatch.error.issues,
          });
          return;
        }
        const chore = choreRepo.update(id, parsedPatch.data);
        if (!chore) {
          res.status(404).json({ error: 'Chore not found', code: 'NOT_FOUND' });
          return;
        }
        res.json(chore);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/chores/:id — delete (admin + admin pin)
  router.delete(
    '/api/v1/chores/:id',
    requireProfile,
    requirePermission('manage_chores'),
    requireAdminPin,
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const chore = choreRepo.get(id);
        if (!chore) {
          res.status(404).json({ error: 'Chore not found', code: 'NOT_FOUND' });
          return;
        }
        choreRepo.delete(id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /api/v1/chores/:id/complete
  router.patch(
    '/api/v1/chores/:id/complete',
    requireProfile,
    requirePermission('complete_chore'),
    (req, res, next) => {
      try {
        const choreId = Number(req.params.id);
        const chore = choreRepo.get(choreId);
        if (!chore) {
          res.status(404).json({ error: 'Chore not found', code: 'NOT_FOUND' });
          return;
        }

        // Non-admin can only complete chores assigned to themselves (or unassigned)
        if (
          req.profile!.type !== 'admin' &&
          chore.assigned_profile_id !== null &&
          chore.assigned_profile_id !== req.profile!.id
        ) {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        const completion = choreService.complete(choreId, req.profile!.id);
        res.status(201).json(completion);
      } catch (err) {
        if (err instanceof AlreadyCompletedTodayError) {
          res.status(409).json({ error: err.message, code: 'ALREADY_COMPLETED_TODAY' });
          return;
        }
        next(err);
      }
    },
  );

  return router;
}

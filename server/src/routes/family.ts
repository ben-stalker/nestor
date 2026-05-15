import { Router } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import type ChoreRepository from '../repositories/ChoreRepository';
import type ChoreCompletionRepository from '../repositories/ChoreCompletionRepository';
import type RewardRedemptionRepository from '../repositories/RewardRedemptionRepository';
import type EventRepository from '../repositories/EventRepository';

const CHILD_TYPES = new Set(['baby', 'toddler', 'child', 'teen']);

function startOfDayMs(): number {
  const now = Date.now();
  return now - (now % 86_400_000);
}

export default function createFamilyRouter(
  profileRepo: ProfileRepository,
  choreRepo: ChoreRepository,
  completionRepo: ChoreCompletionRepository,
  redemptionRepo: RewardRedemptionRepository,
  eventRepo: EventRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // GET /api/v1/family/summary — one entry per child profile
  router.get(
    '/api/v1/family/summary',
    requireProfile,
    requirePermission('view_chores'),
    (_req, res, next) => {
      try {
        const children = profileRepo.list().filter((p) => CHILD_TYPES.has(p.type));
        const dayStart = startOfDayMs();
        const now = Date.now();
        const dayEnd = now + 7 * 86_400_000;

        const result = children.map((child) => {
          const todayChores = completionRepo.todayCount(child.id, dayStart);
          const todayChoreTotal = choreRepo.countAssigned(child.id);
          const pointsBalance = redemptionRepo.balance(child.id);

          // Find next upcoming event for this profile
          const upcoming = eventRepo.findInRange(now, dayEnd, [child.id]);
          const nextEvent = upcoming.length > 0 ? upcoming[0] : null;

          return {
            profile: child,
            todayChores,
            todayChoreTotal,
            pointsBalance,
            nextEvent,
          };
        });

        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

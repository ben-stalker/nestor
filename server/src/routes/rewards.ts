import { Router } from 'express';
import type { RequestHandler } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import type ProfileRepository from '../repositories/ProfileRepository';
import type ChoreCompletionRepository from '../repositories/ChoreCompletionRepository';
import type RewardRedemptionRepository from '../repositories/RewardRedemptionRepository';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import { RedemptionInputSchema } from '../types/family';

function computeStreak(byDay: { day: string; count: number }[]): number {
  if (byDay.length === 0) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const daySet = new Set(byDay.map((d) => d.day));
  const cursor = new Date(today);
  let key = cursor.toISOString().slice(0, 10);
  let streak = 0;

  while (daySet.has(key)) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    key = cursor.toISOString().slice(0, 10);
  }

  return streak;
}

export default function createRewardsRouter(
  completionRepo: ChoreCompletionRepository,
  redemptionRepo: RewardRedemptionRepository,
  profileRepo: ProfileRepository,
  requireAdminPin: RequestHandler,
  settingsRepo?: AppSettingsRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // GET /api/v1/rewards/:profileId — balance + recent history
  router.get('/api/v1/rewards/:profileId', requireProfile, (req, res, next) => {
    try {
      const profileId = Number(req.params.profileId);

      // Non-admin can only view own rewards
      if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const balance = redemptionRepo.balance(profileId);
      const recentCompletions = completionRepo.recent(profileId, 10);
      const recentRedemptions = redemptionRepo.recent(profileId, 10);
      res.json({ balance, recentCompletions, recentRedemptions });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/rewards/:profileId/grid — star grid data
  router.get('/api/v1/rewards/:profileId/grid', requireProfile, (req, res, next) => {
    try {
      const profileId = Number(req.params.profileId);

      if (req.profile!.type !== 'admin' && req.profile!.id !== profileId) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const balance = redemptionRepo.balance(profileId);
      const targetSetting = settingsRepo
        ? settingsRepo.get(`reward_targets.${profileId}`)
        : undefined;
      const target = typeof targetSetting === 'number' ? targetSetting : 10;
      const byDay = completionRepo.byDay(profileId, 30);
      const streak = computeStreak(byDay);

      const targetProfile = profileRepo.get(profileId);
      const conversionRate = targetProfile?.conversion_rate ?? 0;

      res.json({
        filled: balance % target,
        total: target,
        totalEarned: balance,
        streak,
        conversionRate,
        moneyEquivalent: conversionRate > 0 ? +(balance * conversionRate).toFixed(2) : null,
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/rewards/:profileId/redeem — admin only
  router.post(
    '/api/v1/rewards/:profileId/redeem',
    requireProfile,
    requireAdminPin,
    (req, res, next) => {
      try {
        if (req.profile!.type !== 'admin') {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        const profileId = Number(req.params.profileId);
        const parsed = RedemptionInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const input = parsed.data;

        const balance = redemptionRepo.balance(profileId);
        if (input.points_spent > balance) {
          res.status(400).json({ error: 'Insufficient points', code: 'INSUFFICIENT_POINTS' });
          return;
        }

        const redemption = redemptionRepo.push({
          profile_id: profileId,
          points_spent: input.points_spent,
          reward_label: input.reward_label,
          redeemed_at: Date.now(),
        });
        res.status(201).json(redemption);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

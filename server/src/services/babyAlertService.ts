import type HealthLogRepository from '../repositories/HealthLogRepository';
import type AlertRepository from '../repositories/AlertRepository';
import type ProfileRepository from '../repositories/ProfileRepository';

export default function evalFeedAlerts(
  profileRepo: ProfileRepository,
  healthRepo: HealthLogRepository,
  alertRepo: AlertRepository,
): void {
  const profiles = profileRepo.list().filter((p) => p.type === 'baby' && p.feed_alert_hours > 0);

  profiles.forEach((baby) => {
    const lastFeed = healthRepo.listForProfile(baby.id, { logType: 'feed', limit: 1 });
    const thresholdMs = baby.feed_alert_hours * 3_600_000;
    const lastFeedMs = lastFeed[0]?.logged_at ?? 0;
    const agoMs = Date.now() - lastFeedMs;

    if (agoMs >= thresholdMs) {
      const hoursAgo = Math.floor(agoMs / 3_600_000);
      const alertType = `baby_feed_overdue_${baby.id}`;
      const existing = alertRepo.listActive().find((a) => a.type === alertType);
      if (!existing) {
        alertRepo.create({
          type: alertType,
          severity: 'warning',
          message: `${baby.name} last fed ${hoursAgo}h ago — due a feed`,
          deep_link: '/family',
          profile_id: baby.id,
        });
      }
    }
  });
}

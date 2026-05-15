import BaseRepository from './BaseRepository';
import type { RewardRedemption } from '../types/family';

export default class RewardRedemptionRepository extends BaseRepository {
  push(redemption: Omit<RewardRedemption, 'id'>): RewardRedemption {
    const result = this.run(
      `INSERT INTO reward_redemptions (profile_id, points_spent, reward_label, redeemed_at)
       VALUES (?, ?, ?, ?)`,
      [
        redemption.profile_id,
        redemption.points_spent,
        redemption.reward_label,
        redemption.redeemed_at,
      ],
    );
    return this.queryOne<RewardRedemption>('SELECT * FROM reward_redemptions WHERE id = ?', [
      result.lastInsertRowid,
    ])!;
  }

  listForProfile(profileId: number, limit = 50): RewardRedemption[] {
    return this.all<RewardRedemption>(
      'SELECT * FROM reward_redemptions WHERE profile_id = ? ORDER BY redeemed_at DESC LIMIT ?',
      [profileId, limit],
    );
  }

  recent(profileId: number, limit: number): RewardRedemption[] {
    return this.listForProfile(profileId, limit);
  }

  balance(profileId: number): number {
    const earned =
      this.queryOne<{ p: number }>(
        'SELECT COALESCE(SUM(points_awarded), 0) AS p FROM chore_completions WHERE profile_id = ?',
        [profileId],
      )?.p ?? 0;
    const spent =
      this.queryOne<{ p: number }>(
        'SELECT COALESCE(SUM(points_spent), 0) AS p FROM reward_redemptions WHERE profile_id = ?',
        [profileId],
      )?.p ?? 0;
    return earned - spent;
  }
}

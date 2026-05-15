import BaseRepository from './BaseRepository';
import type { ChoreCompletion } from '../types/family';

export default class ChoreCompletionRepository extends BaseRepository {
  push(completion: Omit<ChoreCompletion, 'id'>): ChoreCompletion {
    const result = this.run(
      `INSERT INTO chore_completions (chore_id, profile_id, completed_at, points_awarded)
       VALUES (?, ?, ?, ?)`,
      [
        completion.chore_id,
        completion.profile_id,
        completion.completed_at,
        completion.points_awarded,
      ],
    );
    return this.queryOne<ChoreCompletion>('SELECT * FROM chore_completions WHERE id = ?', [
      result.lastInsertRowid,
    ])!;
  }

  listForProfile(profileId: number, limit = 50): ChoreCompletion[] {
    return this.all<ChoreCompletion>(
      'SELECT * FROM chore_completions WHERE profile_id = ? ORDER BY completed_at DESC LIMIT ?',
      [profileId, limit],
    );
  }

  recent(profileId: number, limit: number): ChoreCompletion[] {
    return this.listForProfile(profileId, limit);
  }

  todayCount(profileId: number, dayStartMs: number): number {
    const dayEndMs = dayStartMs + 86_400_000;
    const result = this.queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM chore_completions
       WHERE profile_id = ? AND completed_at >= ? AND completed_at < ?`,
      [profileId, dayStartMs, dayEndMs],
    );
    return result?.n ?? 0;
  }

  completedTodayForChore(choreId: number, profileId: number, dayStartMs: number): boolean {
    const dayEndMs = dayStartMs + 86_400_000;
    const result = this.queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM chore_completions
       WHERE chore_id = ? AND profile_id = ? AND completed_at >= ? AND completed_at < ?`,
      [choreId, profileId, dayStartMs, dayEndMs],
    );
    return (result?.n ?? 0) > 0;
  }

  byDay(profileId: number, daysBack: number): { day: string; count: number }[] {
    const cutoff = Date.now() - daysBack * 86_400_000;
    return this.all<{ day: string; count: number }>(
      `SELECT date(completed_at / 1000, 'unixepoch') AS day, COUNT(*) AS count
       FROM chore_completions
       WHERE profile_id = ? AND completed_at >= ?
       GROUP BY day
       ORDER BY day ASC`,
      [profileId, cutoff],
    );
  }
}

import type ChoreRepository from '../repositories/ChoreRepository';
import type ChoreCompletionRepository from '../repositories/ChoreCompletionRepository';
import type { Chore, ChoreCompletion } from '../types/family';
import { AlreadyCompletedTodayError } from '../errors/chore';

export { AlreadyCompletedTodayError };

export default class ChoreService {
  constructor(
    private readonly choreRepo: ChoreRepository,
    private readonly completionRepo: ChoreCompletionRepository,
  ) {}

  complete(choreId: number, profileId: number): ChoreCompletion {
    const chore = this.choreRepo.get(choreId);
    if (!chore) throw Object.assign(new Error('Chore not found'), { status: 404 });

    if (chore.frequency === 'daily') {
      const now = Date.now();
      const dayStart = now - (now % 86_400_000);
      if (this.completionRepo.completedTodayForChore(choreId, profileId, dayStart)) {
        throw new AlreadyCompletedTodayError();
      }
    }

    return this.completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: Date.now(),
      points_awarded: chore.points,
    });
  }

  getChore(id: number): Chore | undefined {
    return this.choreRepo.get(id);
  }
}

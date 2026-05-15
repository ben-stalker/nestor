// eslint-disable-next-line import/prefer-default-export
export class AlreadyCompletedTodayError extends Error {
  constructor() {
    super('Chore already completed today');
    this.name = 'AlreadyCompletedTodayError';
  }
}

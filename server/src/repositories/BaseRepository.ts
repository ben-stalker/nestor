import type Database from 'better-sqlite3';

abstract class BaseRepository {
  protected readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  protected get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare<unknown[], T>(sql).get(...params);
  }

  protected all<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare<unknown[], T>(sql).all(...params);
  }

  protected run(sql: string, params: unknown[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }
}

export default BaseRepository;

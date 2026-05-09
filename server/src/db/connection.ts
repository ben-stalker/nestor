import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;

  const dbPath =
    process.env.NESTOR_DB_PATH ??
    path.join(os.homedir(), '.nestor', 'nestor.db');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  instance = new Database(dbPath);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  instance.pragma('synchronous = NORMAL');

  return instance;
}

export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

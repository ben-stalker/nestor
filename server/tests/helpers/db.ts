import path from 'node:path';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/db/migrationRunner';
import { initCrypto } from '../../src/utils/crypto';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';

export const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

export function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

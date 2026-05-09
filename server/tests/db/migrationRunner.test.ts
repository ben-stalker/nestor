import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';

import { runMigrations } from '../../src/db/migrationRunner';

function makeTmpDir(): string {
  const dir = path.join(os.tmpdir(), crypto.randomUUID());
  fs.mkdirSync(dir);
  return dir;
}

function makeDb(): Database.Database {
  return new Database(path.join(os.tmpdir(), `${crypto.randomUUID()}.db`));
}

function writeMigration(dir: string, name: string, sql: string): void {
  fs.writeFileSync(path.join(dir, name), sql, 'utf8');
}

afterEach(() => {
  jest.resetModules();
});

test('applies three migrations in numeric order', () => {
  const dir = makeTmpDir();
  const db = makeDb();

  writeMigration(
    dir,
    '000_applied_migrations.sql',
    'CREATE TABLE IF NOT EXISTS applied_migrations (filename TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);',
  );
  writeMigration(dir, '001_alpha.sql', 'CREATE TABLE alpha (id INTEGER PRIMARY KEY);');
  writeMigration(dir, '002_beta.sql', 'CREATE TABLE beta  (id INTEGER PRIMARY KEY);');

  runMigrations(db, dir);

  const applied = db
    .prepare<[], { filename: string }>('SELECT filename FROM applied_migrations ORDER BY filename')
    .all()
    .map((r) => r.filename);

  expect(applied).toEqual(['000_applied_migrations.sql', '001_alpha.sql', '002_beta.sql']);

  db.close();
  fs.rmSync(dir, { recursive: true });
});

test('re-running is idempotent — no new migrations applied', () => {
  const dir = makeTmpDir();
  const db = makeDb();

  writeMigration(
    dir,
    '000_applied_migrations.sql',
    'CREATE TABLE IF NOT EXISTS applied_migrations (filename TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);',
  );
  writeMigration(dir, '001_things.sql', 'CREATE TABLE things (id INTEGER PRIMARY KEY);');

  runMigrations(db, dir);
  runMigrations(db, dir); // second run must not throw or double-apply

  const count = db.prepare<[], { c: number }>('SELECT COUNT(*) AS c FROM applied_migrations').get()!
    .c;

  expect(count).toBe(2); // 000 + 001
  db.close();
  fs.rmSync(dir, { recursive: true });
});

test('bad SQL in migration 002 rolls back — 001 stays applied, 002 not recorded', () => {
  const dir = makeTmpDir();
  const db = makeDb();

  writeMigration(
    dir,
    '000_applied_migrations.sql',
    'CREATE TABLE IF NOT EXISTS applied_migrations (filename TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);',
  );
  writeMigration(dir, '001_ok.sql', 'CREATE TABLE ok_table (id INTEGER PRIMARY KEY);');
  writeMigration(dir, '002_bad.sql', 'THIS IS NOT VALID SQL !!!');

  expect(() => runMigrations(db, dir)).toThrow();

  const applied = db
    .prepare<[], { filename: string }>('SELECT filename FROM applied_migrations')
    .all()
    .map((r) => r.filename);

  expect(applied).toContain('001_ok.sql');
  expect(applied).not.toContain('002_bad.sql');

  db.close();
  fs.rmSync(dir, { recursive: true });
});

test('malformed filenames are skipped with a warning', () => {
  const dir = makeTmpDir();
  const db = makeDb();

  writeMigration(
    dir,
    '000_applied_migrations.sql',
    'CREATE TABLE IF NOT EXISTS applied_migrations (filename TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);',
  );
  writeMigration(dir, 'bad-name.sql', 'SELECT 1;');
  writeMigration(dir, '001_valid.sql', 'CREATE TABLE valid_tbl (id INTEGER PRIMARY KEY);');

  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  runMigrations(db, dir);
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bad-name.sql'));
  warnSpy.mockRestore();

  const applied = db
    .prepare<[], { filename: string }>('SELECT filename FROM applied_migrations')
    .all()
    .map((r) => r.filename);

  expect(applied).not.toContain('bad-name.sql');

  db.close();
  fs.rmSync(dir, { recursive: true });
});

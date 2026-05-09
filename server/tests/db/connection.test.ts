import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { closeDb, getDb } from '../../src/db/connection';

const tmpDb = path.join(os.tmpdir(), `${crypto.randomUUID()}.db`);

beforeAll(() => {
  process.env.NESTOR_DB_PATH = tmpDb;
  getDb(); // trigger lazy init with tmpDb path
});

afterAll(() => {
  closeDb();
  fs.rmSync(tmpDb, { force: true });
  delete process.env.NESTOR_DB_PATH;
});

test('getDb returns the same instance on repeated calls', () => {
  const db1 = getDb();
  const db2 = getDb();
  expect(db1).toBe(db2);
});

test('journal_mode is WAL after open', () => {
  const result = getDb().pragma('journal_mode', { simple: true });
  expect(result).toBe('wal');
});

test('foreign_keys is ON after open', () => {
  const result = getDb().pragma('foreign_keys', { simple: true });
  expect(result).toBe(1);
});

test('DB file is created at NESTOR_DB_PATH', () => {
  expect(fs.existsSync(tmpDb)).toBe(true);
});

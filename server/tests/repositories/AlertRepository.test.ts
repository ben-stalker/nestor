import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import AlertRepository from '../../src/repositories/AlertRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

describe('AlertRepository', () => {
  let db: Database.Database;
  let repo: AlertRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new AlertRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('creates an alert with defaults', () => {
      const alert = repo.create({ type: 'test', message: 'Hello world' });
      expect(alert.id).toBeGreaterThan(0);
      expect(alert.type).toBe('test');
      expect(alert.severity).toBe('info');
      expect(alert.message).toBe('Hello world');
      expect(alert.dismissed).toBe(false);
    });

    it('creates an alert with specified severity', () => {
      const alert = repo.create({ type: 'test', severity: 'error', message: 'Broken' });
      expect(alert.severity).toBe('error');
    });
  });

  describe('listActive', () => {
    it('returns only non-dismissed alerts', () => {
      repo.create({ type: 'a', message: 'One' });
      const second = repo.create({ type: 'b', message: 'Two' });
      repo.dismiss(second.id);

      const active = repo.listActive();
      expect(active).toHaveLength(1);
      expect(active[0].message).toBe('One');
    });

    it('returns empty array when no active alerts', () => {
      expect(repo.listActive()).toHaveLength(0);
    });
  });

  describe('dismiss', () => {
    it('sets dismissed flag and returns true', () => {
      const alert = repo.create({ type: 'test', message: 'Hi' });
      const result = repo.dismiss(alert.id);
      expect(result).toBe(true);

      const updated = repo.get(alert.id);
      expect(updated?.dismissed).toBe(true);
      expect(updated?.dismissed_at).toBeGreaterThan(0);
    });

    it('returns false for already-dismissed alert', () => {
      const alert = repo.create({ type: 'test', message: 'Hi' });
      repo.dismiss(alert.id);
      const result = repo.dismiss(alert.id);
      expect(result).toBe(false);
    });

    it('returns false for non-existent id', () => {
      expect(repo.dismiss(9999)).toBe(false);
    });
  });
});

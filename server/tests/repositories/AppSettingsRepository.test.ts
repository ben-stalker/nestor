import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { validateSetting } from '../../src/db/settings-keys';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

describe('AppSettingsRepository', () => {
  let db: Database.Database;
  let repo: AppSettingsRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new AppSettingsRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('get / set round-trips', () => {
    it('stores and retrieves an object', () => {
      repo.set('foo', { a: 1 });
      expect(repo.get('foo')).toEqual({ a: 1 });
    });

    it('stores and retrieves a string (not double-encoded)', () => {
      repo.set('language', 'en');
      expect(repo.get('language')).toBe('en');
    });

    it('stores and retrieves a number', () => {
      repo.set('vehicle_reminder_days', 30);
      expect(repo.get('vehicle_reminder_days')).toBe(30);
    });

    it('stores and retrieves a boolean', () => {
      repo.set('setup_complete', true);
      expect(repo.get('setup_complete')).toBe(true);
    });

    it('stores and retrieves an array', () => {
      repo.set('plugins_enabled', ['a', 'b']);
      expect(repo.get('plugins_enabled')).toEqual(['a', 'b']);
    });

    it('stores and retrieves a nested object', () => {
      const val = { a: { b: { c: 42 } } };
      repo.set('deep', val);
      expect(repo.get('deep')).toEqual(val);
    });
  });

  describe('getAll', () => {
    it('returns all stored settings as a record', () => {
      repo.set('language', 'fr');
      repo.set('setup_complete', false);
      const all = repo.getAll();
      expect(all.language).toBe('fr');
      expect(all.setup_complete).toBe(false);
    });

    it('returns an empty record when table is empty', () => {
      expect(repo.getAll()).toEqual({});
    });
  });

  describe('cache behaviour', () => {
    it('reads from DB on first call and uses cache on second', () => {
      repo.set('language', 'de');

      const prepSpy = jest.spyOn(db, 'prepare');
      repo.getAll(); // populates cache
      const callsAfterFirst = prepSpy.mock.calls.length;
      repo.getAll(); // should hit cache — no new prepare calls
      expect(prepSpy.mock.calls.length).toBe(callsAfterFirst);
    });

    it('invalidates cache after set()', () => {
      repo.set('language', 'en');
      repo.getAll(); // populate cache

      repo.set('language', 'fr');

      const prepSpy = jest.spyOn(db, 'prepare');
      repo.getAll(); // must re-query DB
      expect(prepSpy).toHaveBeenCalled();
      expect(repo.get('language')).toBe('fr');
    });

    it('invalidates cache after setMany()', () => {
      repo.setMany({ a: 1, b: 2 });
      repo.getAll(); // populate cache

      const prepSpy = jest.spyOn(db, 'prepare');
      repo.setMany({ a: 10 });
      repo.getAll();
      expect(prepSpy).toHaveBeenCalled();
      expect(repo.get<number>('a')).toBe(10);
    });

    it('invalidates cache after delete()', () => {
      repo.set('language', 'en');
      repo.getAll(); // populate cache

      repo.delete('language');
      expect(repo.get('language')).toBeUndefined();
    });
  });

  describe('setMany', () => {
    it('writes multiple keys atomically', () => {
      repo.setMany({ a: 1, b: 2 });
      expect(repo.get<number>('a')).toBe(1);
      expect(repo.get<number>('b')).toBe(2);
    });

    it('rolls back all writes if one fails', () => {
      let callCount = 0;
      const originalRun = (repo as unknown as { run: (...a: unknown[]) => unknown }).run.bind(repo);
      jest
        .spyOn(repo as unknown as { run: (...a: unknown[]) => unknown }, 'run')
        .mockImplementation((...args: unknown[]) => {
          callCount += 1;
          if (callCount === 2) throw new Error('simulated failure');
          return originalRun(...args);
        });

      expect(() => repo.setMany({ x: 1, y: 2 })).toThrow('simulated failure');
      expect(repo.get('x')).toBeUndefined();
      expect(repo.get('y')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes a key', () => {
      repo.set('language', 'en');
      repo.delete('language');
      expect(repo.get('language')).toBeUndefined();
    });

    it('is a no-op for non-existent keys', () => {
      expect(() => repo.delete('nonexistent')).not.toThrow();
    });
  });

  describe('validateSetting', () => {
    it('passes for a valid known key', () => {
      expect(() => validateSetting('language', 'en')).not.toThrow();
    });

    it('throws for an invalid value on a known key', () => {
      expect(() => validateSetting('setup_complete', 'not-a-boolean')).toThrow();
    });

    it('is a no-op for unknown keys', () => {
      expect(() => validateSetting('unknown_key', { anything: true })).not.toThrow();
    });
  });
});

import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import CalendarAccountRepository from '../../src/repositories/CalendarAccountRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

describe('CalendarAccountRepository', () => {
  let db: Database.Database;
  let repo: CalendarAccountRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new CalendarAccountRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create / list / get', () => {
    it('creates and retrieves an account', () => {
      const account = repo.create({
        provider: 'custom',
        display_name: 'My CalDAV',
        caldav_url: null,
        credentials: { password: 's3cr3t' },
        sync_interval_mins: 30,
      });
      expect(account.id).toBeGreaterThan(0);
      expect(account.display_name).toBe('My CalDAV');
      expect(account.provider).toBe('custom');
      expect(account.sync_interval_mins).toBe(30);
      expect(account.active).toBe(1);
    });

    it('list returns all accounts', () => {
      repo.create({ provider: 'google', display_name: 'G', credentials: { token: 'x' } });
      repo.create({ provider: 'apple', display_name: 'A', credentials: { token: 'y' } });
      expect(repo.list()).toHaveLength(2);
    });

    it('get returns undefined for missing id', () => {
      expect(repo.get(9999)).toBeUndefined();
    });
  });

  describe('credentials encryption', () => {
    it('credentials encrypted in DB but decryptable via getCredentials', () => {
      const account = repo.create({
        provider: 'custom',
        display_name: 'Test',
        credentials: { password: 'hunter2', refresh_token: 'abc' },
      });

      const row = db
        .prepare<
          [number],
          { credentials_encrypted: string }
        >('SELECT credentials_encrypted FROM calendar_accounts WHERE id = ?')
        .get(account.id);
      expect(row?.credentials_encrypted).not.toContain('hunter2');

      const creds = repo.getCredentials(account.id);
      expect(creds.password).toBe('hunter2');
      expect(creds.refresh_token).toBe('abc');
    });

    it('tampered credentials_encrypted throws on getCredentials', () => {
      const account = repo.create({
        provider: 'custom',
        display_name: 'Test',
        credentials: { password: 'secret' },
      });
      db.prepare('UPDATE calendar_accounts SET credentials_encrypted = ? WHERE id = ?').run(
        'v1:AAAA:BBBB:CCCC',
        account.id,
      );
      expect(() => repo.getCredentials(account.id)).toThrow();
    });
  });

  describe('update', () => {
    it('updates fields', () => {
      const account = repo.create({
        provider: 'custom',
        display_name: 'Old Name',
        credentials: { token: 'x' },
      });
      const updated = repo.update(account.id, { display_name: 'New Name', sync_interval_mins: 60 });
      expect(updated?.display_name).toBe('New Name');
      expect(updated?.sync_interval_mins).toBe(60);
    });

    it('re-encrypts credentials on update', () => {
      const account = repo.create({
        provider: 'custom',
        display_name: 'Test',
        credentials: { token: 'old' },
      });
      repo.update(account.id, { credentials: { token: 'new' } });
      const creds = repo.getCredentials(account.id);
      expect(creds.token).toBe('new');
    });

    it('returns undefined for missing id', () => {
      expect(repo.update(9999, { display_name: 'X' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes existing account', () => {
      const account = repo.create({
        provider: 'custom',
        display_name: 'Test',
        credentials: {},
      });
      expect(repo.delete(account.id)).toBe(true);
      expect(repo.get(account.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(9999)).toBe(false);
    });
  });

  describe('markSynced', () => {
    it('sets last_sync_at on success', () => {
      const account = repo.create({ provider: 'custom', display_name: 'T', credentials: {} });
      repo.markSynced(account.id);
      const updated = repo.get(account.id);
      expect(updated?.last_sync_at).toBeGreaterThan(0);
      expect(updated?.last_sync_error).toBeNull();
    });

    it('sets last_sync_error on failure', () => {
      const account = repo.create({ provider: 'custom', display_name: 'T', credentials: {} });
      repo.markSynced(account.id, 'connection refused');
      const updated = repo.get(account.id);
      expect(updated?.last_sync_error).toBe('connection refused');
    });
  });

  describe('listActive', () => {
    it('returns only active accounts', () => {
      const a = repo.create({ provider: 'custom', display_name: 'Active', credentials: {} });
      const b = repo.create({ provider: 'google', display_name: 'Inactive', credentials: {} });
      repo.update(b.id, { active: 0 });
      const active = repo.listActive();
      expect(active.map((x) => x.id)).toContain(a.id);
      expect(active.map((x) => x.id)).not.toContain(b.id);
    });
  });
});

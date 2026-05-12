import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import EventRepository from '../../src/repositories/EventRepository';
import CalendarAccountRepository from '../../src/repositories/CalendarAccountRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
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

const NOW = 1_700_000_000_000;
const HOUR_MS = 3_600_000;

function makeEvent(overrides = {}) {
  return {
    title: 'Test Event',
    start_datetime: NOW,
    end_datetime: NOW + HOUR_MS,
    all_day: false as boolean,
    source: 'local' as const,
    type: 'default' as const,
    ...overrides,
  };
}

describe('EventRepository', () => {
  let db: Database.Database;
  let repo: EventRepository;
  let accountRepo: CalendarAccountRepository;
  let profileRepo: ProfileRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new EventRepository(db);
    accountRepo = new CalendarAccountRepository(db);
    profileRepo = new ProfileRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create / get', () => {
    it('creates an event and retrieves it by id', () => {
      const event = repo.create(makeEvent());
      expect(event.id).toBeGreaterThan(0);
      expect(event.title).toBe('Test Event');
      expect(event.source).toBe('local');
      expect(event.type).toBe('default');
      expect(event.created_at).toBeGreaterThan(0);
    });

    it('returns undefined for missing id', () => {
      expect(repo.get(9999)).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates specified fields', () => {
      const event = repo.create(makeEvent({ title: 'Old' }));
      const updated = repo.update(event.id, { title: 'New', type: 'wfh' });
      expect(updated?.title).toBe('New');
      expect(updated?.type).toBe('wfh');
    });

    it('returns undefined for missing id', () => {
      expect(repo.update(9999, { title: 'X' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes existing event', () => {
      const event = repo.create(makeEvent());
      expect(repo.delete(event.id)).toBe(true);
      expect(repo.get(event.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(9999)).toBe(false);
    });
  });

  describe('findInRange', () => {
    it('returns event within window', () => {
      repo.create(makeEvent({ start_datetime: NOW, end_datetime: NOW + HOUR_MS }));
      const results = repo.findInRange(NOW - HOUR_MS, NOW + 2 * HOUR_MS);
      expect(results).toHaveLength(1);
    });

    it('excludes event outside window', () => {
      repo.create(
        makeEvent({ start_datetime: NOW + 10 * HOUR_MS, end_datetime: NOW + 11 * HOUR_MS }),
      );
      const results = repo.findInRange(NOW, NOW + HOUR_MS);
      expect(results).toHaveLength(0);
    });

    it('includes null-profile events regardless of profileIds filter', () => {
      repo.create(makeEvent({ profile_id: null }));
      const results = repo.findInRange(NOW - HOUR_MS, NOW + 2 * HOUR_MS, [42]);
      expect(results).toHaveLength(1);
    });

    it('profile-scoped find returns only specified profiles plus null', () => {
      const profile = profileRepo.create({
        name: 'A',
        type: 'admin',
        colour: '#FFFFFF',
        text_size: 'default',
        simplified_nav: 0,
      });
      const other = profileRepo.create({
        name: 'B',
        type: 'teen',
        colour: '#0000FF',
        text_size: 'default',
        simplified_nav: 0,
      });
      repo.create(makeEvent({ profile_id: profile.id }));
      repo.create(makeEvent({ title: 'Other Profile', profile_id: other.id }));
      repo.create(makeEvent({ title: 'No Profile', profile_id: null }));

      const results = repo.findInRange(NOW - HOUR_MS, NOW + 2 * HOUR_MS, [profile.id]);
      const titles = results.map((e) => e.title);
      expect(titles).toContain('Test Event');
      expect(titles).toContain('No Profile');
      expect(titles).not.toContain('Other Profile');
    });
  });

  describe('upsertByCaldavUid', () => {
    it('creates a new event on first call', () => {
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });
      const event = repo.upsertByCaldavUid(
        account.id,
        'uid-001',
        makeEvent({ title: 'CalDAV Event' }),
      );
      expect(event.caldav_uid).toBe('uid-001');
      expect(event.source).toBe('caldav');
    });

    it('updates same row on second call (id stability)', () => {
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });
      const first = repo.upsertByCaldavUid(account.id, 'uid-001', makeEvent({ title: 'V1' }));
      const second = repo.upsertByCaldavUid(account.id, 'uid-001', makeEvent({ title: 'V2' }));
      expect(second.id).toBe(first.id);
      expect(second.title).toBe('V2');
    });
  });

  describe('cascade deletes', () => {
    it('deleting account cascades to its events', () => {
      const account = accountRepo.create({
        provider: 'custom',
        display_name: 'T',
        credentials: {},
      });
      const event = repo.create(
        makeEvent({ account_id: account.id, source: 'caldav', caldav_uid: 'u1' }),
      );
      accountRepo.delete(account.id);
      expect(repo.get(event.id)).toBeUndefined();
    });

    it('deleting profile sets profile_id to NULL on events', () => {
      const admin = profileRepo.create({
        name: 'Admin',
        type: 'admin',
        colour: '#FFFFFF',
        text_size: 'default',
        simplified_nav: 0,
      });
      const teen = profileRepo.create({
        name: 'Teen',
        type: 'teen',
        colour: '#0000FF',
        text_size: 'default',
        simplified_nav: 0,
      });
      const event = repo.create(makeEvent({ profile_id: teen.id }));
      profileRepo.delete(teen.id);
      void admin;
      const found = repo.get(event.id);
      expect(found?.profile_id).toBeNull();
    });
  });
});

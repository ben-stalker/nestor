import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import JourneyRepository from '../../src/repositories/JourneyRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function createProfile(db: Database.Database) {
  const profileRepo = new ProfileRepository(db);
  return profileRepo.create({
    name: 'Test User',
    type: 'admin',
    colour: '#FF0000',
    text_size: 'default',
    simplified_nav: 0,
  });
}

describe('JourneyRepository', () => {
  let db: Database.Database;
  let repo: JourneyRepository;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    repo = new JourneyRepository(db);
    const profile = createProfile(db);
    profileId = profile.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('create / get', () => {
    it('creates a journey with defaults', () => {
      const j = repo.create({
        profile_id: profileId,
        label: "To King's Cross",
        origin: 'Home',
        destination: "King's Cross",
      });
      expect(j.id).toBeGreaterThan(0);
      expect(j.label).toBe("To King's Cross");
      expect(j.transport_mode).toBe('transit');
      expect(j.days_active).toBe(127);
    });

    it('returns undefined for missing id', () => {
      expect(repo.get(9999)).toBeUndefined();
    });
  });

  describe('listForProfile', () => {
    it('returns journeys for the given profile', () => {
      repo.create({ profile_id: profileId, label: 'A', origin: 'X', destination: 'Y' });
      repo.create({ profile_id: profileId, label: 'B', origin: 'X', destination: 'Z' });
      const list = repo.listForProfile(profileId);
      expect(list).toHaveLength(2);
    });

    it('returns empty for profile with no journeys', () => {
      expect(repo.listForProfile(profileId)).toHaveLength(0);
    });
  });

  describe('listActiveToday', () => {
    it('returns journey active today', () => {
      repo.create({
        profile_id: profileId,
        label: 'Weekday',
        origin: 'A',
        destination: 'B',
        days_active: 127,
      });
      expect(repo.listActiveToday(profileId)).toHaveLength(1);
    });

    it('excludes journey not active today', () => {
      // eslint-disable-next-line no-bitwise
      const todayBit = 1 << new Date().getDay();
      // eslint-disable-next-line no-bitwise
      const otherDays = 127 & ~todayBit;
      repo.create({
        profile_id: profileId,
        label: 'Other days',
        origin: 'A',
        destination: 'B',
        days_active: otherDays,
      });
      expect(repo.listActiveToday(profileId)).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('updates specified fields', () => {
      const j = repo.create({ profile_id: profileId, label: 'Old', origin: 'A', destination: 'B' });
      const updated = repo.update(j.id, { label: 'New', transport_mode: 'drive' });
      expect(updated?.label).toBe('New');
      expect(updated?.transport_mode).toBe('drive');
    });

    it('returns undefined for missing id', () => {
      expect(repo.update(9999, { label: 'X' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes existing journey', () => {
      const j = repo.create({ profile_id: profileId, label: 'X', origin: 'A', destination: 'B' });
      expect(repo.delete(j.id)).toBe(true);
      expect(repo.get(j.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(9999)).toBe(false);
    });
  });
});

import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import ProfileRepository, { LastAdminError } from '../../src/repositories/ProfileRepository';
import type { CreateProfileInput } from '../../src/types/profile';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const adminInput: CreateProfileInput = {
  name: 'Admin',
  type: 'admin',
  colour: '#FF5733',
};

const childInput: CreateProfileInput = {
  name: 'Alice',
  type: 'child',
  colour: '#33FF57',
};

describe('ProfileRepository', () => {
  let db: Database.Database;
  let repo: ProfileRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('creates a profile and returns it without pin_hash', () => {
      const profile = repo.create(adminInput);
      expect(profile.id).toBeGreaterThan(0);
      expect(profile.name).toBe('Admin');
      expect(profile.type).toBe('admin');
      expect(profile.colour).toBe('#FF5733');
      expect(profile).not.toHaveProperty('pin_hash');
    });

    it('stores hashed PIN when pin is provided', () => {
      repo.create({ ...adminInput, pin: '1234' });
      const row = db
        .prepare<[], { pin_hash: string | null }>('SELECT pin_hash FROM profiles')
        .get();
      expect(row?.pin_hash).toBeTruthy();
      expect(row?.pin_hash).not.toBe('1234');
    });

    it('stores null pin_hash when no pin provided', () => {
      repo.create(adminInput);
      const row = db
        .prepare<[], { pin_hash: string | null }>('SELECT pin_hash FROM profiles')
        .get();
      expect(row?.pin_hash).toBeNull();
    });

    it('defaults permissions_json to empty object', () => {
      const profile = repo.create(adminInput);
      expect(profile.permissions_json).toEqual({});
    });

    it('stores custom permissions', () => {
      const profile = repo.create({
        ...adminInput,
        permissions_json: { can_edit: true, can_delete: false },
      });
      expect(profile.permissions_json).toEqual({ can_edit: true, can_delete: false });
    });

    it('stores and returns accessibility_json parsed', () => {
      const a11y = { high_contrast: true, font_scale: 1.5 };
      const profile = repo.create({ ...adminInput, accessibility_json: a11y });
      expect(profile.accessibility_json).toEqual(a11y);
    });

    it('throws on invalid colour format', () => {
      expect(() => repo.create({ ...adminInput, colour: 'red' })).toThrow();
    });

    it('throws on invalid type', () => {
      expect(() => repo.create({ ...adminInput, type: 'superuser' as never })).toThrow();
    });

    it('throws on empty name', () => {
      expect(() => repo.create({ ...adminInput, name: '' })).toThrow();
    });
  });

  describe('list', () => {
    it('returns all profiles ordered by id', () => {
      repo.create(adminInput);
      repo.create(childInput);
      const profiles = repo.list();
      expect(profiles).toHaveLength(2);
      expect(profiles[0].name).toBe('Admin');
      expect(profiles[1].name).toBe('Alice');
      expect(profiles[0].id).toBeLessThan(profiles[1].id);
    });

    it('returns empty array when no profiles exist', () => {
      expect(repo.list()).toEqual([]);
    });

    it('does not include pin_hash in results', () => {
      repo.create({ ...adminInput, pin: '9999' });
      const profiles = repo.list();
      profiles.forEach((p) => expect(p).not.toHaveProperty('pin_hash'));
    });
  });

  describe('get', () => {
    it('returns a profile by id without pin_hash', () => {
      const created = repo.create(adminInput);
      const found = repo.get(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found).not.toHaveProperty('pin_hash');
    });

    it('returns undefined for a non-existent id', () => {
      expect(repo.get(9999)).toBeUndefined();
    });
  });

  describe('update', () => {
    it('patches only the provided fields', () => {
      const profile = repo.create(adminInput);
      const updated = repo.update(profile.id, { name: 'Root' });
      expect(updated.name).toBe('Root');
      expect(updated.colour).toBe(adminInput.colour);
    });

    it('updates pin_hash when new pin is provided', () => {
      const profile = repo.create({ ...adminInput, pin: 'oldpin' });
      repo.update(profile.id, { pin: 'newpin' });
      expect(repo.verifyPin(profile.id, 'newpin')).toBe(true);
      expect(repo.verifyPin(profile.id, 'oldpin')).toBe(false);
    });

    it('throws when profile does not exist', () => {
      expect(() => repo.update(9999, { name: 'Ghost' })).toThrow('Profile 9999 not found');
    });

    it('updates permissions_json', () => {
      const profile = repo.create(adminInput);
      const updated = repo.update(profile.id, { permissions_json: { can_view: true } });
      expect(updated.permissions_json).toEqual({ can_view: true });
    });

    it('is a no-op when patch is empty', () => {
      const profile = repo.create(adminInput);
      const updated = repo.update(profile.id, {});
      expect(updated.name).toBe(profile.name);
    });
  });

  describe('delete', () => {
    it('deletes a non-admin profile', () => {
      const profile = repo.create(childInput);
      repo.delete(profile.id);
      expect(repo.get(profile.id)).toBeUndefined();
    });

    it('deletes an admin when another admin exists', () => {
      const a1 = repo.create(adminInput);
      repo.create({ ...adminInput, name: 'Admin2' });
      repo.delete(a1.id);
      expect(repo.get(a1.id)).toBeUndefined();
    });

    it('throws LastAdminError when deleting the last admin', () => {
      const profile = repo.create(adminInput);
      expect(() => repo.delete(profile.id)).toThrow(LastAdminError);
    });

    it('LastAdminError has code LAST_ADMIN', () => {
      const profile = repo.create(adminInput);
      try {
        repo.delete(profile.id);
      } catch (err) {
        expect((err as LastAdminError).code).toBe('LAST_ADMIN');
      }
    });

    it('is a no-op for a non-existent id', () => {
      expect(() => repo.delete(9999)).not.toThrow();
    });
  });

  describe('verifyPin', () => {
    it('returns true for the correct PIN', () => {
      const profile = repo.create({ ...adminInput, pin: 'secret' });
      expect(repo.verifyPin(profile.id, 'secret')).toBe(true);
    });

    it('returns false for the wrong PIN', () => {
      const profile = repo.create({ ...adminInput, pin: 'secret' });
      expect(repo.verifyPin(profile.id, 'wrong')).toBe(false);
    });

    it('returns false when no PIN is set', () => {
      const profile = repo.create(adminInput);
      expect(repo.verifyPin(profile.id, 'anything')).toBe(false);
    });

    it('returns false for a non-existent profile id', () => {
      expect(repo.verifyPin(9999, 'pin')).toBe(false);
    });
  });
});

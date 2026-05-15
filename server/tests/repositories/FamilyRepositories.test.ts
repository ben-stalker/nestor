import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import ChoreRepository from '../../src/repositories/ChoreRepository';
import ChoreCompletionRepository from '../../src/repositories/ChoreCompletionRepository';
import RewardRedemptionRepository from '../../src/repositories/RewardRedemptionRepository';
import HealthLogRepository from '../../src/repositories/HealthLogRepository';
import defaultsFor from '../../src/services/permissionDefaults';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeProfile(profileRepo: ProfileRepository, type: 'admin' | 'child' = 'admin') {
  return profileRepo.create({
    name: type === 'admin' ? 'Admin' : 'Child',
    type,
    colour: '#ff0000',
    text_size: 'default',
    permissions_json: defaultsFor(type),
    accessibility_json: {},
  });
}

// ─── ChoreRepository ─────────────────────────────────────────────────────────

describe('ChoreRepository', () => {
  let db: Database.Database;
  let profileRepo: ProfileRepository;
  let choreRepo: ChoreRepository;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    profileRepo = new ProfileRepository(db);
    choreRepo = new ChoreRepository(db);
    profileId = makeProfile(profileRepo).id;
  });

  afterEach(() => db.close());

  it('creates and retrieves a chore', () => {
    const chore = choreRepo.create({
      name: 'Tidy bedroom',
      frequency: 'daily',
      points: 2,
      sort_order: 0,
    });
    expect(chore.id).toBeGreaterThan(0);
    expect(chore.name).toBe('Tidy bedroom');
    expect(chore.frequency).toBe('daily');
    expect(chore.points).toBe(2);
    expect(chore.active).toBe(true);
  });

  it('lists only active chores by default', () => {
    choreRepo.create({ name: 'Active', frequency: 'daily', points: 1, sort_order: 0 });
    const inactive = choreRepo.create({
      name: 'Inactive',
      frequency: 'weekly',
      points: 1,
      sort_order: 1,
    });
    choreRepo.update(inactive.id, { active: false });
    expect(choreRepo.list()).toHaveLength(1);
    expect(choreRepo.list({ includeInactive: true })).toHaveLength(2);
  });

  it('filters by assigned_profile_id', () => {
    choreRepo.create({ name: 'Shared', frequency: 'daily', points: 1, sort_order: 0 });
    choreRepo.create({
      name: 'Mine',
      frequency: 'daily',
      points: 1,
      sort_order: 1,
      assigned_profile_id: profileId,
    });
    expect(choreRepo.list({ assigned_profile_id: profileId })).toHaveLength(1);
  });

  it('countAssigned returns correct count', () => {
    choreRepo.create({
      name: 'A',
      frequency: 'daily',
      points: 1,
      sort_order: 0,
      assigned_profile_id: profileId,
    });
    choreRepo.create({
      name: 'B',
      frequency: 'daily',
      points: 1,
      sort_order: 1,
      assigned_profile_id: profileId,
    });
    choreRepo.create({ name: 'C', frequency: 'daily', points: 1, sort_order: 2 });
    expect(choreRepo.countAssigned(profileId)).toBe(2);
  });

  it('updates a chore', () => {
    const chore = choreRepo.create({ name: 'Old', frequency: 'daily', points: 1, sort_order: 0 });
    const updated = choreRepo.update(chore.id, { name: 'New', points: 5 });
    expect(updated?.name).toBe('New');
    expect(updated?.points).toBe(5);
  });

  it('deletes a chore', () => {
    const chore = choreRepo.create({
      name: 'To delete',
      frequency: 'daily',
      points: 1,
      sort_order: 0,
    });
    choreRepo.delete(chore.id);
    expect(choreRepo.get(chore.id)).toBeUndefined();
  });
});

// ─── ChoreCompletionRepository ────────────────────────────────────────────────

describe('ChoreCompletionRepository', () => {
  let db: Database.Database;
  let profileRepo: ProfileRepository;
  let choreRepo: ChoreRepository;
  let completionRepo: ChoreCompletionRepository;
  let choreId: number;
  let profileId: number;

  const DAY_START = 1_700_000_000_000;

  beforeEach(() => {
    db = makeDb();
    profileRepo = new ProfileRepository(db);
    choreRepo = new ChoreRepository(db);
    completionRepo = new ChoreCompletionRepository(db);
    profileId = makeProfile(profileRepo).id;
    choreId = choreRepo.create({ name: 'Dishes', frequency: 'daily', points: 3, sort_order: 0 }).id;
  });

  afterEach(() => db.close());

  it('records a completion and retrieves it', () => {
    const c = completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: DAY_START + 1000,
      points_awarded: 3,
    });
    expect(c.id).toBeGreaterThan(0);
    expect(c.points_awarded).toBe(3);
  });

  it('todayCount honours day boundaries', () => {
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: DAY_START + 3600,
      points_awarded: 1,
    });
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: DAY_START + 7200,
      points_awarded: 1,
    });
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: DAY_START - 1,
      points_awarded: 1,
    });
    expect(completionRepo.todayCount(profileId, DAY_START)).toBe(2);
  });

  it('completedTodayForChore detects completion', () => {
    expect(completionRepo.completedTodayForChore(choreId, profileId, DAY_START)).toBe(false);
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: DAY_START + 500,
      points_awarded: 1,
    });
    expect(completionRepo.completedTodayForChore(choreId, profileId, DAY_START)).toBe(true);
  });

  it('byDay groups by calendar date', () => {
    const recentDay = Date.now() - 2 * 86_400_000;
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: recentDay,
      points_awarded: 1,
    });
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: recentDay + 86_400_000,
      points_awarded: 1,
    });
    const days = completionRepo.byDay(profileId, 30);
    expect(days).toHaveLength(2);
    expect(days[0].count).toBe(1);
  });

  it('cascade deletes completions when profile deleted', () => {
    const extraAdmin = makeProfile(profileRepo, 'admin');
    const child = makeProfile(profileRepo, 'child');
    const childChoreId = choreRepo.create({
      name: 'CleanRoom',
      frequency: 'daily',
      points: 1,
      sort_order: 0,
    }).id;
    completionRepo.push({
      chore_id: childChoreId,
      profile_id: child.id,
      completed_at: DAY_START,
      points_awarded: 1,
    });
    profileRepo.delete(child.id);
    expect(completionRepo.listForProfile(child.id)).toHaveLength(0);
    void extraAdmin;
  });
});

// ─── RewardRedemptionRepository ──────────────────────────────────────────────

describe('RewardRedemptionRepository', () => {
  let db: Database.Database;
  let profileRepo: ProfileRepository;
  let choreRepo: ChoreRepository;
  let completionRepo: ChoreCompletionRepository;
  let redemptionRepo: RewardRedemptionRepository;
  let profileId: number;
  let choreId: number;

  beforeEach(() => {
    db = makeDb();
    profileRepo = new ProfileRepository(db);
    choreRepo = new ChoreRepository(db);
    completionRepo = new ChoreCompletionRepository(db);
    redemptionRepo = new RewardRedemptionRepository(db);
    profileId = makeProfile(profileRepo).id;
    choreId = choreRepo.create({ name: 'Sweep', frequency: 'daily', points: 5, sort_order: 0 }).id;
  });

  afterEach(() => db.close());

  it('balance = earned − spent', () => {
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: Date.now(),
      points_awarded: 10,
    });
    completionRepo.push({
      chore_id: choreId,
      profile_id: profileId,
      completed_at: Date.now(),
      points_awarded: 5,
    });
    redemptionRepo.push({
      profile_id: profileId,
      points_spent: 8,
      reward_label: 'Sticker',
      redeemed_at: Date.now(),
    });
    expect(redemptionRepo.balance(profileId)).toBe(7);
  });

  it('balance starts at 0 for new profile', () => {
    expect(redemptionRepo.balance(profileId)).toBe(0);
  });

  it('cascade deletes redemptions when profile deleted', () => {
    makeProfile(profileRepo, 'admin');
    const child = makeProfile(profileRepo, 'child');
    redemptionRepo.push({
      profile_id: child.id,
      points_spent: 5,
      reward_label: 'Toy',
      redeemed_at: Date.now(),
    });
    profileRepo.delete(child.id);
    expect(redemptionRepo.listForProfile(child.id)).toHaveLength(0);
  });
});

// ─── HealthLogRepository ──────────────────────────────────────────────────────

describe('HealthLogRepository', () => {
  let db: Database.Database;
  let profileRepo: ProfileRepository;
  let healthRepo: HealthLogRepository;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    profileRepo = new ProfileRepository(db);
    healthRepo = new HealthLogRepository(db);
    profileId = makeProfile(profileRepo).id;
  });

  afterEach(() => db.close());

  it('creates and retrieves a medicine entry', () => {
    const entry = healthRepo.create({
      profile_id: profileId,
      log_type: 'medicine',
      data_json: { name: 'Calpol', dose: '5ml', reason: 'Fever' },
      logged_at: Date.now(),
    });
    expect(entry.id).toBeGreaterThan(0);
    expect(entry.log_type).toBe('medicine');
    expect((entry.data_json as { name: string }).name).toBe('Calpol');
  });

  it('creates and retrieves a temperature entry', () => {
    const entry = healthRepo.create({
      profile_id: profileId,
      log_type: 'temperature',
      data_json: { value: 38.5, unit: 'c' },
      logged_at: Date.now(),
    });
    expect(entry.log_type).toBe('temperature');
  });

  it('filters by log_type', () => {
    healthRepo.create({
      profile_id: profileId,
      log_type: 'medicine',
      data_json: { name: 'X' },
      logged_at: Date.now(),
    });
    healthRepo.create({
      profile_id: profileId,
      log_type: 'symptom',
      data_json: { text: 'Cough' },
      logged_at: Date.now(),
    });
    const meds = healthRepo.listForProfile(profileId, { logType: 'medicine' });
    expect(meds).toHaveLength(1);
    expect(meds[0].log_type).toBe('medicine');
  });

  it('updates an entry', () => {
    const entry = healthRepo.create({
      profile_id: profileId,
      log_type: 'symptom',
      data_json: { text: 'Old' },
      logged_at: 1000,
    });
    const updated = healthRepo.update(entry.id, { data_json: { text: 'Updated' } });
    expect((updated?.data_json as { text: string }).text).toBe('Updated');
  });

  it('deletes an entry', () => {
    const entry = healthRepo.create({
      profile_id: profileId,
      log_type: 'symptom',
      data_json: { text: 'X' },
      logged_at: Date.now(),
    });
    healthRepo.delete(entry.id);
    expect(healthRepo.getById(entry.id)).toBeUndefined();
  });

  it('cascade deletes when profile deleted', () => {
    makeProfile(profileRepo, 'admin');
    const child = makeProfile(profileRepo, 'child');
    healthRepo.create({
      profile_id: child.id,
      log_type: 'symptom',
      data_json: { text: 'X' },
      logged_at: Date.now(),
    });
    profileRepo.delete(child.id);
    expect(healthRepo.listForProfile(child.id)).toHaveLength(0);
  });
});

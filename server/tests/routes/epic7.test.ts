import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import HealthLogRepository from '../../src/repositories/HealthLogRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import createHealthLogRouter from '../../src/routes/healthLog';
import defaultsFor from '../../src/services/permissionDefaults';
import evalFeedAlerts from '../../src/services/babyAlertService';
import { getScheduleForBaby, evalVaccinationAlerts } from '../../src/services/VaccinationService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  const profileRepo = new ProfileRepository(db);
  const healthRepo = new HealthLogRepository(db);
  app.use(createHealthLogRouter(healthRepo, profileRepo));
  app.use(errorHandler);
  return { app, profileRepo, healthRepo };
}

function makeAdmin(profileRepo: ProfileRepository) {
  return profileRepo.create({
    name: 'Admin',
    type: 'admin',
    colour: '#ff0000',
    text_size: 'default',
    permissions_json: defaultsFor('admin'),
    accessibility_json: {},
  });
}

function makeBaby(profileRepo: ProfileRepository, dob?: number) {
  return profileRepo.create({
    name: 'Baby',
    type: 'baby',
    colour: '#aabbcc',
    text_size: 'default',
    permissions_json: defaultsFor('baby'),
    accessibility_json: {},
    dob: dob ?? null,
  });
}

function makeTeen(profileRepo: ProfileRepository) {
  return profileRepo.create({
    name: 'Teen',
    type: 'teen',
    colour: '#112233',
    text_size: 'default',
    permissions_json: defaultsFor('teen'),
    accessibility_json: {},
    conversion_rate: 0.1,
  });
}

// ─── STORY-7.7: Baby Summary ───────────────────────────────────────────────────

describe('GET /api/v1/health-log/:profileId/baby-summary', () => {
  it('returns today counts and recent entries', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const baby = makeBaby(profileRepo);

    healthRepo.create({
      profile_id: baby.id,
      log_type: 'feed',
      data_json: { side: 'left' },
      logged_at: Date.now(),
    });
    healthRepo.create({
      profile_id: baby.id,
      log_type: 'nappy',
      data_json: { type: 'wet' },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${baby.id}/baby-summary`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    expect((res.body as { todayFeedCount: number }).todayFeedCount).toBe(1);
    expect((res.body as { todayNappyCount: number }).todayNappyCount).toBe(1);
    expect((res.body as { recentEntries: unknown[] }).recentEntries).toHaveLength(2);
    db.close();
  });

  it('403 when non-admin requests another profile', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    makeAdmin(profileRepo);
    const baby = makeBaby(profileRepo);
    const other = profileRepo.create({
      name: 'Other',
      type: 'child',
      colour: '#ffffff',
      text_size: 'default',
      permissions_json: defaultsFor('child'),
      accessibility_json: {},
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${baby.id}/baby-summary`)
      .set('x-profile-id', String(other.id));
    expect(res.status).toBe(403);
    db.close();
  });
});

// ─── STORY-7.7: Baby alert service ───────────────────────────────────────────

describe('evalFeedAlerts', () => {
  it('creates an alert when baby has not been fed within threshold', () => {
    const db = makeDb();
    const profileRepo = new ProfileRepository(db);
    const healthRepo = new HealthLogRepository(db);
    const alertRepo = new AlertRepository(db);

    makeAdmin(profileRepo);
    const baby = profileRepo.create({
      name: 'Hungry',
      type: 'baby',
      colour: '#aabbcc',
      text_size: 'default',
      permissions_json: defaultsFor('baby'),
      accessibility_json: {},
      feed_alert_hours: 1,
    });

    // Last feed was 2 hours ago
    healthRepo.create({
      profile_id: baby.id,
      log_type: 'feed',
      data_json: { side: 'left' },
      logged_at: Date.now() - 2 * 3_600_000,
    });

    evalFeedAlerts(profileRepo, healthRepo, alertRepo);
    const alerts = alertRepo.listActive();
    expect(alerts.some((a) => a.type.includes(`baby_feed_overdue_${baby.id}`))).toBe(true);
    db.close();
  });

  it('does not create duplicate alert', () => {
    const db = makeDb();
    const profileRepo = new ProfileRepository(db);
    const healthRepo = new HealthLogRepository(db);
    const alertRepo = new AlertRepository(db);

    makeAdmin(profileRepo);
    const baby = profileRepo.create({
      name: 'Hungry2',
      type: 'baby',
      colour: '#aabbcc',
      text_size: 'default',
      permissions_json: defaultsFor('baby'),
      accessibility_json: {},
      feed_alert_hours: 1,
    });

    healthRepo.create({
      profile_id: baby.id,
      log_type: 'feed',
      data_json: { side: 'right' },
      logged_at: Date.now() - 3 * 3_600_000,
    });

    evalFeedAlerts(profileRepo, healthRepo, alertRepo);
    evalFeedAlerts(profileRepo, healthRepo, alertRepo);
    const alerts = alertRepo
      .listActive()
      .filter((a) => a.type.includes(`baby_feed_overdue_${baby.id}`));
    expect(alerts).toHaveLength(1);
    db.close();
  });
});

// ─── STORY-7.8: Growth data ───────────────────────────────────────────────────

describe('GET /api/v1/health-log/:profileId/growth-data', () => {
  it('returns growth points with dob', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const dob = Date.now() - 12 * 7 * 86_400_000;
    const baby = makeBaby(profileRepo, dob);

    healthRepo.create({
      profile_id: baby.id,
      log_type: 'growth',
      data_json: { weight_kg: 5.5, height_cm: 60 },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${baby.id}/growth-data`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    expect((res.body as { dobMs: number | null }).dobMs).toBe(dob);
    expect((res.body as { points: unknown[] }).points).toHaveLength(1);
    db.close();
  });

  it('returns empty points array with null dob when none logged', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const baby = makeBaby(profileRepo);

    const res = await request(app)
      .get(`/api/v1/health-log/${baby.id}/growth-data`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    expect((res.body as { points: unknown[] }).points).toHaveLength(0);
    db.close();
  });
});

// ─── STORY-7.9: Vaccinations ─────────────────────────────────────────────────

describe('getScheduleForBaby', () => {
  it('returns all NHS vaccinations with due dates', () => {
    const dob = Date.now() - 10 * 7 * 86_400_000;
    const schedule = getScheduleForBaby(dob, []);
    expect(schedule.length).toBeGreaterThan(0);
    expect(schedule[0]).toHaveProperty('dueAt');
    expect(schedule[0].completed).toBe(false);
  });

  it('marks vaccination as completed when name matches', () => {
    const dob = Date.now() - 10 * 7 * 86_400_000;
    const schedule = getScheduleForBaby(dob, ['6-in-1 (dose 1)']);
    const first = schedule.find((v) => v.id === 'v8w');
    expect(first?.completed).toBe(true);
  });
});

describe('GET /api/v1/health-log/:profileId/vaccinations', () => {
  it('returns empty array when baby has no dob', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const baby = makeBaby(profileRepo);

    const res = await request(app)
      .get(`/api/v1/health-log/${baby.id}/vaccinations`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });

  it('returns schedule with dob set', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const dob = Date.now() - 16 * 7 * 86_400_000;
    const baby = makeBaby(profileRepo, dob);

    const res = await request(app)
      .get(`/api/v1/health-log/${baby.id}/vaccinations`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as unknown[]).length).toBeGreaterThan(0);
    db.close();
  });
});

describe('evalVaccinationAlerts', () => {
  it('creates alert for overdue vaccination', () => {
    const db = makeDb();
    const profileRepo = new ProfileRepository(db);
    const healthRepo = new HealthLogRepository(db);
    const alertRepo = new AlertRepository(db);

    makeAdmin(profileRepo);
    // dob 16 weeks ago — first dose was due at 8 weeks, so it's overdue by 8 weeks
    const dob = Date.now() - 16 * 7 * 86_400_000;
    profileRepo.create({
      name: 'VaxBaby',
      type: 'baby',
      colour: '#aabbcc',
      text_size: 'default',
      permissions_json: defaultsFor('baby'),
      accessibility_json: {},
      dob,
    });

    evalVaccinationAlerts(profileRepo, healthRepo, alertRepo);
    const alerts = alertRepo.listActive();
    expect(alerts.some((a) => a.type.startsWith('vaccination_due_'))).toBe(true);
    db.close();
  });
});

// ─── STORY-7.11: Mood trend ───────────────────────────────────────────────────

describe('GET /api/v1/health-log/:profileId/mood-trend', () => {
  it('returns mood entries grouped by day', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const teen = makeTeen(profileRepo);

    healthRepo.create({
      profile_id: teen.id,
      log_type: 'mood',
      data_json: { score: 4 },
      logged_at: Date.now(),
    });
    healthRepo.create({
      profile_id: teen.id,
      log_type: 'mood',
      data_json: { score: 5 },
      logged_at: Date.now() - 3_600_000,
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${teen.id}/mood-trend`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as { date: string; score: number }[])[0]).toHaveProperty('score');
    db.close();
  });

  it('403 when non-admin requests another profile mood trend', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    makeAdmin(profileRepo);
    const teen = makeTeen(profileRepo);
    const other = profileRepo.create({
      name: 'Other',
      type: 'child',
      colour: '#ffffff',
      text_size: 'default',
      permissions_json: defaultsFor('child'),
      accessibility_json: {},
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${teen.id}/mood-trend`)
      .set('x-profile-id', String(other.id));
    expect(res.status).toBe(403);
    db.close();
  });
});

// ─── STORY-7.12: Profile conversion_rate ──────────────────────────────────────

describe('ProfileRepository conversion_rate', () => {
  it('creates profile with conversion_rate and returns it', () => {
    const db = makeDb();
    const profileRepo = new ProfileRepository(db);
    makeAdmin(profileRepo);

    const teen = profileRepo.create({
      name: 'Teen',
      type: 'teen',
      colour: '#112233',
      text_size: 'default',
      permissions_json: defaultsFor('teen'),
      accessibility_json: {},
      conversion_rate: 0.1,
    });

    expect(teen.conversion_rate).toBe(0.1);
    db.close();
  });

  it('updates conversion_rate via update()', () => {
    const db = makeDb();
    const profileRepo = new ProfileRepository(db);
    makeAdmin(profileRepo);

    const teen = profileRepo.create({
      name: 'Teen2',
      type: 'teen',
      colour: '#223344',
      text_size: 'default',
      permissions_json: defaultsFor('teen'),
      accessibility_json: {},
    });
    expect(teen.conversion_rate).toBe(0);

    const updated = profileRepo.update(teen.id, { conversion_rate: 0.25 });
    expect(updated.conversion_rate).toBe(0.25);
    db.close();
  });

  it('creates profile with dob and feed_alert_hours', () => {
    const db = makeDb();
    const profileRepo = new ProfileRepository(db);
    makeAdmin(profileRepo);

    const now = Date.now();
    const baby = profileRepo.create({
      name: 'BabyTest',
      type: 'baby',
      colour: '#aabbcc',
      text_size: 'default',
      permissions_json: defaultsFor('baby'),
      accessibility_json: {},
      dob: now,
      feed_alert_hours: 3,
    });

    expect(baby.dob).toBe(now);
    expect(baby.feed_alert_hours).toBe(3);
    db.close();
  });
});

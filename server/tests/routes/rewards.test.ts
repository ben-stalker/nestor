import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import ChoreRepository from '../../src/repositories/ChoreRepository';
import ChoreCompletionRepository from '../../src/repositories/ChoreCompletionRepository';
import RewardRedemptionRepository from '../../src/repositories/RewardRedemptionRepository';
import createRewardsRouter from '../../src/routes/rewards';
import defaultsFor from '../../src/services/permissionDefaults';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpAdminPin: RequestHandler = (_req, _res, next) => next();
const blockAdminPin: RequestHandler = (_req, res) =>
  res.status(403).json({ error: 'Invalid admin PIN', code: 'INVALID_ADMIN_PIN' });

function makeApp(db: Database.Database, adminPin: RequestHandler = noOpAdminPin) {
  const app = express();
  app.use(express.json());
  const profileRepo = new ProfileRepository(db);
  const choreRepo = new ChoreRepository(db);
  const completionRepo = new ChoreCompletionRepository(db);
  const redemptionRepo = new RewardRedemptionRepository(db);
  app.use(createRewardsRouter(completionRepo, redemptionRepo, profileRepo, adminPin));
  app.use(errorHandler);
  return { app, profileRepo, choreRepo, completionRepo, redemptionRepo };
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

function makeChild(profileRepo: ProfileRepository) {
  return profileRepo.create({
    name: 'Child',
    type: 'child',
    colour: '#00ff00',
    text_size: 'default',
    permissions_json: defaultsFor('child'),
    accessibility_json: {},
  });
}

describe('GET /api/v1/rewards/:profileId', () => {
  it('admin gets reward balance for any profile', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .get(`/api/v1/rewards/${child.id}`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(200);
    const body = res.body as { balance: number; recentCompletions: unknown[] };
    expect(body.balance).toBe(0);
    expect(body.recentCompletions).toEqual([]);
    db.close();
  });

  it('child gets own rewards', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .get(`/api/v1/rewards/${child.id}`)
      .set('x-profile-id', String(child.id));
    expect(res.status).toBe(200);
    db.close();
  });

  it("child cannot get another child's rewards", async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const child1 = makeChild(profileRepo);
    const child2 = profileRepo.create({
      name: 'C2',
      type: 'child',
      colour: '#0000ff',
      text_size: 'default',
      permissions_json: defaultsFor('child'),
      accessibility_json: {},
    });

    const res = await request(app)
      .get(`/api/v1/rewards/${child2.id}`)
      .set('x-profile-id', String(child1.id));
    expect(res.status).toBe(403);
    db.close();
  });
});

describe('GET /api/v1/rewards/:profileId/grid', () => {
  it('returns grid data with streak', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .get(`/api/v1/rewards/${child.id}/grid`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(200);
    const grid = res.body as { filled: number; total: number; streak: number };
    expect(res.body).toHaveProperty('filled');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('streak');
    expect(grid.filled).toBe(0);
    expect(grid.total).toBe(10);
    db.close();
  });
});

describe('POST /api/v1/rewards/:profileId/redeem', () => {
  it('admin redeems valid points', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo, completionRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);
    const chore = choreRepo.create({
      name: 'Task',
      frequency: 'weekly',
      points: 10,
      sort_order: 0,
    });
    completionRepo.push({
      chore_id: chore.id,
      profile_id: child.id,
      completed_at: Date.now(),
      points_awarded: 10,
    });

    const res = await request(app)
      .post(`/api/v1/rewards/${child.id}/redeem`)
      .set('x-profile-id', String(admin.id))
      .send({ points_spent: 10, reward_label: 'Sticker book' });
    expect(res.status).toBe(201);
    expect((res.body as { reward_label: string }).reward_label).toBe('Sticker book');
    db.close();
  });

  it('returns 400 when insufficient points', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .post(`/api/v1/rewards/${child.id}/redeem`)
      .set('x-profile-id', String(admin.id))
      .send({ points_spent: 100, reward_label: 'Toy' });
    expect(res.status).toBe(400);
    expect((res.body as { code: string }).code).toBe('INSUFFICIENT_POINTS');
    db.close();
  });

  it('non-admin cannot redeem', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db, blockAdminPin);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .post(`/api/v1/rewards/${child.id}/redeem`)
      .set('x-profile-id', String(child.id))
      .send({ points_spent: 5, reward_label: 'Toy' });
    expect(res.status).toBe(403);
    db.close();
  });
});

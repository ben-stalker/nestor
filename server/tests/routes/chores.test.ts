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
import createChoresRouter from '../../src/routes/chores';
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
  app.use(createChoresRouter(choreRepo, completionRepo, profileRepo, adminPin));
  app.use(errorHandler);
  return { app, profileRepo, choreRepo, completionRepo };
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

describe('GET /api/v1/chores', () => {
  it('returns chores for admin (all)', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    choreRepo.create({ name: 'Sweep', frequency: 'daily', points: 1, sort_order: 0 });

    const res = await request(app).get('/api/v1/chores').set('x-profile-id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    db.close();
  });

  it('filters to own chores for child', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const child = makeChild(profileRepo);
    choreRepo.create({ name: 'Shared', frequency: 'daily', points: 1, sort_order: 0 });
    choreRepo.create({
      name: 'Mine',
      frequency: 'daily',
      points: 1,
      sort_order: 1,
      assigned_profile_id: child.id,
    });

    const res = await request(app).get('/api/v1/chores').set('x-profile-id', String(child.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as { name: string }[])[0].name).toBe('Mine');
    db.close();
  });

  it('returns 401 without profile', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/chores');
    expect(res.status).toBe(401);
    db.close();
  });
});

describe('POST /api/v1/chores', () => {
  it('admin creates a chore', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);

    const res = await request(app)
      .post('/api/v1/chores')
      .set('x-profile-id', String(admin.id))
      .send({ name: 'Wash dishes', frequency: 'daily', points: 2 });
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('Wash dishes');
    db.close();
  });

  it('child cannot create a chore', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .post('/api/v1/chores')
      .set('x-profile-id', String(child.id))
      .send({ name: 'Chore', frequency: 'daily', points: 1 });
    expect(res.status).toBe(403);
    db.close();
  });

  it('returns 403 when admin pin blocked', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db, blockAdminPin);
    const admin = makeAdmin(profileRepo);

    const res = await request(app)
      .post('/api/v1/chores')
      .set('x-profile-id', String(admin.id))
      .send({ name: 'Chore', frequency: 'daily', points: 1 });
    expect(res.status).toBe(403);
    db.close();
  });
});

describe('PATCH /api/v1/chores/:id/complete', () => {
  it('child completes own chore → 201 + points awarded', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const child = makeChild(profileRepo);
    const chore = choreRepo.create({
      name: 'Vacuum',
      frequency: 'weekly',
      points: 5,
      sort_order: 0,
      assigned_profile_id: child.id,
    });

    const res = await request(app)
      .patch(`/api/v1/chores/${chore.id}/complete`)
      .set('x-profile-id', String(child.id));
    expect(res.status).toBe(201);
    const body = res.body as { points_awarded: number; profile_id: number };
    expect(body.points_awarded).toBe(5);
    expect(body.profile_id).toBe(child.id);
    db.close();
  });

  it("child cannot complete another child's chore", async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const child1 = makeChild(profileRepo);
    const child2 = profileRepo.create({
      name: 'Child2',
      type: 'child',
      colour: '#0000ff',
      text_size: 'default',
      permissions_json: defaultsFor('child'),
      accessibility_json: {},
    });
    const chore = choreRepo.create({
      name: 'Task',
      frequency: 'weekly',
      points: 3,
      sort_order: 0,
      assigned_profile_id: child2.id,
    });

    const res = await request(app)
      .patch(`/api/v1/chores/${chore.id}/complete`)
      .set('x-profile-id', String(child1.id));
    expect(res.status).toBe(403);
    db.close();
  });

  it('daily chore returns 409 on double-complete', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const child = makeChild(profileRepo);
    const chore = choreRepo.create({
      name: 'Brush teeth',
      frequency: 'daily',
      points: 1,
      sort_order: 0,
      assigned_profile_id: child.id,
    });

    await request(app)
      .patch(`/api/v1/chores/${chore.id}/complete`)
      .set('x-profile-id', String(child.id));
    const res = await request(app)
      .patch(`/api/v1/chores/${chore.id}/complete`)
      .set('x-profile-id', String(child.id));
    expect(res.status).toBe(409);
    db.close();
  });

  it('returns 404 for non-existent chore', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .patch('/api/v1/chores/9999/complete')
      .set('x-profile-id', String(child.id));
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('PATCH /api/v1/chores/:id', () => {
  it('admin updates a chore', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const chore = choreRepo.create({ name: 'Old', frequency: 'daily', points: 1, sort_order: 0 });

    const res = await request(app)
      .patch(`/api/v1/chores/${chore.id}`)
      .set('x-profile-id', String(admin.id))
      .send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('Updated');
    db.close();
  });
});

describe('DELETE /api/v1/chores/:id', () => {
  it('admin deletes a chore', async () => {
    const db = makeDb();
    const { app, profileRepo, choreRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const chore = choreRepo.create({ name: 'Tidy', frequency: 'daily', points: 1, sort_order: 0 });

    const res = await request(app)
      .delete(`/api/v1/chores/${chore.id}`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(204);
    db.close();
  });
});

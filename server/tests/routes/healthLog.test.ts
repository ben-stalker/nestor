import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import HealthLogRepository from '../../src/repositories/HealthLogRepository';
import createHealthLogRouter from '../../src/routes/healthLog';
import defaultsFor from '../../src/services/permissionDefaults';

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

function makeTeen(profileRepo: ProfileRepository) {
  return profileRepo.create({
    name: 'Teen',
    type: 'teen',
    colour: '#0000ff',
    text_size: 'default',
    permissions_json: defaultsFor('teen'),
    accessibility_json: {},
  });
}

describe('POST /api/v1/health-log/:profileId', () => {
  it('admin logs a medicine entry', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .post(`/api/v1/health-log/${child.id}`)
      .set('x-profile-id', String(admin.id))
      .send({ log_type: 'medicine', name: 'Calpol', dose: '5ml', reason: 'Fever' });
    expect(res.status).toBe(201);
    expect((res.body as { log_type: string }).log_type).toBe('medicine');
    db.close();
  });

  it('validates medicine log_type — missing dose → 400', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .post(`/api/v1/health-log/${child.id}`)
      .set('x-profile-id', String(admin.id))
      .send({ log_type: 'medicine', name: 'Calpol' });
    expect(res.status).toBe(400);
    db.close();
  });

  it('validates temperature log_type', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .post(`/api/v1/health-log/${child.id}`)
      .set('x-profile-id', String(admin.id))
      .send({ log_type: 'temperature', value: 38.5, unit: 'c' });
    expect(res.status).toBe(201);
    db.close();
  });

  it('child cannot log for sibling', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    makeAdmin(profileRepo);
    const child1 = makeChild(profileRepo);
    const child2 = profileRepo.create({
      name: 'C2',
      type: 'child',
      colour: '#aaaaaa',
      text_size: 'default',
      permissions_json: defaultsFor('child'),
      accessibility_json: {},
    });

    const res = await request(app)
      .post(`/api/v1/health-log/${child2.id}`)
      .set('x-profile-id', String(child1.id))
      .send({ log_type: 'symptom', text: 'Cough' });
    expect(res.status).toBe(403);
    db.close();
  });

  it('teen can log own health entry', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    makeAdmin(profileRepo);
    const teen = makeTeen(profileRepo);

    const res = await request(app)
      .post(`/api/v1/health-log/${teen.id}`)
      .set('x-profile-id', String(teen.id))
      .send({ log_type: 'symptom', text: 'Headache' });
    expect(res.status).toBe(201);
    db.close();
  });
});

describe('GET /api/v1/health-log/:profileId', () => {
  it('admin reads any profile log', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);
    healthRepo.create({
      profile_id: child.id,
      log_type: 'symptom',
      data_json: { text: 'X' },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${child.id}`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    db.close();
  });

  it("child cannot read sibling's log", async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    makeAdmin(profileRepo);
    const child1 = makeChild(profileRepo);
    const child2 = profileRepo.create({
      name: 'C2',
      type: 'child',
      colour: '#aaaaaa',
      text_size: 'default',
      permissions_json: defaultsFor('child'),
      accessibility_json: {},
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${child2.id}`)
      .set('x-profile-id', String(child1.id));
    expect(res.status).toBe(403);
    db.close();
  });

  it('filters by logType query param', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);
    healthRepo.create({
      profile_id: child.id,
      log_type: 'medicine',
      data_json: { name: 'X', dose: '5ml' },
      logged_at: Date.now(),
    });
    healthRepo.create({
      profile_id: child.id,
      log_type: 'symptom',
      data_json: { text: 'Y' },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${child.id}?logType=medicine`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as { log_type: string }[])[0].log_type).toBe('medicine');
    db.close();
  });
});

describe('GET /api/v1/health-log/:profileId/export.pdf', () => {
  it('admin exports PDF and gets application/pdf', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);
    healthRepo.create({
      profile_id: child.id,
      log_type: 'medicine',
      data_json: { name: 'X', dose: '5ml' },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .get(`/api/v1/health-log/${child.id}/export.pdf`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    db.close();
  });

  it('non-admin cannot export PDF', async () => {
    const db = makeDb();
    const { app, profileRepo } = makeApp(db);
    makeAdmin(profileRepo);
    const child = makeChild(profileRepo);

    const res = await request(app)
      .get(`/api/v1/health-log/${child.id}/export.pdf`)
      .set('x-profile-id', String(child.id));
    expect(res.status).toBe(403);
    db.close();
  });
});

describe('PATCH /api/v1/health-log/entries/:id', () => {
  it('admin updates an entry', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);
    const entry = healthRepo.create({
      profile_id: child.id,
      log_type: 'symptom',
      data_json: { text: 'Old' },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .patch(`/api/v1/health-log/entries/${entry.id}`)
      .set('x-profile-id', String(admin.id))
      .send({ data_json: { text: 'Updated' } });
    expect(res.status).toBe(200);
    expect((res.body as { data_json: { text: string } }).data_json.text).toBe('Updated');
    db.close();
  });
});

describe('DELETE /api/v1/health-log/entries/:id', () => {
  it('admin deletes an entry', async () => {
    const db = makeDb();
    const { app, profileRepo, healthRepo } = makeApp(db);
    const admin = makeAdmin(profileRepo);
    const child = makeChild(profileRepo);
    const entry = healthRepo.create({
      profile_id: child.id,
      log_type: 'symptom',
      data_json: { text: 'X' },
      logged_at: Date.now(),
    });

    const res = await request(app)
      .delete(`/api/v1/health-log/entries/${entry.id}`)
      .set('x-profile-id', String(admin.id));
    expect(res.status).toBe(204);
    db.close();
  });
});

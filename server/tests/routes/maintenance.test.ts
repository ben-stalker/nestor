import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import HomeMaintenanceRepository from '../../src/repositories/HomeMaintenanceRepository';
import createMaintenanceRouter from '../../src/routes/maintenance';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpPin: RequestHandler = (_req, _res, next) => next();

function makeApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  const repo = new HomeMaintenanceRepository(db);
  app.use(createMaintenanceRouter(repo, noOpPin));
  app.use(errorHandler);
  return { app, repo };
}

describe('GET /api/v1/maintenance', () => {
  it('returns all items when no type filter', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    repo.create({ title: 'Fix boiler', type: 'job', landlord_report: false, renter_mode: false });
    repo.create({
      title: 'Boiler warranty',
      type: 'warranty',
      landlord_report: false,
      renter_mode: false,
    });
    const res = await request(app).get('/api/v1/maintenance');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    db.close();
  });

  it('filters by type', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    repo.create({ title: 'Job 1', type: 'job', landlord_report: false, renter_mode: false });
    repo.create({
      title: 'Reminder 1',
      type: 'reminder',
      landlord_report: false,
      renter_mode: false,
    });
    const res = await request(app).get('/api/v1/maintenance?type=job');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as Array<{ title: string }>)[0].title).toBe('Job 1');
    db.close();
  });

  it('returns 400 for invalid type', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/maintenance?type=invalid');
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('POST /api/v1/maintenance', () => {
  it('creates an item', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/maintenance')
      .send({ title: 'Paint fence', type: 'job' });
    expect(res.status).toBe(201);
    expect((res.body as { title: string }).title).toBe('Paint fence');
    db.close();
  });

  it('returns 400 on missing required fields', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/maintenance').send({ title: 'No type' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/maintenance/:id', () => {
  it('updates an item', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const item = repo.create({
      title: 'Old',
      type: 'reminder',
      landlord_report: false,
      renter_mode: false,
    });
    const res = await request(app)
      .patch(`/api/v1/maintenance/${item.id}`)
      .send({ landlord_report: true });
    expect(res.status).toBe(200);
    expect((res.body as { landlord_report: boolean }).landlord_report).toBe(true);
    db.close();
  });
});

describe('DELETE /api/v1/maintenance/:id', () => {
  it('deletes an item', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const item = repo.create({
      title: 'Delete me',
      type: 'job',
      landlord_report: false,
      renter_mode: false,
    });
    const res = await request(app).delete(`/api/v1/maintenance/${item.id}`);
    expect(res.status).toBe(204);
    db.close();
  });

  it('returns 404 for missing item', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).delete('/api/v1/maintenance/9999');
    expect(res.status).toBe(404);
    db.close();
  });
});

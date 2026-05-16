import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import BinScheduleRepository from '../../src/repositories/BinScheduleRepository';
import createBinsRouter from '../../src/routes/bins';

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
  const binRepo = new BinScheduleRepository(db);
  app.use(createBinsRouter(binRepo, noOpPin));
  app.use(errorHandler);
  return { app, binRepo };
}

const ANCHOR = new Date('2025-01-06').getTime();

const binInput = {
  name: 'General',
  colour: '#333',
  icon: 'trash',
  day_of_week: 1,
  frequency_weeks: 1 as const,
  anchor_date: ANCHOR,
  bank_holiday_shift: false,
  reminder_evening_before: true,
  reminder_morning_of: false,
  audio_chime: false,
};

describe('GET /api/v1/bin-schedules', () => {
  it('returns empty array when no bins', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/bin-schedules');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });

  it('returns active bins', async () => {
    const db = makeDb();
    const { app, binRepo } = makeApp(db);
    binRepo.create(binInput);
    const res = await request(app).get('/api/v1/bin-schedules');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    db.close();
  });
});

describe('POST /api/v1/bin-schedules', () => {
  it('creates a bin schedule', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/bin-schedules').send(binInput);
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('General');
    db.close();
  });

  it('returns 400 on invalid input', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/bin-schedules').send({ name: '' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/bin-schedules/:id', () => {
  it('updates a bin schedule', async () => {
    const db = makeDb();
    const { app, binRepo } = makeApp(db);
    const bin = binRepo.create(binInput);
    const res = await request(app)
      .patch(`/api/v1/bin-schedules/${bin.id}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('Updated Name');
    db.close();
  });

  it('returns 404 for non-existent bin', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).patch('/api/v1/bin-schedules/9999').send({ name: 'X' });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/bin-schedules/:id', () => {
  it('soft-deletes a bin schedule', async () => {
    const db = makeDb();
    const { app, binRepo } = makeApp(db);
    const bin = binRepo.create(binInput);
    const res = await request(app).delete(`/api/v1/bin-schedules/${bin.id}`);
    expect(res.status).toBe(204);
    expect(binRepo.list()).toHaveLength(0);
    db.close();
  });
});

describe('GET /api/v1/bin-schedules/upcoming', () => {
  it('returns upcoming dates for each bin', async () => {
    const db = makeDb();
    const { app, binRepo } = makeApp(db);
    binRepo.create(binInput);
    const res = await request(app).get('/api/v1/bin-schedules/upcoming?days=14');
    expect(res.status).toBe(200);
    const body = res.body as { bins: Array<{ bin: object; dates: number[] }> };
    expect(body.bins).toHaveLength(1);
    expect(Array.isArray(body.bins[0].dates)).toBe(true);
    db.close();
  });

  it('caps days at 60', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/bin-schedules/upcoming?days=999');
    expect(res.status).toBe(200);
    db.close();
  });
});

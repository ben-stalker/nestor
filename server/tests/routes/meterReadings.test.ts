import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import MeterReadingRepository from '../../src/repositories/MeterReadingRepository';
import createMeterReadingsRouter from '../../src/routes/meterReadings';

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
  const repo = new MeterReadingRepository(db);
  app.use(createMeterReadingsRouter(repo, noOpPin));
  app.use(errorHandler);
  return { app, repo };
}

describe('GET /api/v1/meter-readings', () => {
  it('returns 400 when fuelType missing', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/meter-readings');
    expect(res.status).toBe(400);
    db.close();
  });

  it('returns readings filtered by fuelType', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    repo.create({ fuel_type: 'electricity', reading_date: Date.now(), value: 1234, unit: 'kWh' });
    repo.create({ fuel_type: 'gas', reading_date: Date.now(), value: 567, unit: 'm3' });
    const res = await request(app).get('/api/v1/meter-readings?fuelType=electricity');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    db.close();
  });
});

describe('POST /api/v1/meter-readings', () => {
  it('creates a reading', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/meter-readings').send({
      fuel_type: 'water',
      reading_date: Date.now(),
      value: 100.5,
      unit: 'm3',
    });
    expect(res.status).toBe(201);
    expect((res.body as { fuel_type: string }).fuel_type).toBe('water');
    db.close();
  });

  it('returns 400 on invalid fuel_type', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/meter-readings').send({
      fuel_type: 'nuclear',
      reading_date: Date.now(),
      value: 100,
      unit: 'kWh',
    });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('DELETE /api/v1/meter-readings/:id', () => {
  it('deletes a reading', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const r = repo.create({ fuel_type: 'oil', reading_date: Date.now(), value: 500, unit: 'L' });
    const res = await request(app).delete(`/api/v1/meter-readings/${r.id}`);
    expect(res.status).toBe(204);
    db.close();
  });

  it('returns 404 for missing reading', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).delete('/api/v1/meter-readings/9999');
    expect(res.status).toBe(404);
    db.close();
  });
});

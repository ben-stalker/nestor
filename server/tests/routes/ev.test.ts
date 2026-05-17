import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import EvChargingRepository from '../../src/repositories/EvChargingRepository';
import VehicleRepository from '../../src/repositories/VehicleRepository';
import MeterReadingRepository from '../../src/repositories/MeterReadingRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import createEvRouter from '../../src/routes/ev';
import defaultsFor from '../../src/services/permissionDefaults';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpPin: RequestHandler = (_req, _res, next) => next();
const blockPin: RequestHandler = (_req, res) => res.status(401).json({ error: 'UNAUTHORIZED' });

function makeApp(
  db: Database.Database,
  profileType: 'admin' | 'teen' = 'admin',
  pinMiddleware: RequestHandler = noOpPin,
) {
  const app = express();
  app.use(express.json());
  const evRepo = new EvChargingRepository(db);
  const vehicleRepo = new VehicleRepository(db);
  const meterRepo = new MeterReadingRepository(db);
  const profileRepo = new ProfileRepository(db);
  const settingsRepo = new AppSettingsRepository(db);

  const profile = profileRepo.create({
    name: 'Test',
    type: profileType,
    colour: '#ff0000',
    permissions_json: defaultsFor(profileType),
  });
  app.use((req, _res, next) => {
    req.headers['x-profile-id'] = String(profile.id);
    next();
  });

  app.use(createEvRouter(evRepo, vehicleRepo, meterRepo, profileRepo, pinMiddleware, settingsRepo));
  app.use(errorHandler);
  return { app, evRepo, vehicleRepo };
}

function makeEv(vehicleRepo: VehicleRepository) {
  return vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
}

describe('GET /api/v1/ev/charging-log', () => {
  it('returns all charging sessions', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db);
    const v = makeEv(vehicleRepo);
    evRepo.create({ vehicle_id: v.id, session_date: 1700000000, kwh: 30 });
    const res = await request(app).get('/api/v1/ev/charging-log');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    db.close();
  });

  it('filters by vehicleId', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db);
    const v1 = makeEv(vehicleRepo);
    const v2 = makeEv(vehicleRepo);
    evRepo.create({ vehicle_id: v1.id, session_date: 1700000000, kwh: 10 });
    evRepo.create({ vehicle_id: v2.id, session_date: 1700000100, kwh: 20 });
    const res = await request(app).get(`/api/v1/ev/charging-log?vehicleId=${v1.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as Array<{ kwh: number }>)[0].kwh).toBe(10);
    db.close();
  });

  it('returns 400 for invalid vehicleId', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/ev/charging-log?vehicleId=abc');
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('POST /api/v1/ev/charging-log', () => {
  it('creates a session', async () => {
    const db = makeDb();
    const { app, vehicleRepo } = makeApp(db);
    const v = makeEv(vehicleRepo);
    const res = await request(app).post('/api/v1/ev/charging-log').send({
      vehicle_id: v.id,
      session_date: 1700000000,
      kwh: 35.5,
      cost_minor: 900,
      location: 'Home',
    });
    expect(res.status).toBe(201);
    expect((res.body as { kwh: number }).kwh).toBe(35.5);
    db.close();
  });

  it('returns 404 if vehicle not found', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/ev/charging-log').send({
      vehicle_id: 9999,
      session_date: 1700000000,
      kwh: 30,
    });
    expect(res.status).toBe(404);
    db.close();
  });

  it('returns 400 for invalid payload', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/ev/charging-log').send({ kwh: -5 });
    expect(res.status).toBe(400);
    db.close();
  });

  it('returns 403 for teen profile (view only)', async () => {
    const db = makeDb();
    const { app, vehicleRepo } = makeApp(db, 'teen');
    const v = makeEv(vehicleRepo);
    const res = await request(app).post('/api/v1/ev/charging-log').send({
      vehicle_id: v.id,
      session_date: 1700000000,
      kwh: 20,
    });
    // Teen has view_vehicles but not manage_vehicles
    expect(res.status).toBe(403);
    db.close();
  });
});

describe('PATCH /api/v1/ev/charging-log/:id', () => {
  it('updates a session', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db);
    const v = makeEv(vehicleRepo);
    const s = evRepo.create({ vehicle_id: v.id, session_date: 1700000000, kwh: 20 });
    const res = await request(app).patch(`/api/v1/ev/charging-log/${s.id}`).send({ kwh: 25 });
    expect(res.status).toBe(200);
    expect((res.body as { kwh: number }).kwh).toBe(25);
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).patch('/api/v1/ev/charging-log/9999').send({ kwh: 25 });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/ev/charging-log/:id', () => {
  it('deletes a session with admin pin', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db, 'admin', noOpPin);
    const v = makeEv(vehicleRepo);
    const s = evRepo.create({ vehicle_id: v.id, session_date: 1700000000, kwh: 20 });
    const res = await request(app).delete(`/api/v1/ev/charging-log/${s.id}`);
    expect(res.status).toBe(204);
    db.close();
  });

  it('returns 401 without admin pin', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db, 'admin', blockPin);
    const v = makeEv(vehicleRepo);
    const s = evRepo.create({ vehicle_id: v.id, session_date: 1700000000, kwh: 20 });
    const res = await request(app).delete(`/api/v1/ev/charging-log/${s.id}`);
    expect(res.status).toBe(401);
    db.close();
  });
});

describe('GET /api/v1/ev/monthly-totals', () => {
  it('returns monthly aggregations', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db);
    const v = makeEv(vehicleRepo);
    const jan = Math.floor(new Date(2026, 0, 15).getTime() / 1000);
    evRepo.create({ vehicle_id: v.id, session_date: jan, kwh: 30, cost_minor: 800 });
    const res = await request(app).get('/api/v1/ev/monthly-totals');
    expect(res.status).toBe(200);
    const body = res.body as Array<{ total_kwh: number; month: number }>;
    expect(body[0].total_kwh).toBe(30);
    expect(body[0].month).toBe(1);
    db.close();
  });
});

describe('GET /api/v1/ev/energy-summary', () => {
  it('returns energy summary structure', async () => {
    const db = makeDb();
    const { app, evRepo, vehicleRepo } = makeApp(db);
    const v = makeEv(vehicleRepo);
    const now = Math.floor(Date.now() / 1000);
    evRepo.create({ vehicle_id: v.id, session_date: now, kwh: 20, cost_minor: 500 });
    const res = await request(app).get('/api/v1/ev/energy-summary');
    expect(res.status).toBe(200);
    const body = res.body as { this_month: { ev_kwh: number } };
    expect(body.this_month.ev_kwh).toBe(20);
    db.close();
  });
});

describe('GET /api/v1/ev/fuel-rates', () => {
  it('returns fuel rates', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/ev/fuel-rates');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current');
    expect(res.body).toHaveProperty('history');
    db.close();
  });
});

describe('PUT /api/v1/ev/fuel-rates', () => {
  it('updates fuel rates', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .put('/api/v1/ev/fuel-rates')
      .send({ electricity: 0.28, gas: 0.1, effective_date: '2026-01-01' });
    expect(res.status).toBe(200);
    expect((res.body as { current: { electricity: number } }).current.electricity).toBe(0.28);
    db.close();
  });

  it('returns 401 without admin pin', async () => {
    const db = makeDb();
    const { app } = makeApp(db, 'admin', blockPin);
    const res = await request(app).put('/api/v1/ev/fuel-rates').send({ electricity: 0.28 });
    expect(res.status).toBe(401);
    db.close();
  });
});

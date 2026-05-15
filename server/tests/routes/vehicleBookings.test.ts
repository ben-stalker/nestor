import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import VehicleRepository from '../../src/repositories/VehicleRepository';
import VehicleBookingRepository from '../../src/repositories/VehicleBookingRepository';
import FuelLogRepository from '../../src/repositories/FuelLogRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createVehiclesRouter from '../../src/routes/vehicles';
import defaultsFor from '../../src/services/permissionDefaults';

jest.mock('sharp', () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  })),
);

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return { ...actual, mkdirSync: jest.fn(), existsSync: jest.fn(() => false) };
});

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

const noOpAdminPin: RequestHandler = (_req, _res, next) => next();

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeRepos(db: Database.Database) {
  return {
    vehicleRepo: new VehicleRepository(db),
    bookingRepo: new VehicleBookingRepository(db),
    fuelRepo: new FuelLogRepository(db),
    profileRepo: new ProfileRepository(db),
  };
}

function makeApp(db: Database.Database) {
  const repos = makeRepos(db);
  const app = express();
  app.use(express.json());
  app.use(
    createVehiclesRouter(
      repos.vehicleRepo,
      repos.bookingRepo,
      repos.fuelRepo,
      repos.profileRepo,
      noOpAdminPin,
    ),
  );
  app.use(errorHandler);
  return { app, ...repos };
}

const T = (offset: number): number => 1_700_000_000_000 + offset * 3_600_000;

describe('Vehicle bookings API', () => {
  it('POST creates booking', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });

    const res = await request(app)
      .post(`/api/v1/vehicles/${v.id}/bookings`)
      .set('X-Profile-Id', String(admin.id))
      .send({ profile_id: admin.id, start_datetime: T(0), end_datetime: T(2) });

    expect(res.status).toBe(201);
    expect((res.body as { vehicle_id: number }).vehicle_id).toBe(v.id);
    db.close();
  });

  it('POST with overlap returns 409 with conflicts array', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    bookingRepo.create(v.id, { start_datetime: T(0), end_datetime: T(4) });

    const res = await request(app)
      .post(`/api/v1/vehicles/${v.id}/bookings`)
      .set('X-Profile-Id', String(admin.id))
      .send({ start_datetime: T(2), end_datetime: T(6) });

    expect(res.status).toBe(409);
    const body409 = res.body as { code: string; details: unknown[] };
    expect(body409.code).toBe('BOOKING_CONFLICT');
    expect(body409.details).toHaveLength(1);
    db.close();
  });

  it('POST touching boundary is NOT a conflict', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    bookingRepo.create(v.id, { start_datetime: T(0), end_datetime: T(2) });

    const res = await request(app)
      .post(`/api/v1/vehicles/${v.id}/bookings`)
      .set('X-Profile-Id', String(admin.id))
      .send({ start_datetime: T(2), end_datetime: T(4) });

    expect(res.status).toBe(201);
    db.close();
  });

  it('PATCH non-overlapping update → 200', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    const b = bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(2),
      profile_id: admin.id,
    });

    const res = await request(app)
      .patch(`/api/v1/vehicles/${v.id}/bookings/${b.id}`)
      .set('X-Profile-Id', String(admin.id))
      .send({ notes: 'updated' });

    expect(res.status).toBe(200);
    expect((res.body as { notes: string }).notes).toBe('updated');
    db.close();
  });

  it('PATCH self-overlap (excluded) → 200', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    const b = bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(4),
      profile_id: admin.id,
    });

    const res = await request(app)
      .patch(`/api/v1/vehicles/${v.id}/bookings/${b.id}`)
      .set('X-Profile-Id', String(admin.id))
      .send({ end_datetime: T(6) });

    expect(res.status).toBe(200);
    db.close();
  });

  it('PATCH another profile booking as non-admin → 403', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const teen = profileRepo.create({
      name: 'Teen',
      type: 'teen',
      colour: '#00ff00',
      text_size: 'default',
      permissions_json: defaultsFor('teen'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    const b = bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(2),
      profile_id: admin.id,
    });

    const res = await request(app)
      .patch(`/api/v1/vehicles/${v.id}/bookings/${b.id}`)
      .set('X-Profile-Id', String(teen.id))
      .send({ notes: 'hack' });

    expect(res.status).toBe(403);
    db.close();
  });

  it('DELETE as owner → 204', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    const b = bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(2),
      profile_id: admin.id,
    });

    const res = await request(app)
      .delete(`/api/v1/vehicles/${v.id}/bookings/${b.id}`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(204);
    db.close();
  });

  it('GET with range filter', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo, bookingRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    bookingRepo.create(v.id, { start_datetime: T(0), end_datetime: T(2) });
    bookingRepo.create(v.id, { start_datetime: T(10), end_datetime: T(12) });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/bookings?from=${T(1)}&to=${T(11)}`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    db.close();
  });

  it('POST rejects end before start', async () => {
    const db = makeDb();
    const { app, vehicleRepo, profileRepo } = makeApp(db);
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#ff0000',
      text_size: 'default',
      permissions_json: defaultsFor('admin'),
      accessibility_json: {},
    });
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });

    const res = await request(app)
      .post(`/api/v1/vehicles/${v.id}/bookings`)
      .set('X-Profile-Id', String(admin.id))
      .send({ start_datetime: T(4), end_datetime: T(0) });

    expect(res.status).toBe(400);
    db.close();
  });
});

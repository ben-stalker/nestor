import Database from 'better-sqlite3';
import express, { type RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import VehicleRepository from '../../src/repositories/VehicleRepository';
import VehicleBookingRepository from '../../src/repositories/VehicleBookingRepository';
import FuelLogRepository from '../../src/repositories/FuelLogRepository';
import createVehiclesRouter from '../../src/routes/vehicles';
import defaultsFor from '../../src/services/permissionDefaults';
import { initCrypto } from '../../src/utils/crypto';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
const noOpAdminPin: RequestHandler = (_req, _res, next) => next();

const T = (offset: number): number => 1_700_000_000_000 + offset * 3_600_000;

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeSetup(db: Database.Database, freelancerEnabled?: boolean) {
  const settingsRepo = new AppSettingsRepository(db);
  if (freelancerEnabled !== undefined) {
    settingsRepo.set('freelancer_features', freelancerEnabled);
  }
  const profileRepo = new ProfileRepository(db);
  const vehicleRepo = new VehicleRepository(db);
  const bookingRepo = new VehicleBookingRepository(db);
  const fuelRepo = new FuelLogRepository(db);

  const admin = profileRepo.create({
    name: 'Admin',
    type: 'admin',
    colour: '#ff0000',
    text_size: 'default',
    permissions_json: defaultsFor('admin'),
    accessibility_json: {},
  });

  const app = express();
  app.use(express.json());
  app.use(
    createVehiclesRouter(
      vehicleRepo,
      bookingRepo,
      fuelRepo,
      profileRepo,
      noOpAdminPin,
      settingsRepo,
    ),
  );
  app.use(errorHandler);

  return { app, vehicleRepo, bookingRepo, admin };
}

describe('GET /api/v1/vehicles/:id/business-mileage', () => {
  it('returns 404 when freelancer_features is not enabled', async () => {
    const db = makeDb();
    const { app, vehicleRepo, admin } = makeSetup(db);
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/business-mileage`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(404);
    db.close();
  });

  it('returns 404 when freelancer_features is explicitly false', async () => {
    const db = makeDb();
    const { app, vehicleRepo, admin } = makeSetup(db, false);
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/business-mileage`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(404);
    db.close();
  });

  it('returns 404 when vehicle not found', async () => {
    const db = makeDb();
    const { app, admin } = makeSetup(db, true);

    const res = await request(app)
      .get('/api/v1/vehicles/9999/business-mileage')
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(404);
    db.close();
  });

  it('returns zero totals when no business bookings', async () => {
    const db = makeDb();
    const { app, vehicleRepo, bookingRepo, admin } = makeSetup(db, true);
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    // A non-business booking
    bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(2),
      business: false,
      miles: 50,
    });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/business-mileage`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(200);
    const body = res.body as { totalMiles: number; tripCount: number };
    expect(body.totalMiles).toBe(0);
    expect(body.tripCount).toBe(0);
    db.close();
  });

  it('sums miles from business bookings', async () => {
    const db = makeDb();
    const { app, vehicleRepo, bookingRepo, admin } = makeSetup(db, true);
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(2),
      business: true,
      miles: 30,
    });
    bookingRepo.create(v.id, {
      start_datetime: T(3),
      end_datetime: T(5),
      business: true,
      miles: 20,
    });
    bookingRepo.create(v.id, {
      start_datetime: T(6),
      end_datetime: T(8),
      business: false,
      miles: 99,
    });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/business-mileage`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(200);
    const body = res.body as { totalMiles: number; tripCount: number };
    expect(body.totalMiles).toBe(50);
    expect(body.tripCount).toBe(2);
    db.close();
  });

  it('filters by from/to query params', async () => {
    const db = makeDb();
    const { app, vehicleRepo, bookingRepo, admin } = makeSetup(db, true);
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    bookingRepo.create(v.id, {
      start_datetime: T(0),
      end_datetime: T(2),
      business: true,
      miles: 10,
    });
    bookingRepo.create(v.id, {
      start_datetime: T(10),
      end_datetime: T(12),
      business: true,
      miles: 40,
    });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/business-mileage?from=${T(5)}&to=${T(15)}`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(200);
    const body = res.body as { totalMiles: number; tripCount: number };
    expect(body.totalMiles).toBe(40);
    expect(body.tripCount).toBe(1);
    db.close();
  });

  it('ignores business bookings with no miles', async () => {
    const db = makeDb();
    const { app, vehicleRepo, bookingRepo, admin } = makeSetup(db, true);
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    bookingRepo.create(v.id, { start_datetime: T(0), end_datetime: T(2), business: true });

    const res = await request(app)
      .get(`/api/v1/vehicles/${v.id}/business-mileage`)
      .set('X-Profile-Id', String(admin.id));

    expect(res.status).toBe(200);
    const body = res.body as { totalMiles: number; tripCount: number };
    expect(body.totalMiles).toBe(0);
    expect(body.tripCount).toBe(0);
    db.close();
  });
});

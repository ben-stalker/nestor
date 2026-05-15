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

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

const noOpAdminPin: RequestHandler = (_req, _res, next) => next();

function makeApp(
  vehicleRepo: VehicleRepository,
  bookingRepo: VehicleBookingRepository,
  fuelRepo: FuelLogRepository,
  profileRepo: ProfileRepository,
  adminPin: RequestHandler = noOpAdminPin,
) {
  const app = express();
  app.use(express.json());
  app.use(createVehiclesRouter(vehicleRepo, bookingRepo, fuelRepo, profileRepo, adminPin));
  app.use(errorHandler);
  return app;
}

function makeRepos(db: Database.Database) {
  return {
    vehicleRepo: new VehicleRepository(db),
    bookingRepo: new VehicleBookingRepository(db),
    fuelRepo: new FuelLogRepository(db),
    profileRepo: new ProfileRepository(db),
  };
}

function addAdminProfile(profileRepo: ProfileRepository) {
  return profileRepo.create({
    name: 'Admin',
    type: 'admin',
    colour: '#ff0000',
    text_size: 'default',
    permissions_json: defaultsFor('admin'),
    accessibility_json: {},
  });
}

function addChildProfile(profileRepo: ProfileRepository) {
  return profileRepo.create({
    name: 'Child',
    type: 'child',
    colour: '#00ff00',
    text_size: 'default',
    permissions_json: defaultsFor('child'),
    accessibility_json: {},
  });
}

const SAMPLE_ENTRY = {
  date: new Date('2024-01-15').getTime(),
  litres: 45.5,
  cost_minor: 6850,
  mileage: 54321,
};

describe('GET /api/v1/vehicles/:id/fuel-log', () => {
  it('returns empty list for new vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .get(`/api/v1/vehicles/${vehicle.id}/fuel-log`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });

  it('returns 404 for unknown vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .get('/api/v1/vehicles/9999/fuel-log')
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('POST /api/v1/vehicles/:id/fuel-log', () => {
  it('admin creates a fuel log entry', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle.id}/fuel-log`)
      .set('X-Profile-Id', String(admin.id))
      .send(SAMPLE_ENTRY);
    expect(res.status).toBe(201);
    const body = res.body as { litres: number; cost_minor: number; mileage: number };
    expect(body.litres).toBe(45.5);
    expect(body.cost_minor).toBe(6850);
    expect(body.mileage).toBe(54321);
    db.close();
  });

  it('child (no manage_vehicles) gets 403', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const child = addChildProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle.id}/fuel-log`)
      .set('X-Profile-Id', String(child.id))
      .send(SAMPLE_ENTRY);
    expect(res.status).toBe(403);
    db.close();
  });

  it('returns 404 for unknown vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post('/api/v1/vehicles/9999/fuel-log')
      .set('X-Profile-Id', String(admin.id))
      .send(SAMPLE_ENTRY);
    expect(res.status).toBe(404);
    db.close();
  });

  it('rejects invalid body', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle.id}/fuel-log`)
      .set('X-Profile-Id', String(admin.id))
      .send({ litres: -5 }); // negative litres, missing required fields
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/vehicles/:id/fuel-log/:entryId', () => {
  it('admin updates a fuel log entry', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const entry = repos.fuelRepo.create(vehicle.id, SAMPLE_ENTRY);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .patch(`/api/v1/vehicles/${vehicle.id}/fuel-log/${entry.id}`)
      .set('X-Profile-Id', String(admin.id))
      .send({ litres: 50.0 });
    expect(res.status).toBe(200);
    expect((res.body as { litres: number }).litres).toBe(50.0);
    db.close();
  });

  it('returns 404 for entry belonging to a different vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle1 = repos.vehicleRepo.create({ nickname: 'Car 1', type: 'car' });
    const vehicle2 = repos.vehicleRepo.create({ nickname: 'Car 2', type: 'car' });
    const entry = repos.fuelRepo.create(vehicle1.id, SAMPLE_ENTRY);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    // Try to patch entry from vehicle1 via vehicle2's URL
    const res = await request(app)
      .patch(`/api/v1/vehicles/${vehicle2.id}/fuel-log/${entry.id}`)
      .set('X-Profile-Id', String(admin.id))
      .send({ litres: 50.0 });
    expect(res.status).toBe(404);
    db.close();
  });

  it('returns 404 for unknown entry', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .patch(`/api/v1/vehicles/${vehicle.id}/fuel-log/9999`)
      .set('X-Profile-Id', String(admin.id))
      .send({ litres: 50.0 });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/vehicles/:id/fuel-log/:entryId', () => {
  it('admin deletes a fuel log entry', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const entry = repos.fuelRepo.create(vehicle.id, SAMPLE_ENTRY);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .delete(`/api/v1/vehicles/${vehicle.id}/fuel-log/${entry.id}`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(204);
    // Verify it's gone
    const listRes = await request(app)
      .get(`/api/v1/vehicles/${vehicle.id}/fuel-log`)
      .set('X-Profile-Id', String(admin.id));
    expect((listRes.body as unknown[]).length).toBe(0);
    db.close();
  });

  it('returns 404 for entry belonging to a different vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const vehicle1 = repos.vehicleRepo.create({ nickname: 'Car 1', type: 'car' });
    const vehicle2 = repos.vehicleRepo.create({ nickname: 'Car 2', type: 'car' });
    const entry = repos.fuelRepo.create(vehicle1.id, SAMPLE_ENTRY);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .delete(`/api/v1/vehicles/${vehicle2.id}/fuel-log/${entry.id}`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(404);
    db.close();
  });

  it('child (no manage_vehicles) gets 403', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const child = addChildProfile(repos.profileRepo);
    const vehicle = repos.vehicleRepo.create({ nickname: 'Test Car', type: 'car' });
    const entry = repos.fuelRepo.create(vehicle.id, SAMPLE_ENTRY);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .delete(`/api/v1/vehicles/${vehicle.id}/fuel-log/${entry.id}`)
      .set('X-Profile-Id', String(child.id));
    expect(res.status).toBe(403);
    db.close();
  });
});

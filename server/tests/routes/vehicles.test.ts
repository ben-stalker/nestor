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
const blockAdminPin: RequestHandler = (_req, res) => {
  res.status(403).json({ error: 'Invalid admin PIN', code: 'INVALID_ADMIN_PIN' });
};

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

describe('GET /api/v1/vehicles', () => {
  it('returns empty list', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app).get('/api/v1/vehicles').set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });

  it('returns 401 without profile header', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app).get('/api/v1/vehicles');
    expect(res.status).toBe(401);
    db.close();
  });
});

describe('POST /api/v1/vehicles', () => {
  it('admin creates a vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('X-Profile-Id', String(admin.id))
      .send({ nickname: 'Family Car', type: 'car', registration: 'AB12 CDE' });
    expect(res.status).toBe(201);
    const body = res.body as { nickname: string; type: string };
    expect(body.nickname).toBe('Family Car');
    expect(body.type).toBe('car');
    db.close();
  });

  it('child (no manage_vehicles) gets 403', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const child = addChildProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('X-Profile-Id', String(child.id))
      .send({ nickname: 'My Bike', type: 'bicycle' });
    expect(res.status).toBe(403);
    db.close();
  });

  it('rejects invalid type', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('X-Profile-Id', String(admin.id))
      .send({ nickname: 'X', type: 'hovercraft' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/vehicles/:id', () => {
  it('updates vehicle fields', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const v = repos.vehicleRepo.create({ nickname: 'Old', type: 'car' });
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .patch(`/api/v1/vehicles/${v.id}`)
      .set('X-Profile-Id', String(admin.id))
      .send({ nickname: 'New' });
    expect(res.status).toBe(200);
    expect((res.body as { nickname: string }).nickname).toBe('New');
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.vehicleRepo, repos.bookingRepo, repos.fuelRepo, repos.profileRepo);
    const res = await request(app)
      .patch('/api/v1/vehicles/9999')
      .set('X-Profile-Id', String(admin.id))
      .send({ nickname: 'X' });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/vehicles/:id', () => {
  it('admin deletes vehicle', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const v = repos.vehicleRepo.create({ nickname: 'Old', type: 'car' });
    const app = makeApp(
      repos.vehicleRepo,
      repos.bookingRepo,
      repos.fuelRepo,
      repos.profileRepo,
      noOpAdminPin,
    );
    const res = await request(app)
      .delete(`/api/v1/vehicles/${v.id}`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(204);
    db.close();
  });

  it('blocks without admin PIN', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const v = repos.vehicleRepo.create({ nickname: 'Car', type: 'car' });
    const app = makeApp(
      repos.vehicleRepo,
      repos.bookingRepo,
      repos.fuelRepo,
      repos.profileRepo,
      blockAdminPin,
    );
    const res = await request(app)
      .delete(`/api/v1/vehicles/${v.id}`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(403);
    db.close();
  });
});

import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import PetRepository from '../../src/repositories/PetRepository';
import PetHealthLogRepository from '../../src/repositories/PetHealthLogRepository';
import EventRepository from '../../src/repositories/EventRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createPetsRouter from '../../src/routes/pets';
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
  petRepo: PetRepository,
  petHealthRepo: PetHealthLogRepository,
  profileRepo: ProfileRepository,
  adminPin: RequestHandler = noOpAdminPin,
  eventRepo?: EventRepository,
) {
  const app = express();
  app.use(express.json());
  app.use(createPetsRouter(petRepo, petHealthRepo, adminPin, profileRepo, eventRepo));
  app.use(errorHandler);
  return app;
}

function makeRepos(db: Database.Database) {
  return {
    petRepo: new PetRepository(db),
    petHealthRepo: new PetHealthLogRepository(db),
    eventRepo: new EventRepository(db),
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

// ─── GET /api/v1/pets ─────────────────────────────────────────────────────────

describe('GET /api/v1/pets', () => {
  it('returns empty list', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo);
    const res = await request(app).get('/api/v1/pets').set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });

  it('returns 401 without profile header', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo);
    const res = await request(app).get('/api/v1/pets');
    expect(res.status).toBe(401);
    db.close();
  });

  it('returns active pets', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const inactive = repos.petRepo.create({ name: 'Old Cat', species: 'cat' });
    repos.petRepo.delete(inactive.id);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo);
    const res = await request(app).get('/api/v1/pets').set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBe(1);
    db.close();
  });
});

// ─── POST /api/v1/pets ────────────────────────────────────────────────────────

describe('POST /api/v1/pets', () => {
  it('admin creates a pet', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .post('/api/v1/pets')
      .set('X-Profile-Id', String(admin.id))
      .send({ name: 'Buddy', species: 'dog' });
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('Buddy');
    db.close();
  });

  it('returns 403 when admin pin rejected', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, blockAdminPin);
    const res = await request(app)
      .post('/api/v1/pets')
      .set('X-Profile-Id', String(admin.id))
      .send({ name: 'Buddy', species: 'dog' });
    expect(res.status).toBe(403);
    db.close();
  });

  it('rejects invalid species', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .post('/api/v1/pets')
      .set('X-Profile-Id', String(admin.id))
      .send({ name: 'X', species: 'dragon' });
    expect(res.status).toBe(400);
    db.close();
  });
});

// ─── PATCH /api/v1/pets/:id ───────────────────────────────────────────────────

describe('PATCH /api/v1/pets/:id', () => {
  it('updates pet fields', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .patch(`/api/v1/pets/${pet.id}`)
      .set('X-Profile-Id', String(admin.id))
      .send({ name: 'Max' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('Max');
    db.close();
  });

  it('returns 404 for unknown pet', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .patch('/api/v1/pets/9999')
      .set('X-Profile-Id', String(admin.id))
      .send({ name: 'X' });
    expect(res.status).toBe(404);
    db.close();
  });
});

// ─── DELETE /api/v1/pets/:id ──────────────────────────────────────────────────

describe('DELETE /api/v1/pets/:id', () => {
  it('soft deletes a pet', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .delete(`/api/v1/pets/${pet.id}`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(204);
    expect(repos.petRepo.get(pet.id)?.is_active).toBe(false);
    db.close();
  });
});

// ─── GET /api/v1/pets/:id/health-log ─────────────────────────────────────────

describe('GET /api/v1/pets/:id/health-log', () => {
  it('returns empty list for new pet', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo);
    const res = await request(app)
      .get(`/api/v1/pets/${pet.id}/health-log`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });

  it('returns 404 for unknown pet', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo);
    const res = await request(app)
      .get('/api/v1/pets/9999/health-log')
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(404);
    db.close();
  });
});

// ─── POST /api/v1/pets/:id/health-log ────────────────────────────────────────

describe('POST /api/v1/pets/:id/health-log', () => {
  it('creates health log entry', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .post(`/api/v1/pets/${pet.id}/health-log`)
      .set('X-Profile-Id', String(admin.id))
      .send({ log_type: 'vaccination', title: 'Rabies', log_date: '2024-01-15' });
    expect(res.status).toBe(201);
    expect((res.body as { title: string }).title).toBe('Rabies');
    db.close();
  });

  it('creates calendar event for vet_visit with vet_appointment_date', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const app = makeApp(
      repos.petRepo,
      repos.petHealthRepo,
      repos.profileRepo,
      noOpAdminPin,
      repos.eventRepo,
    );
    const res = await request(app)
      .post(`/api/v1/pets/${pet.id}/health-log`)
      .set('X-Profile-Id', String(admin.id))
      .send({
        log_type: 'vet_visit',
        title: 'Annual checkup',
        log_date: '2024-01-15',
        vet_appointment_date: '2024-02-01',
      });
    expect(res.status).toBe(201);
    const body = res.body as { linked_calendar_event_id: number | null };
    expect(body.linked_calendar_event_id).not.toBeNull();
    db.close();
  });

  it('returns 400 for missing required fields', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .post(`/api/v1/pets/${pet.id}/health-log`)
      .set('X-Profile-Id', String(admin.id))
      .send({ log_type: 'vaccination' }); // missing title and log_date
    expect(res.status).toBe(400);
    db.close();
  });
});

// ─── DELETE /api/v1/pets/:id/health-log/:logId ───────────────────────────────

describe('DELETE /api/v1/pets/:id/health-log/:logId', () => {
  it('deletes a health log entry', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const entry = repos.petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'vaccination',
      title: 'Test',
      log_date: '2024-01-01',
    });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo, noOpAdminPin);
    const res = await request(app)
      .delete(`/api/v1/pets/${pet.id}/health-log/${entry.id}`)
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(204);
    expect(repos.petHealthRepo.get(entry.id)).toBeUndefined();
    db.close();
  });
});

// ─── GET /api/v1/pets/upcoming-care ──────────────────────────────────────────

describe('GET /api/v1/pets/upcoming-care', () => {
  it('returns upcoming care items', async () => {
    const db = makeDb();
    const repos = makeRepos(db);
    const admin = addAdminProfile(repos.profileRepo);
    const pet = repos.petRepo.create({ name: 'Buddy', species: 'dog' });
    const inFiveDays = new Date();
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    repos.petHealthRepo.create({
      pet_id: pet.id,
      log_type: 'flea_treatment',
      title: 'Flea treatment',
      log_date: '2024-01-01',
      next_due_date: inFiveDays.toISOString().split('T')[0],
    });
    const app = makeApp(repos.petRepo, repos.petHealthRepo, repos.profileRepo);
    const res = await request(app)
      .get('/api/v1/pets/upcoming-care')
      .set('X-Profile-Id', String(admin.id));
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBeGreaterThan(0);
    db.close();
  });
});

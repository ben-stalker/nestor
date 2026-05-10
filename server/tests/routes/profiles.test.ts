import Database from 'better-sqlite3';
import express, { type RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import { createPinVerifyLimiter } from '../../src/middleware/rateLimit';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import createProfilesRouter from '../../src/routes/profiles';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

const noopLimiter: RequestHandler = (_req, _res, next) => next();
const noopAdminPin: RequestHandler = (_req, _res, next) => next();

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(
  repo: ProfileRepository,
  pinLimiter: RequestHandler = noopLimiter,
  adminPin: RequestHandler = noopAdminPin,
) {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/profiles', createProfilesRouter(repo, pinLimiter, adminPin));
  app.use(errorHandler);
  return app;
}

interface ProfileBody {
  id: number;
  name: string;
  colour: string;
  pin_hash?: string;
}

interface ErrorBody {
  error: string;
  code: string;
  details?: unknown;
}

interface ValidBody {
  valid: boolean;
}

const adminPayload = { name: 'Admin', type: 'admin' as const, colour: '#112233' };
const childPayload = { name: 'Alice', type: 'child' as const, colour: '#334455' };

// ---------------------------------------------------------------------------

describe('GET /api/v1/profiles', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('returns 200 with empty array when no profiles exist', async () => {
    const res = await request(app).get('/api/v1/profiles');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns list of profiles', async () => {
    repo.create(adminPayload);
    const res = await request(app).get('/api/v1/profiles');
    const body = res.body as ProfileBody[];
    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Admin');
  });

  it('never exposes pin_hash', async () => {
    repo.create({ ...adminPayload, pin: '9999' });
    const res = await request(app).get('/api/v1/profiles');
    const body = res.body as ProfileBody[];
    expect(res.status).toBe(200);
    body.forEach((p) => expect(p).not.toHaveProperty('pin_hash'));
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/v1/profiles', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('creates a profile and returns 201 with body', async () => {
    const res = await request(app).post('/api/v1/profiles').send(adminPayload);
    const body = res.body as ProfileBody;
    expect(res.status).toBe(201);
    expect(body.name).toBe('Admin');
    expect(body.id).toBeGreaterThan(0);
    expect(body).not.toHaveProperty('pin_hash');
  });

  it('returns 400 with VALIDATION_ERROR when colour is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/profiles')
      .send({ ...adminPayload, colour: 'red' });
    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body).toHaveProperty('details');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/profiles')
      .send({ type: 'admin', colour: '#112233' });
    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/profiles')
      .send({ ...adminPayload, type: 'superuser' });
    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------

describe('PATCH /api/v1/profiles/:id', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('updates specified fields and returns the profile', async () => {
    const profile = repo.create(adminPayload);
    const res = await request(app)
      .patch(`/api/v1/profiles/${profile.id}`)
      .send({ name: 'SuperAdmin' });
    const body = res.body as ProfileBody;
    expect(res.status).toBe(200);
    expect(body.name).toBe('SuperAdmin');
    expect(body.colour).toBe(adminPayload.colour);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).patch('/api/v1/profiles/9999').send({ name: 'Ghost' });
    const body = res.body as ErrorBody;
    expect(res.status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 400 with VALIDATION_ERROR for invalid colour', async () => {
    const profile = repo.create(adminPayload);
    const res = await request(app).patch(`/api/v1/profiles/${profile.id}`).send({ colour: 'blue' });
    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('does not expose pin_hash in response', async () => {
    const profile = repo.create({ ...adminPayload, pin: '1234' });
    const res = await request(app)
      .patch(`/api/v1/profiles/${profile.id}`)
      .send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body as ProfileBody).not.toHaveProperty('pin_hash');
  });
});

// ---------------------------------------------------------------------------

describe('DELETE /api/v1/profiles/:id', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('deletes a non-admin profile and returns 204', async () => {
    const profile = repo.create(childPayload);
    const res = await request(app).delete(`/api/v1/profiles/${profile.id}`);
    expect(res.status).toBe(204);
  });

  it('returns 400 with code LAST_ADMIN when deleting the last admin', async () => {
    const admin = repo.create(adminPayload);
    const res = await request(app).delete(`/api/v1/profiles/${admin.id}`);
    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.code).toBe('LAST_ADMIN');
  });

  it('can delete an admin when another admin exists', async () => {
    const admin1 = repo.create(adminPayload);
    repo.create({ ...adminPayload, name: 'Admin2' });
    const res = await request(app).delete(`/api/v1/profiles/${admin1.id}`);
    expect(res.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/v1/profiles/:id/verify-pin', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('returns { valid: true } for the correct PIN', async () => {
    const profile = repo.create({ ...adminPayload, pin: 'secret' });
    const res = await request(app)
      .post(`/api/v1/profiles/${profile.id}/verify-pin`)
      .send({ pin: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body as ValidBody).toEqual({ valid: true });
  });

  it('returns { valid: false } for an incorrect PIN', async () => {
    const profile = repo.create({ ...adminPayload, pin: 'secret' });
    const res = await request(app)
      .post(`/api/v1/profiles/${profile.id}/verify-pin`)
      .send({ pin: 'wrong' });
    expect(res.status).toBe(200);
    expect(res.body as ValidBody).toEqual({ valid: false });
  });

  it('returns { valid: false } when no PIN is set', async () => {
    const profile = repo.create(adminPayload);
    const res = await request(app)
      .post(`/api/v1/profiles/${profile.id}/verify-pin`)
      .send({ pin: 'anything' });
    expect(res.status).toBe(200);
    expect(res.body as ValidBody).toEqual({ valid: false });
  });

  it('returns 400 when pin is missing from body', async () => {
    const profile = repo.create(adminPayload);
    const res = await request(app).post(`/api/v1/profiles/${profile.id}/verify-pin`).send({});
    const body = res.body as ErrorBody;
    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 429 on the 6th attempt within the rate limit window', async () => {
    const rateLimitDb = makeDb();
    const rateLimitRepo = new ProfileRepository(rateLimitDb);
    const rateLimitedApp = makeApp(rateLimitRepo, createPinVerifyLimiter());

    const profile = rateLimitRepo.create({ ...adminPayload, pin: 'secret' });
    const url = `/api/v1/profiles/${profile.id}/verify-pin`;

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const r = await request(rateLimitedApp).post(url).send({ pin: 'wrong' });
      expect(r.status).toBe(200);
    }

    const blocked = await request(rateLimitedApp).post(url).send({ pin: 'wrong' });
    expect(blocked.status).toBe(429);

    rateLimitDb.close();
  });
});

// ---------------------------------------------------------------------------

describe('GET /api/v1/profiles/:id/permissions', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('returns the parsed permissions_json object', async () => {
    const profile = repo.create({
      ...adminPayload,
      permissions_json: { can_edit: true, can_delete: false },
    });
    const res = await request(app).get(`/api/v1/profiles/${profile.id}/permissions`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ can_edit: true, can_delete: false });
  });

  it('returns empty object when no permissions are set', async () => {
    const profile = repo.create(adminPayload);
    const res = await request(app).get(`/api/v1/profiles/${profile.id}/permissions`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('returns 404 for a non-existent profile', async () => {
    const res = await request(app).get('/api/v1/profiles/9999/permissions');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });
});

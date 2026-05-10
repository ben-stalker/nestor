import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import requirePermission from '../../src/middleware/requirePermission';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import type { Profile } from '../../src/types/profile';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(profile: Profile | undefined) {
  const app = express();
  app.use(express.json());
  // Inject profile directly onto req for isolation testing
  app.use((req, _res, next) => {
    req.profile = profile;
    next();
  });
  app.get('/test', requirePermission('add_recipe'), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

interface ErrorBody {
  error: string;
  code: string;
  details?: { required: string };
}

describe('requirePermission middleware', () => {
  let db: Database.Database;
  let repo: ProfileRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
  });

  afterEach(() => db.close());

  it('returns 401 NO_PROFILE when req.profile is not set', async () => {
    const app = makeApp(undefined);
    const res = await request(app).get('/test');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(401);
    expect(body.code).toBe('NO_PROFILE');
  });

  it('returns 403 PERMISSION_DENIED when profile lacks the permission', async () => {
    const profile = repo.create({
      name: 'Child',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: { view_calendar: true },
    });
    const app = makeApp(profile);
    const res = await request(app).get('/test');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('PERMISSION_DENIED');
    expect(body.details?.required).toBe('add_recipe');
  });

  it('returns 403 when permission is explicitly false', async () => {
    const profile = repo.create({
      name: 'Child',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: { add_recipe: false },
    });
    const app = makeApp(profile);
    const res = await request(app).get('/test');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('PERMISSION_DENIED');
  });

  it('calls next() when the profile has the required permission', async () => {
    const profile = repo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#112233',
      permissions_json: { add_recipe: true },
    });
    const app = makeApp(profile);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);
  });

  it('returns 403 when permissions_json is empty object', async () => {
    const profile = repo.create({ name: 'Guest', type: 'guest', colour: '#ccddee' });
    const app = makeApp(profile);
    const res = await request(app).get('/test');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(403);
    expect(body.code).toBe('PERMISSION_DENIED');
  });
});

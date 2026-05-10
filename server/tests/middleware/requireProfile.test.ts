import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import createRequireProfile from '../../src/middleware/requireProfile';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import type { Profile } from '../../src/types/profile';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(repo: ProfileRepository) {
  const app = express();
  app.use(express.json());
  app.use(createRequireProfile(repo));
  app.get('/test', (req, res) => {
    res.json({ profileId: req.profile?.id });
  });
  return app;
}

interface ErrorBody {
  error: string;
  code: string;
}

const adminPayload = { name: 'Admin', type: 'admin' as const, colour: '#112233' };

describe('requireProfile middleware', () => {
  let db: Database.Database;
  let repo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    repo = new ProfileRepository(db);
    app = makeApp(repo);
  });

  afterEach(() => db.close());

  it('returns 401 UNKNOWN_PROFILE when X-Profile-Id header is missing', async () => {
    const res = await request(app).get('/test');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(401);
    expect(body.code).toBe('UNKNOWN_PROFILE');
  });

  it('returns 401 UNKNOWN_PROFILE when X-Profile-Id is non-numeric', async () => {
    const res = await request(app).get('/test').set('X-Profile-Id', 'abc');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(401);
    expect(body.code).toBe('UNKNOWN_PROFILE');
  });

  it('returns 401 UNKNOWN_PROFILE when X-Profile-Id refers to a non-existent profile', async () => {
    const res = await request(app).get('/test').set('X-Profile-Id', '9999');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(401);
    expect(body.code).toBe('UNKNOWN_PROFILE');
  });

  it('attaches req.profile and calls next() for a valid profile', async () => {
    const profile = repo.create(adminPayload);
    const res = await request(app).get('/test').set('X-Profile-Id', String(profile.id));
    expect(res.status).toBe(200);
    expect((res.body as { profileId: number }).profileId).toBe(profile.id);
  });

  it('returns 401 when X-Profile-Id is zero', async () => {
    const res = await request(app).get('/test').set('X-Profile-Id', '0');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(401);
    expect(body.code).toBe('UNKNOWN_PROFILE');
  });

  it('returns 401 when X-Profile-Id is negative', async () => {
    const res = await request(app).get('/test').set('X-Profile-Id', '-1');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(401);
    expect(body.code).toBe('UNKNOWN_PROFILE');
  });

  it('attaches the full profile object including permissions', async () => {
    const profile = repo.create({
      ...adminPayload,
      permissions_json: { view_calendar: true },
    });
    const capturedProfile: Profile[] = [];
    const app2 = express();
    app2.use(createRequireProfile(repo));
    app2.get('/test', (req, innerRes) => {
      capturedProfile.push(req.profile!);
      innerRes.json({});
    });
    await request(app2).get('/test').set('X-Profile-Id', String(profile.id));
    expect(capturedProfile[0].name).toBe('Admin');
    expect(capturedProfile[0].permissions_json).toEqual({ view_calendar: true });
  });
});

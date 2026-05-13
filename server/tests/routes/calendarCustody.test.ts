import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import EventRepository from '../../src/repositories/EventRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createCalendarRouter from '../../src/routes/calendar';
import type { Profile } from '../../src/types/profile';
import defaultsFor from '../../src/services/permissionDefaults';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeApp(eventRepo: EventRepository, profileRepo: ProfileRepository) {
  const app = express();
  app.use(express.json());
  app.use(createCalendarRouter(eventRepo, profileRepo));
  app.use(errorHandler);
  return app;
}

const NOW = 1_700_000_000_000;
const HOUR = 3_600_000;

describe('Calendar — custody event visibility', () => {
  let db: Database.Database;
  let eventRepo: EventRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;
  let admin: Profile;
  let child: Profile;

  beforeEach(() => {
    db = makeDb();
    eventRepo = new EventRepository(db);
    profileRepo = new ProfileRepository(db);
    app = makeApp(eventRepo, profileRepo);

    admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#000000',
      permissions_json: defaultsFor('admin'),
    });

    child = profileRepo.create({
      name: 'Child',
      type: 'child',
      colour: '#aabbcc',
      permissions_json: defaultsFor('child'),
    });

    // Create one custody event and one normal event
    eventRepo.create({
      title: 'With Mum',
      start_datetime: NOW,
      end_datetime: NOW + HOUR,
      all_day: false,
      source: 'local',
      type: 'custody',
    });

    eventRepo.create({
      title: 'School run',
      start_datetime: NOW,
      end_datetime: NOW + HOUR,
      all_day: false,
      source: 'local',
      type: 'default',
    });
  });

  it('admin profile receives custody events', async () => {
    const res = await request(app)
      .get(`/api/v1/calendar/events?start=${NOW - HOUR}&end=${NOW + 2 * HOUR}`)
      .set('x-profile-id', String(admin.id));

    expect(res.status).toBe(200);
    const titles = (res.body as Array<{ title: string }>).map((e) => e.title);
    expect(titles).toContain('With Mum');
    expect(titles).toContain('School run');
  });

  it('non-admin profile does not receive custody events', async () => {
    const res = await request(app)
      .get(`/api/v1/calendar/events?start=${NOW - HOUR}&end=${NOW + 2 * HOUR}`)
      .set('x-profile-id', String(child.id));

    expect(res.status).toBe(200);
    const titles = (res.body as Array<{ title: string }>).map((e) => e.title);
    expect(titles).not.toContain('With Mum');
    expect(titles).toContain('School run');
  });

  it('non-admin only gets the non-custody event count', async () => {
    const res = await request(app)
      .get(`/api/v1/calendar/events?start=${NOW - HOUR}&end=${NOW + 2 * HOUR}`)
      .set('x-profile-id', String(child.id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

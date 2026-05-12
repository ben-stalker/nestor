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

function withProfile(profile: Profile) {
  return { 'x-profile-id': String(profile.id) };
}

const NOW = 1_700_000_000_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe('Calendar events API', () => {
  let db: Database.Database;
  let eventRepo: EventRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;
  let admin: Profile;
  let teen: Profile;
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
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('admin'),
    });
    teen = profileRepo.create({
      name: 'Teen',
      type: 'teen',
      colour: '#0000FF',
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('teen'),
    });
    child = profileRepo.create({
      name: 'Child',
      type: 'child',
      colour: '#FF0000',
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('child'),
    });
  });

  afterEach(() => {
    db.close();
  });

  // ---------------------------------------------------------------------------
  describe('POST /api/v1/calendar/events', () => {
    it('creates event as admin → 201', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(withProfile(admin))
        .send({ title: 'Meeting', start_datetime: NOW, end_datetime: NOW + HOUR });
      expect(res.status).toBe(201);
      expect((res.body as { title: string; source: string }).title).toBe('Meeting');
      expect((res.body as { title: string; source: string }).source).toBe('local');
    });

    it('creates event as teen (has add_calendar_event) → 201', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(withProfile(teen))
        .send({ title: 'Party', start_datetime: NOW, end_datetime: NOW + HOUR });
      expect(res.status).toBe(201);
    });

    it('denies event creation as child → 403', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(withProfile(child))
        .send({ title: 'Test', start_datetime: NOW, end_datetime: NOW + HOUR });
      expect(res.status).toBe(403);
    });

    it('returns 401 without profile header', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .send({ title: 'Test', start_datetime: NOW, end_datetime: NOW + HOUR });
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid colour_override', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(withProfile(admin))
        .send({
          title: 'Test',
          start_datetime: NOW,
          end_datetime: NOW + HOUR,
          colour_override: 'not-a-colour',
        });
      expect(res.status).toBe(400);
      expect((res.body as { code: string }).code).toBe('INVALID_INPUT');
    });

    it('forces source=local regardless of body', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(withProfile(admin))
        .send({ title: 'Test', start_datetime: NOW, end_datetime: NOW + HOUR, source: 'caldav' });
      expect(res.status).toBe(201);
      expect((res.body as { source: string }).source).toBe('local');
    });
  });

  // ---------------------------------------------------------------------------
  describe('PATCH /api/v1/calendar/events/:id', () => {
    it('updates a local event as admin → 200', async () => {
      const event = eventRepo.create({
        title: 'Old',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'local',
        type: 'default',
        all_day: false,
      });
      const res = await request(app)
        .patch(`/api/v1/calendar/events/${event.id}`)
        .set(withProfile(admin))
        .send({ title: 'New' });
      expect(res.status).toBe(200);
      expect((res.body as { title: string }).title).toBe('New');
    });

    it('denies PATCH of CalDAV event as non-admin → 403', async () => {
      const event = eventRepo.create({
        title: 'CalDAV',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'caldav',
        type: 'default',
        all_day: false,
        caldav_uid: 'uid1',
        account_id: null,
      });
      const res = await request(app)
        .patch(`/api/v1/calendar/events/${event.id}`)
        .set(withProfile(teen))
        .send({ title: 'Hacked' });
      expect(res.status).toBe(403);
    });

    it('allows PATCH of CalDAV event as admin with x-admin-pin → 200', async () => {
      const event = eventRepo.create({
        title: 'CalDAV',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'caldav',
        type: 'default',
        all_day: false,
        caldav_uid: 'uid1',
        account_id: null,
      });
      const res = await request(app)
        .patch(`/api/v1/calendar/events/${event.id}`)
        .set({ ...withProfile(admin), 'x-admin-pin': '1234' })
        .send({ title: 'Admin Override' });
      expect(res.status).toBe(200);
      expect((res.body as { title: string }).title).toBe('Admin Override');
    });

    it('returns 404 for missing event', async () => {
      const res = await request(app)
        .patch('/api/v1/calendar/events/9999')
        .set(withProfile(admin))
        .send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  describe('DELETE /api/v1/calendar/events/:id', () => {
    it('deletes a local event as admin → 204', async () => {
      const event = eventRepo.create({
        title: 'Delete me',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'local',
        type: 'default',
        all_day: false,
      });
      const res = await request(app)
        .delete(`/api/v1/calendar/events/${event.id}`)
        .set(withProfile(admin));
      expect(res.status).toBe(204);
    });

    it('denies DELETE of CalDAV event as non-admin → 403', async () => {
      const event = eventRepo.create({
        title: 'CalDAV',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'caldav',
        type: 'default',
        all_day: false,
        caldav_uid: 'uid2',
        account_id: null,
      });
      const res = await request(app)
        .delete(`/api/v1/calendar/events/${event.id}`)
        .set(withProfile(teen));
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent event', async () => {
      const res = await request(app).delete('/api/v1/calendar/events/9999').set(withProfile(admin));
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  describe('GET /api/v1/calendar/events', () => {
    it('returns events within range', async () => {
      eventRepo.create({
        title: 'In Range',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'local',
        type: 'default',
        all_day: false,
      });
      eventRepo.create({
        title: 'Out of Range',
        start_datetime: NOW + 10 * DAY,
        end_datetime: NOW + 10 * DAY + HOUR,
        source: 'local',
        type: 'default',
        all_day: false,
      });
      const res = await request(app)
        .get(`/api/v1/calendar/events?start=${NOW - HOUR}&end=${NOW + 2 * HOUR}`)
        .set(withProfile(admin));
      expect(res.status).toBe(200);
      const titles = (res.body as Array<{ title: string }>).map((e) => e.title);
      expect(titles).toContain('In Range');
      expect(titles).not.toContain('Out of Range');
    });

    it('filters by profileIds query param', async () => {
      const other = profileRepo.create({
        name: 'Other',
        type: 'grandparent',
        colour: '#AABBCC',
        text_size: 'default',
        simplified_nav: 0,
        permissions_json: defaultsFor('grandparent'),
      });
      eventRepo.create({
        title: 'My Event',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'local',
        type: 'default',
        all_day: false,
        profile_id: admin.id,
      });
      eventRepo.create({
        title: 'Their Event',
        start_datetime: NOW,
        end_datetime: NOW + HOUR,
        source: 'local',
        type: 'default',
        all_day: false,
        profile_id: other.id,
      });
      const res = await request(app)
        .get(
          `/api/v1/calendar/events?start=${NOW - HOUR}&end=${NOW + 2 * HOUR}&profileIds=${admin.id}`,
        )
        .set(withProfile(admin));
      expect(res.status).toBe(200);
      const titles = (res.body as Array<{ title: string }>).map((e) => e.title);
      expect(titles).toContain('My Event');
      expect(titles).not.toContain('Their Event');
    });

    it('returns 400 when start/end missing', async () => {
      const res = await request(app).get('/api/v1/calendar/events').set(withProfile(admin));
      expect(res.status).toBe(400);
    });
  });
});

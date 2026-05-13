import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import CalendarAccountRepository from '../../src/repositories/CalendarAccountRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import EventRepository from '../../src/repositories/EventRepository';
import { initCrypto } from '../../src/utils/crypto';
import CalendarService from '../../src/services/CalendarService';
import createBasicCalendarRouter from '../../src/routes/basicCalendar';
import {
  APPLE_CALDAV_URL,
  YAHOO_CALDAV_URL,
  testBasicAuthCalDAV,
} from '../../src/services/calendar/BasicAuthCalDAVProvider';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeApp(accountRepo: CalendarAccountRepository, calendarService: CalendarService) {
  const app = express();
  app.use(express.json());
  app.use(createBasicCalendarRouter(accountRepo, calendarService));
  app.use(errorHandler);
  return app;
}

jest.mock('../../src/services/calendar/BasicAuthCalDAVProvider', () => {
  const actual = jest.requireActual<
    typeof import('../../src/services/calendar/BasicAuthCalDAVProvider')
  >('../../src/services/calendar/BasicAuthCalDAVProvider');
  return {
    ...actual,
    testBasicAuthCalDAV: jest.fn(),
    fetchBasicAuthCalDAV: jest.fn().mockResolvedValue([]),
  };
});

const mockTestCalDAV = testBasicAuthCalDAV as jest.Mock;

describe('Basic CalDAV routes (Apple / Yahoo)', () => {
  let db: Database.Database;
  let accountRepo: CalendarAccountRepository;
  let calendarService: CalendarService;
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    db = makeDb();
    accountRepo = new CalendarAccountRepository(db);
    const eventRepo = new EventRepository(db);
    calendarService = new CalendarService(accountRepo, eventRepo);
    app = makeApp(accountRepo, calendarService);
    mockTestCalDAV.mockReset();
  });

  afterEach(() => {
    db.close();
  });

  // ---------------------------------------------------------------------------
  describe('POST /api/v1/calendar/accounts/basic/test', () => {
    it('returns { ok: true } when credentials valid for Apple', async () => {
      mockTestCalDAV.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/calendar/accounts/basic/test')
        .send({ provider: 'apple', username: 'user@icloud.com', password: 'xxxx-xxxx' });

      expect(res.status).toBe(200);
      expect((res.body as { ok: boolean }).ok).toBe(true);
      expect(mockTestCalDAV).toHaveBeenCalledWith(APPLE_CALDAV_URL, {
        username: 'user@icloud.com',
        password: 'xxxx-xxxx',
      });
    });

    it('returns { ok: false } when credentials invalid for Yahoo', async () => {
      mockTestCalDAV.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/v1/calendar/accounts/basic/test')
        .send({ provider: 'yahoo', username: 'user@yahoo.com', password: 'wrong' });

      expect(res.status).toBe(200);
      expect((res.body as { ok: boolean }).ok).toBe(false);
      expect(mockTestCalDAV).toHaveBeenCalledWith(YAHOO_CALDAV_URL, {
        username: 'user@yahoo.com',
        password: 'wrong',
      });
    });

    it('respects custom caldav_url override', async () => {
      mockTestCalDAV.mockResolvedValue(true);
      const customUrl = 'https://my-caldav.example.com';

      await request(app)
        .post('/api/v1/calendar/accounts/basic/test')
        .send({ provider: 'apple', username: 'u', password: 'p', caldav_url: customUrl });

      expect(mockTestCalDAV).toHaveBeenCalledWith(customUrl, { username: 'u', password: 'p' });
    });

    it('returns 400 on missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/accounts/basic/test')
        .send({ provider: 'apple' });

      expect(res.status).toBe(400);
      expect((res.body as { code: string }).code).toBe('INVALID_INPUT');
    });

    it('returns 400 on invalid provider', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/accounts/basic/test')
        .send({ provider: 'google', username: 'u', password: 'p' });

      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  describe('POST /api/v1/calendar/accounts/basic', () => {
    it('creates an Apple account with default URL → 201', async () => {
      jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).post('/api/v1/calendar/accounts/basic').send({
        provider: 'apple',
        username: 'user@icloud.com',
        password: 'app-specific-password',
      });

      expect(res.status).toBe(201);
      const body = res.body as { id: number; provider: string; caldav_url: string };
      expect(body.provider).toBe('apple');
      expect(body.caldav_url).toBe(APPLE_CALDAV_URL);
    });

    it('creates a Yahoo account with default URL → 201', async () => {
      jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).post('/api/v1/calendar/accounts/basic').send({
        provider: 'yahoo',
        username: 'user@yahoo.com',
        password: 'app-specific-password',
      });

      expect(res.status).toBe(201);
      const body = res.body as { provider: string; caldav_url: string };
      expect(body.provider).toBe('yahoo');
      expect(body.caldav_url).toBe(YAHOO_CALDAV_URL);
    });

    it('uses custom caldav_url when provided → 201', async () => {
      jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();
      const customUrl = 'https://custom.caldav.example.com';

      const res = await request(app).post('/api/v1/calendar/accounts/basic').send({
        provider: 'apple',
        username: 'u',
        password: 'p',
        caldav_url: customUrl,
      });

      expect(res.status).toBe(201);
      expect((res.body as { caldav_url: string }).caldav_url).toBe(customUrl);
    });

    it('stores credentials encrypted (not in plain response)', async () => {
      const syncSpy = jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).post('/api/v1/calendar/accounts/basic').send({
        provider: 'apple',
        username: 'user@icloud.com',
        password: 'secret-password',
      });

      expect(res.status).toBe(201);
      const body = res.body as Record<string, unknown>;
      expect(body.password).toBeUndefined();
      expect(body.credentials_encrypted).toBeUndefined();

      const { id } = body as { id: number };
      const storedCreds = accountRepo.getCredentials(id) as { username: string; password: string };
      expect(storedCreds.username).toBe('user@icloud.com');
      expect(storedCreds.password).toBe('secret-password');

      syncSpy.mockRestore();
    });

    it('generates default display_name from provider + username', async () => {
      jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).post('/api/v1/calendar/accounts/basic').send({
        provider: 'apple',
        username: 'me@icloud.com',
        password: 'pw',
      });

      expect((res.body as { display_name: string }).display_name).toBe('iCloud (me@icloud.com)');
    });

    it('triggers first sync after account creation', async () => {
      const syncSpy = jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).post('/api/v1/calendar/accounts/basic').send({
        provider: 'apple',
        username: 'u',
        password: 'p',
      });

      expect(res.status).toBe(201);
      const { id } = res.body as { id: number };
      await new Promise<void>((resolve) => {
        process.nextTick(resolve);
      });
      expect(syncSpy).toHaveBeenCalledWith(id);
      syncSpy.mockRestore();
    });

    it('returns 400 on missing password', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/accounts/basic')
        .send({ provider: 'apple', username: 'u' });

      expect(res.status).toBe(400);
    });
  });
});

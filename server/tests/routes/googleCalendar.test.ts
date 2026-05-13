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
import createGoogleCalendarRouter from '../../src/routes/googleCalendar';
import { clearAll } from '../../src/services/calendar/google/deviceCodeStore';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeApp(
  accountRepo: CalendarAccountRepository,
  settingsRepo: AppSettingsRepository,
  calendarService: CalendarService,
) {
  const app = express();
  app.use(express.json());
  app.use(createGoogleCalendarRouter(accountRepo, settingsRepo, calendarService));
  app.use(errorHandler);
  return app;
}

const MOCK_DEVICE_CODE = 'dev_code_abc123';
const MOCK_VERIFICATION_URL = 'https://accounts.google.com/device';
const MOCK_ACCESS_TOKEN = 'ya29.access_token';
const MOCK_REFRESH_TOKEN = 'refresh_token_xyz';
const MOCK_EMAIL = 'user@example.com';
const CLIENT_ID = 'test-client-id';
const CLIENT_SECRET = 'test-client-secret';

describe('Google Calendar OAuth routes', () => {
  let db: Database.Database;
  let accountRepo: CalendarAccountRepository;
  let settingsRepo: AppSettingsRepository;
  let eventRepo: EventRepository;
  let calendarService: CalendarService;
  let app: ReturnType<typeof makeApp>;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    db = makeDb();
    accountRepo = new CalendarAccountRepository(db);
    settingsRepo = new AppSettingsRepository(db);
    eventRepo = new EventRepository(db);
    calendarService = new CalendarService(accountRepo, eventRepo);

    settingsRepo.set('google_oauth_client_id', CLIENT_ID);
    settingsRepo.set('google_oauth_client_secret', CLIENT_SECRET);

    app = makeApp(accountRepo, settingsRepo, calendarService);

    fetchSpy = jest.spyOn(global, 'fetch');
    clearAll();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    db.close();
  });

  // ---------------------------------------------------------------------------
  describe('POST /api/v1/calendar/accounts/google/start', () => {
    it('returns deviceCode, verificationUrl, and qrPng on success', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            device_code: MOCK_DEVICE_CODE,
            user_code: 'ABCD-EFGH',
            verification_url: MOCK_VERIFICATION_URL,
            expires_in: 1800,
            interval: 5,
          }),
      } as Response);

      const res = await request(app).post('/api/v1/calendar/accounts/google/start');

      expect(res.status).toBe(200);
      const body = res.body as { deviceCode: string; verificationUrl: string; qrPng: string };
      expect(body.deviceCode).toBe(MOCK_DEVICE_CODE);
      expect(body.verificationUrl).toBe(MOCK_VERIFICATION_URL);
      expect(body.qrPng).toMatch(/^data:image\/png;base64,/);
    });

    it('returns 502 when Google device code endpoint fails', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('invalid_client'),
      } as Response);

      const res = await request(app).post('/api/v1/calendar/accounts/google/start');
      expect(res.status).toBe(502);
      expect((res.body as { error: string }).error).toBe('GOOGLE_AUTH_FAILED');
    });

    it('returns 500 when client ID is not configured', async () => {
      settingsRepo.delete('google_oauth_client_id');
      delete process.env.GOOGLE_OAUTH_CLIENT_ID;

      const res = await request(app).post('/api/v1/calendar/accounts/google/start');
      expect(res.status).toBe(500);
    });
  });

  // ---------------------------------------------------------------------------
  describe('GET /api/v1/calendar/accounts/google/poll/:deviceCode', () => {
    function seedPendingCode(deviceCode = MOCK_DEVICE_CODE) {
      // seed via the start route to put code in the store
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            device_code: deviceCode,
            user_code: 'ABCD-EFGH',
            verification_url: MOCK_VERIFICATION_URL,
            expires_in: 1800,
            interval: 5,
          }),
      } as Response);
      return request(app).post('/api/v1/calendar/accounts/google/start');
    }

    it('returns pending when authorization not yet granted', async () => {
      await seedPendingCode();

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'authorization_pending' }),
      } as Response);

      const res = await request(app).get(
        `/api/v1/calendar/accounts/google/poll/${MOCK_DEVICE_CODE}`,
      );
      expect(res.status).toBe(200);
      expect((res.body as { status: string }).status).toBe('pending');
    });

    it('returns pending with retryAfter on slow_down', async () => {
      await seedPendingCode();

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'slow_down' }),
      } as Response);

      const res = await request(app).get(
        `/api/v1/calendar/accounts/google/poll/${MOCK_DEVICE_CODE}`,
      );
      expect(res.status).toBe(200);
      const body = res.body as { status: string; retryAfter: number };
      expect(body.status).toBe('pending');
      expect(body.retryAfter).toBeGreaterThan(5);
    });

    it('returns 410 on access_denied', async () => {
      await seedPendingCode();

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'access_denied' }),
      } as Response);

      const res = await request(app).get(
        `/api/v1/calendar/accounts/google/poll/${MOCK_DEVICE_CODE}`,
      );
      expect(res.status).toBe(410);
      expect((res.body as { error: string }).error).toBe('ACCESS_DENIED');
    });

    it('returns 410 for unknown or expired device code', async () => {
      const res = await request(app).get(
        '/api/v1/calendar/accounts/google/poll/unknown_device_code',
      );
      expect(res.status).toBe(410);
      expect((res.body as { error: string }).error).toBe('DEVICE_CODE_EXPIRED');
    });

    it('creates account and returns authorized on success', async () => {
      await seedPendingCode();

      // Token response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: MOCK_ACCESS_TOKEN,
            refresh_token: MOCK_REFRESH_TOKEN,
            expires_in: 3600,
          }),
      } as Response);

      // Userinfo response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ email: MOCK_EMAIL }),
      } as Response);

      // Mock syncAccount (CalendarService will use LocalProvider via registry, no-op)
      const syncSpy = jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).get(
        `/api/v1/calendar/accounts/google/poll/${MOCK_DEVICE_CODE}`,
      );

      expect(res.status).toBe(200);
      const body = res.body as { status: string; accountId: number };
      expect(body.status).toBe('authorized');
      expect(typeof body.accountId).toBe('number');

      const account = accountRepo.get(body.accountId);
      expect(account).toBeDefined();
      expect(account!.provider).toBe('google');
      expect(account!.display_name).toBe(`Google (${MOCK_EMAIL})`);
      expect(account!.caldav_url).toBe(
        `https://apidata.googleusercontent.com/caldav/v2/${MOCK_EMAIL}/`,
      );

      const creds = accountRepo.getCredentials(body.accountId) as {
        access_token: string;
        refresh_token: string;
        email: string;
      };
      expect(creds.access_token).toBe(MOCK_ACCESS_TOKEN);
      expect(creds.refresh_token).toBe(MOCK_REFRESH_TOKEN);
      expect(creds.email).toBe(MOCK_EMAIL);

      expect(syncSpy).toHaveBeenCalledWith(body.accountId);
      syncSpy.mockRestore();
    });

    it('creates account without email when userinfo fails', async () => {
      await seedPendingCode();

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: MOCK_ACCESS_TOKEN,
              refresh_token: MOCK_REFRESH_TOKEN,
              expires_in: 3600,
            }),
        } as Response)
        .mockRejectedValueOnce(new Error('network error'));

      jest.spyOn(calendarService, 'syncAccount').mockResolvedValue();

      const res = await request(app).get(
        `/api/v1/calendar/accounts/google/poll/${MOCK_DEVICE_CODE}`,
      );

      expect(res.status).toBe(200);
      const body = res.body as { status: string; accountId: number };
      const account = accountRepo.get(body.accountId);
      expect(account!.display_name).toBe('Google Calendar');
    });
  });
});

import Database from 'better-sqlite3';
import express, { type RequestHandler } from 'express';
import request from 'supertest';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import VoiceCommandRepository from '../../src/repositories/VoiceCommandRepository';
import createAdminRouter from '../../src/routes/admin';

jest.mock('child_process', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execFile: jest.fn((...args: any[]) => (args[args.length - 1] as (e: null) => void)(null)),
}));
jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
const noopLimiter: RequestHandler = (_req, _res, next) => next();

function makeDb() {
  const db = new Database(':memory:');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(
  settingsRepo: AppSettingsRepository,
  profileRepo: ProfileRepository,
  voiceCmdRepo: VoiceCommandRepository,
) {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1/admin',
    createAdminRouter(settingsRepo, profileRepo, noopLimiter, undefined, voiceCmdRepo),
  );
  app.use(errorHandler);
  return app;
}

describe('GET /api/v1/admin/voice-commands', () => {
  let db: Database.Database;
  let settingsRepo: AppSettingsRepository;
  let profileRepo: ProfileRepository;
  let voiceCmdRepo: VoiceCommandRepository;

  beforeEach(() => {
    db = makeDb();
    settingsRepo = new AppSettingsRepository(db);
    profileRepo = new ProfileRepository(db);
    voiceCmdRepo = new VoiceCommandRepository(db);
  });

  afterEach(() => db.close());

  it('returns empty array when no commands', async () => {
    const app = makeApp(settingsRepo, profileRepo, voiceCmdRepo);
    const res = await request(app).get('/api/v1/admin/voice-commands');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns inserted commands', async () => {
    voiceCmdRepo.insert({ transcript: 'go to calendar', matched_handler: 'nav:goto:calendar' });
    voiceCmdRepo.insert({ transcript: 'what time is it', matched_handler: 'builtin:time', response: '10:30' });

    const app = makeApp(settingsRepo, profileRepo, voiceCmdRepo);
    const res = await request(app).get('/api/v1/admin/voice-commands');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const transcripts = (res.body as { transcript: string }[]).map((r) => r.transcript);
    expect(transcripts).toContain('go to calendar');
    expect(transcripts).toContain('what time is it');
  });

  it('respects limit query param', async () => {
    [0, 1, 2, 3, 4].forEach((i) => {
      voiceCmdRepo.insert({ transcript: `command ${i}` });
    });
    const app = makeApp(settingsRepo, profileRepo, voiceCmdRepo);
    const res = await request(app).get('/api/v1/admin/voice-commands?limit=3');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });
});

describe('DELETE /api/v1/admin/voice-commands', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
  });

  afterEach(() => db.close());

  it('clears all commands and returns 204', async () => {
    const settingsRepo = new AppSettingsRepository(db);
    const profileRepo = new ProfileRepository(db);
    const voiceCmdRepo = new VoiceCommandRepository(db);
    voiceCmdRepo.insert({ transcript: 'test' });

    const app = makeApp(settingsRepo, profileRepo, voiceCmdRepo);
    const res = await request(app).delete('/api/v1/admin/voice-commands');
    expect(res.status).toBe(204);
    expect(voiceCmdRepo.list()).toHaveLength(0);
  });
});

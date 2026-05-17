import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import VoiceCommandRepository from '../../src/repositories/VoiceCommandRepository';
import createInternalVoiceRouter from '../../src/routes/internalVoice';
import eventBus from '../../src/core/eventBus';

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

// Prevent real TTS calls from voice process during tests
global.fetch = jest.fn(() => Promise.resolve(new Response(null, { status: 204 }))) as jest.Mock;

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb() {
  const db = new Database(':memory:');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(settingsRepo: AppSettingsRepository, voiceCmdRepo: VoiceCommandRepository) {
  const app = express();
  app.use(express.json());
  app.use('/internal/voice', createInternalVoiceRouter(settingsRepo, voiceCmdRepo));
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  eventBus.removeAllListeners();
  jest.clearAllMocks();
});

afterEach(() => {
  eventBus.removeAllListeners();
});

describe('POST /internal/voice/command', () => {
  let db: Database.Database;
  let settingsRepo: AppSettingsRepository;
  let voiceCmdRepo: VoiceCommandRepository;

  beforeEach(() => {
    db = makeDb();
    settingsRepo = new AppSettingsRepository(db);
    voiceCmdRepo = new VoiceCommandRepository(db);
  });

  afterEach(() => db.close());

  it('accepts valid transcript and returns 204', async () => {
    const app = makeApp(settingsRepo, voiceCmdRepo);
    const res = await request(app)
      .post('/internal/voice/command')
      .send({ transcript: 'go to calendar' });
    expect(res.status).toBe(204);
  });

  it('rejects missing transcript with 400', async () => {
    const app = makeApp(settingsRepo, voiceCmdRepo);
    const res = await request(app).post('/internal/voice/command').send({});
    expect(res.status).toBe(400);
  });

  it('logs command to voice_command_log', async () => {
    const app = makeApp(settingsRepo, voiceCmdRepo);
    await request(app).post('/internal/voice/command').send({ transcript: 'go to food' });
    const cmds = voiceCmdRepo.list();
    expect(cmds).toHaveLength(1);
    expect(cmds[0].transcript).toBe('go to food');
    expect(cmds[0].matched_handler).toBe('nav:goto:food');
  });

  it('emits voice:command event on event bus', async () => {
    const events: unknown[] = [];
    eventBus.on('voice:command', (p) => events.push(p));
    const app = makeApp(settingsRepo, voiceCmdRepo);
    await request(app).post('/internal/voice/command').send({ transcript: 'go home' });
    expect(events).toHaveLength(1);
    expect((events[0] as { transcript: string }).transcript).toBe('go home');
  });

  it('returns 401 when token is set and not provided', async () => {
    settingsRepo.set('voice_internal_token', 'secret-token');
    const app = makeApp(settingsRepo, voiceCmdRepo);
    const res = await request(app)
      .post('/internal/voice/command')
      .send({ transcript: 'test' });
    expect(res.status).toBe(401);
  });

  it('accepts request when correct Bearer token is provided', async () => {
    settingsRepo.set('voice_internal_token', 'secret-token');
    const app = makeApp(settingsRepo, voiceCmdRepo);
    const res = await request(app)
      .post('/internal/voice/command')
      .set('Authorization', 'Bearer secret-token')
      .send({ transcript: 'go to house' });
    expect(res.status).toBe(204);
  });
});

describe('POST /internal/voice/status', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
  });

  afterEach(() => db.close());

  it('broadcasts voice:status event', async () => {
    const settingsRepo = new AppSettingsRepository(db);
    const voiceCmdRepo = new VoiceCommandRepository(db);
    const app = makeApp(settingsRepo, voiceCmdRepo);

    const received: unknown[] = [];
    eventBus.on('voice:status', (p) => received.push(p));

    const res = await request(app)
      .post('/internal/voice/status')
      .send({ status: 'listening' });

    expect(res.status).toBe(204);
    expect(received).toHaveLength(1);
    expect((received[0] as { status: string }).status).toBe('listening');
  });

  it('rejects invalid status with 400', async () => {
    const settingsRepo = new AppSettingsRepository(db);
    const voiceCmdRepo = new VoiceCommandRepository(db);
    const app = makeApp(settingsRepo, voiceCmdRepo);
    const res = await request(app)
      .post('/internal/voice/status')
      .send({ status: 'unknown' });
    expect(res.status).toBe(400);
  });
});

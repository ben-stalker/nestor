import express from 'express';
import request from 'supertest';
import errorHandler from '../../src/middleware/errorHandler';
import createJourneysRouter from '../../src/routes/journeys';
import type JourneyRepository from '../../src/repositories/JourneyRepository';
import type { Journey } from '../../src/repositories/JourneyRepository';
import type { TransportAdapter } from '../../src/services/TransportAdapter';

const MOCK_JOURNEY: Journey = {
  id: 1,
  profile_id: 1,
  label: 'To Work',
  origin: 'Home',
  destination: 'Office',
  transport_mode: 'transit',
  days_active: 62,
  provider_id: null,
  created_at: 1_700_000_000_000,
  updated_at: 1_700_000_000_000,
};

const MOCK_ADAPTER: TransportAdapter = {
  providerId: 'test',
  getEta: jest.fn().mockResolvedValue({
    journeyId: 1,
    label: 'To Work',
    origin: 'Home',
    destination: 'Office',
    transportMode: 'transit',
    etaMinutes: 30,
    updatedAt: Date.now(),
  }),
};

function makeApp(repo: Partial<JourneyRepository>) {
  const app = express();
  app.use(express.json());
  app.use(createJourneysRouter(repo as JourneyRepository, MOCK_ADAPTER));
  app.use(errorHandler);
  return app;
}

describe('GET /api/v1/journeys', () => {
  it('returns journeys for profile', async () => {
    const repo = { listForProfile: jest.fn().mockReturnValue([MOCK_JOURNEY]) };
    const res = await request(makeApp(repo)).get('/api/v1/journeys?profile_id=1');
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBe(1);
  });

  it('returns 400 when profile_id missing', async () => {
    const repo = { listForProfile: jest.fn() };
    const res = await request(makeApp(repo)).get('/api/v1/journeys');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/journeys/eta', () => {
  it('returns ETAs for active journeys', async () => {
    const repo = { listActiveToday: jest.fn().mockReturnValue([MOCK_JOURNEY]) };
    const res = await request(makeApp(repo)).get('/api/v1/journeys/eta?profile_id=1');
    expect(res.status).toBe(200);
    expect((res.body as Array<{ etaMinutes: number }>)[0].etaMinutes).toBe(30);
  });

  it('returns 400 when profile_id missing', async () => {
    const repo = { listActiveToday: jest.fn() };
    const res = await request(makeApp(repo)).get('/api/v1/journeys/eta');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/journeys', () => {
  it('creates a journey', async () => {
    const repo = { create: jest.fn().mockReturnValue({ ...MOCK_JOURNEY, id: 2 }) };
    const res = await request(makeApp(repo))
      .post('/api/v1/journeys')
      .send({ profile_id: 1, label: 'To Work', origin: 'Home', destination: 'Office' });

    expect(res.status).toBe(201);
    expect((res.body as { label: string }).label).toBe('To Work');
  });

  it('returns 400 for invalid body', async () => {
    const repo = { create: jest.fn() };
    const res = await request(makeApp(repo)).post('/api/v1/journeys').send({ label: '' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/journeys/:id', () => {
  it('updates a journey', async () => {
    const updated = { ...MOCK_JOURNEY, label: 'Updated' };
    const repo = {
      get: jest.fn().mockReturnValue(MOCK_JOURNEY),
      update: jest.fn().mockReturnValue(updated),
    };
    const res = await request(makeApp(repo)).patch('/api/v1/journeys/1').send({ label: 'Updated' });

    expect(res.status).toBe(200);
    expect((res.body as { label: string }).label).toBe('Updated');
  });

  it('returns 404 when journey not found', async () => {
    const repo = { get: jest.fn().mockReturnValue(undefined), update: jest.fn() };
    const res = await request(makeApp(repo)).patch('/api/v1/journeys/999').send({ label: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/journeys/:id', () => {
  it('deletes a journey', async () => {
    const repo = { delete: jest.fn().mockReturnValue(true) };
    const res = await request(makeApp(repo)).delete('/api/v1/journeys/1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    const repo = { delete: jest.fn().mockReturnValue(false) };
    const res = await request(makeApp(repo)).delete('/api/v1/journeys/999');
    expect(res.status).toBe(404);
  });
});

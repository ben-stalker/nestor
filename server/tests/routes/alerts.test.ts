import express from 'express';
import request from 'supertest';
import errorHandler from '../../src/middleware/errorHandler';
import createAlertsRouter from '../../src/routes/alerts';
import type AlertRepository from '../../src/repositories/AlertRepository';
import type { Alert } from '../../src/repositories/AlertRepository';

function makeApp(alertRepo: Partial<AlertRepository>) {
  const app = express();
  app.use(express.json());
  app.use(createAlertsRouter(alertRepo as AlertRepository));
  app.use(errorHandler);
  return app;
}

const MOCK_ALERT: Alert = {
  id: 1,
  type: 'weather_down',
  severity: 'warning',
  message: 'Weather data unavailable',
  deep_link: null,
  profile_id: null,
  dismissed: false,
  dismissed_at: null,
  created_at: 1_700_000_000_000,
};

describe('GET /api/v1/alerts', () => {
  it('returns list of active alerts', async () => {
    const repo = { listActive: jest.fn().mockReturnValue([MOCK_ALERT]) };
    const res = await request(makeApp(repo)).get('/api/v1/alerts');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as Array<{ type: string }>)[0].type).toBe('weather_down');
  });

  it('returns empty array when no alerts', async () => {
    const repo = { listActive: jest.fn().mockReturnValue([]) };
    const res = await request(makeApp(repo)).get('/api/v1/alerts');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/v1/alerts/:id/dismiss', () => {
  it('returns 204 on successful dismiss', async () => {
    const repo = {
      get: jest.fn().mockReturnValue(MOCK_ALERT),
      dismiss: jest.fn().mockReturnValue(true),
    };
    const res = await request(makeApp(repo)).post('/api/v1/alerts/1/dismiss');

    expect(res.status).toBe(204);
    expect(repo.dismiss).toHaveBeenCalledWith(1);
  });

  it('returns 404 when alert not found', async () => {
    const repo = {
      get: jest.fn().mockReturnValue(undefined),
      dismiss: jest.fn(),
    };
    const res = await request(makeApp(repo)).post('/api/v1/alerts/999/dismiss');

    expect(res.status).toBe(404);
    expect((res.body as { error: string }).error).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid id', async () => {
    const repo = { get: jest.fn(), dismiss: jest.fn() };
    const res = await request(makeApp(repo)).post('/api/v1/alerts/abc/dismiss');

    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('INVALID_ID');
  });
});

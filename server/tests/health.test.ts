import express from 'express';
import request from 'supertest';
import createApp from '../src/app';
import { closeDb } from '../src/db/connection';
import errorHandler from '../src/middleware/errorHandler';

interface HealthBody {
  status: string;
  db: string;
  uptime: number;
  version: string;
}

interface ErrorBody {
  error: string;
  code: string;
  details?: object;
}

const app = createApp();

afterAll(() => {
  closeDb();
});

describe('GET /health', () => {
  it('returns 200 with expected shape', async () => {
    const res = await request(app).get('/health');
    const body = res.body as HealthBody;

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toMatch(/^(ok|fail)$/);
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.version).toBe('string');
  });

  it('returns db: ok when database is reachable', async () => {
    const res = await request(app).get('/health');
    const body = res.body as HealthBody;
    expect(body.db).toBe('ok');
  });

  it('sets X-Request-Id header on every response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });
});

describe('Error middleware', () => {
  it('returns documented JSON shape for thrown errors', async () => {
    const testApp = express();

    testApp.get('/boom', () => {
      const err = Object.assign(new Error('something broke'), {
        status: 422,
        code: 'VALIDATION_ERROR',
        details: { field: 'name' },
      });
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/boom');
    const body = res.body as ErrorBody;
    expect(res.status).toBe(422);
    expect(body.error).toBe('something broke');
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toEqual({ field: 'name' });
  });
});

import express from 'express';
import request from 'supertest';
import errorHandler from '../../src/middleware/errorHandler';
import createHomeRouter from '../../src/routes/home';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(createHomeRouter());
  app.use(errorHandler);
  return app;
}

interface DaySummaryBody {
  date: string;
  events: unknown[];
  wfhStatuses: unknown[];
  nurseryDrops: unknown[];
  schoolPickups: unknown[];
  vehicleBookings: unknown[];
  vetAppointments: unknown[];
  binCollections: unknown[];
}

interface ErrorBody {
  error: string;
}

describe('GET /api/v1/home/day-summary', () => {
  it('returns 400 when date is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/home/day-summary');
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toBe('INVALID_DATE');
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(makeApp()).get('/api/v1/home/day-summary?date=12-05-2026');
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toBe('INVALID_DATE');
  });

  it('returns 200 with empty summary for a valid date', async () => {
    const res = await request(makeApp()).get('/api/v1/home/day-summary?date=2026-05-12');
    expect(res.status).toBe(200);
    const body = res.body as DaySummaryBody;
    expect(body.date).toBe('2026-05-12');
    expect(body.events).toEqual([]);
    expect(body.wfhStatuses).toEqual([]);
    expect(body.nurseryDrops).toEqual([]);
    expect(body.schoolPickups).toEqual([]);
    expect(body.vehicleBookings).toEqual([]);
    expect(body.vetAppointments).toEqual([]);
    expect(body.binCollections).toEqual([]);
  });

  it('returns the requested date in the response', async () => {
    const res = await request(makeApp()).get('/api/v1/home/day-summary?date=2026-12-25');
    expect(res.status).toBe(200);
    expect((res.body as DaySummaryBody).date).toBe('2026-12-25');
  });
});

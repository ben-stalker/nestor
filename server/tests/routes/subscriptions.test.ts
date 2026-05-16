import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import SubscriptionRepository from '../../src/repositories/SubscriptionRepository';
import createSubscriptionsRouter from '../../src/routes/subscriptions';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpPin: RequestHandler = (_req, _res, next) => next();

function makeApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  const subRepo = new SubscriptionRepository(db);
  app.use(createSubscriptionsRouter(subRepo, noOpPin));
  app.use(errorHandler);
  return { app, subRepo };
}

const subInput = {
  name: 'Netflix',
  category: 'streaming' as const,
  monthly_cost: 1499,
  renewal_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
  alert_days_before: 7,
};

describe('GET /api/v1/subscriptions', () => {
  it('returns empty list with zero total', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/subscriptions');
    expect(res.status).toBe(200);
    const body = res.body as { subscriptions: unknown[]; totalMonthlyCost: number };
    expect(body.subscriptions).toHaveLength(0);
    expect(body.totalMonthlyCost).toBe(0);
    db.close();
  });

  it('returns subscriptions with running total', async () => {
    const db = makeDb();
    const { app, subRepo } = makeApp(db);
    subRepo.create(subInput);
    subRepo.create({ ...subInput, name: 'Disney+', monthly_cost: 799 });
    const res = await request(app).get('/api/v1/subscriptions');
    expect(res.status).toBe(200);
    const body = res.body as { subscriptions: unknown[]; totalMonthlyCost: number };
    expect(body.subscriptions).toHaveLength(2);
    expect(body.totalMonthlyCost).toBe(2298);
    db.close();
  });
});

describe('POST /api/v1/subscriptions', () => {
  it('creates a subscription', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/subscriptions').send(subInput);
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('Netflix');
    db.close();
  });

  it('returns 400 on invalid input', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/subscriptions').send({ name: '' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/subscriptions/:id', () => {
  it('updates a subscription', async () => {
    const db = makeDb();
    const { app, subRepo } = makeApp(db);
    const sub = subRepo.create(subInput);
    const res = await request(app)
      .patch(`/api/v1/subscriptions/${sub.id}`)
      .send({ monthly_cost: 1299 });
    expect(res.status).toBe(200);
    expect((res.body as { monthly_cost: number }).monthly_cost).toBe(1299);
    db.close();
  });
});

describe('DELETE /api/v1/subscriptions/:id', () => {
  it('soft-deletes a subscription', async () => {
    const db = makeDb();
    const { app, subRepo } = makeApp(db);
    const sub = subRepo.create(subInput);
    const res = await request(app).delete(`/api/v1/subscriptions/${sub.id}`);
    expect(res.status).toBe(204);
    expect(subRepo.list()).toHaveLength(0);
    db.close();
  });

  it('returns 404 for missing subscription', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).delete('/api/v1/subscriptions/9999');
    expect(res.status).toBe(404);
    db.close();
  });
});

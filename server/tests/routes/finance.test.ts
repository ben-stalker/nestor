import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import FinanceRepository from '../../src/repositories/FinanceRepository';
import SubscriptionRepository from '../../src/repositories/SubscriptionRepository';
import createFinanceRouter from '../../src/routes/finance';

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
  const financeRepo = new FinanceRepository(db);
  const subRepo = new SubscriptionRepository(db);
  app.use(createFinanceRouter(financeRepo, subRepo, noOpPin));
  app.use(errorHandler);
  return { app, financeRepo, subRepo };
}

const START = new Date('2024-01-01').getTime();

// ─── Agreements ───────────────────────────────────────────────────────────────

describe('GET /api/v1/finance/agreements', () => {
  it('returns empty list', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/finance/agreements');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });
});

describe('POST /api/v1/finance/agreements', () => {
  it('creates a mortgage', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/finance/agreements').send({
      name: 'Home Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 120000,
      start_date: START,
      alert_months_before: 6,
      currency: 'GBP',
    });
    expect(res.status).toBe(201);
    const body = res.body as { name: string; type: string; active: boolean };
    expect(body.name).toBe('Home Mortgage');
    expect(body.type).toBe('mortgage');
    expect(body.active).toBe(true);
    db.close();
  });

  it('creates PCP with balloon payment', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/finance/agreements').send({
      name: 'Car PCP',
      type: 'pcp',
      monthly_payment_minor: 30000,
      start_date: START,
      balloon_payment_minor: 800000,
      alert_months_before: 3,
      currency: 'GBP',
    });
    expect(res.status).toBe(201);
    expect((res.body as { balloon_payment_minor: number }).balloon_payment_minor).toBe(800000);
    db.close();
  });

  it('rejects invalid type', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/finance/agreements').send({
      name: 'Bad',
      type: 'unknown',
      monthly_payment_minor: 1000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    expect(res.status).toBe(400);
    db.close();
  });

  it('rejects missing required fields', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/finance/agreements').send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/finance/agreements/:id', () => {
  it('updates an agreement', async () => {
    const db = makeDb();
    const { app, financeRepo } = makeApp(db);
    const created = financeRepo.createAgreement({
      name: 'Old',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    const res = await request(app)
      .patch(`/api/v1/finance/agreements/${created.id}`)
      .send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('Updated');
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).patch('/api/v1/finance/agreements/9999').send({ name: 'X' });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/finance/agreements/:id', () => {
  it('deletes an agreement', async () => {
    const db = makeDb();
    const { app, financeRepo } = makeApp(db);
    const created = financeRepo.createAgreement({
      name: 'To Delete',
      type: 'bnpl',
      monthly_payment_minor: 500,
      start_date: START,
      alert_months_before: 1,
      currency: 'GBP',
    });
    const res = await request(app).delete(`/api/v1/finance/agreements/${created.id}`);
    expect(res.status).toBe(204);
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).delete('/api/v1/finance/agreements/9999');
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('GET /api/v1/finance/agreements/:id', () => {
  it('returns the agreement', async () => {
    const db = makeDb();
    const { app, financeRepo } = makeApp(db);
    const created = financeRepo.createAgreement({
      name: 'Specific',
      type: 'insurance',
      monthly_payment_minor: 2000,
      start_date: START,
      alert_months_before: 4,
      currency: 'GBP',
    });
    const res = await request(app).get(`/api/v1/finance/agreements/${created.id}`);
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('Specific');
    db.close();
  });

  it('returns 404 for unknown', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/finance/agreements/9999');
    expect(res.status).toBe(404);
    db.close();
  });
});

// ─── Savings Goals ────────────────────────────────────────────────────────────

describe('GET /api/v1/finance/savings', () => {
  it('returns empty list', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/finance/savings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });
});

describe('POST /api/v1/finance/savings', () => {
  it('creates a goal', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/finance/savings').send({
      name: 'Holiday',
      target_amount_minor: 300000,
      currency: 'GBP',
    });
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('Holiday');
    db.close();
  });

  it('rejects missing target_amount_minor', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/finance/savings').send({ name: 'Bad' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('PATCH /api/v1/finance/savings/:id', () => {
  it('updates current_amount', async () => {
    const db = makeDb();
    const { app, financeRepo } = makeApp(db);
    const goal = financeRepo.createSavingsGoal({
      name: 'Car',
      target_amount_minor: 500000,
      current_amount_minor: 0,
      currency: 'GBP',
    });
    const res = await request(app)
      .patch(`/api/v1/finance/savings/${goal.id}`)
      .send({ current_amount_minor: 100000 });
    expect(res.status).toBe(200);
    expect((res.body as { current_amount_minor: number }).current_amount_minor).toBe(100000);
    db.close();
  });

  it('returns 404 for unknown', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    expect(
      (await request(app).patch('/api/v1/finance/savings/9999').send({ name: 'X' })).status,
    ).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/finance/savings/:id', () => {
  it('deletes a goal', async () => {
    const db = makeDb();
    const { app, financeRepo } = makeApp(db);
    const goal = financeRepo.createSavingsGoal({
      name: 'Delete',
      target_amount_minor: 1000,
      current_amount_minor: 0,
      currency: 'GBP',
    });
    expect((await request(app).delete(`/api/v1/finance/savings/${goal.id}`)).status).toBe(204);
    db.close();
  });
});

// ─── Summary ─────────────────────────────────────────────────────────────────

describe('GET /api/v1/finance/summary', () => {
  it('returns empty summary', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/finance/summary');
    expect(res.status).toBe(200);
    const body = res.body as { categories: unknown[]; grand_total_minor: number };
    expect(body.categories).toEqual([]);
    expect(body.grand_total_minor).toBe(0);
    db.close();
  });

  it('aggregates agreements and subscriptions', async () => {
    const db = makeDb();
    const { app, financeRepo, subRepo } = makeApp(db);
    financeRepo.createAgreement({
      name: 'Mortgage',
      type: 'mortgage',
      monthly_payment_minor: 100000,
      start_date: START,
      alert_months_before: 6,
      currency: 'GBP',
    });
    subRepo.create({
      name: 'Netflix',
      category: 'streaming',
      monthly_cost: 1799,
      renewal_date: Date.now() + 30 * 86400000,
      alert_days_before: 7,
    });
    const res = await request(app).get('/api/v1/finance/summary');
    expect(res.status).toBe(200);
    const body = res.body as {
      categories: Array<{ label: string; monthly_total_minor: number }>;
      grand_total_minor: number;
    };
    expect(body.grand_total_minor).toBe(101799);
    const mortgageCat = body.categories.find((c) => c.label === 'Mortgage');
    expect(mortgageCat?.monthly_total_minor).toBe(100000);
    const subCat = body.categories.find((c) => c.label === 'Subscriptions');
    expect(subCat?.monthly_total_minor).toBe(1799);
    db.close();
  });

  it('excludes inactive agreements from summary', async () => {
    const db = makeDb();
    const { app, financeRepo } = makeApp(db);
    const a = financeRepo.createAgreement({
      name: 'Inactive Loan',
      type: 'loan',
      monthly_payment_minor: 5000,
      start_date: START,
      alert_months_before: 3,
      currency: 'GBP',
    });
    financeRepo.updateAgreement(a.id, { active: false });
    const res = await request(app).get('/api/v1/finance/summary');
    expect((res.body as { grand_total_minor: number }).grand_total_minor).toBe(0);
    db.close();
  });
});

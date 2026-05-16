import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import BudgetRepository from '../../src/repositories/BudgetRepository';
import createBudgetRouter from '../../src/routes/budget';

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
  const repo = new BudgetRepository(db);
  app.use(createBudgetRouter(repo, noOpPin));
  app.use(errorHandler);
  return { app, repo };
}

describe('GET /api/v1/budget/categories', () => {
  it('returns empty list', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/budget/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });
});

describe('POST /api/v1/budget/categories', () => {
  it('creates a category', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/budget/categories')
      .send({ name: 'Groceries', monthly_budget_minor: 30000 });
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('Groceries');
    db.close();
  });
});

describe('PATCH /api/v1/budget/categories/:id', () => {
  it('updates a category', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cat = repo.createCategory({ name: 'Old', monthly_budget_minor: 1000 });
    const res = await request(app)
      .patch(`/api/v1/budget/categories/${cat.id}`)
      .send({ name: 'New' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('New');
    db.close();
  });
});

describe('DELETE /api/v1/budget/categories/:id', () => {
  it('deletes a category', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cat = repo.createCategory({ name: 'Temp', monthly_budget_minor: 0 });
    const res = await request(app).delete(`/api/v1/budget/categories/${cat.id}`);
    expect(res.status).toBe(204);
    db.close();
  });
});

describe('POST /api/v1/budget/expenses', () => {
  it('creates an expense', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cat = repo.createCategory({ name: 'Food', monthly_budget_minor: 20000 });
    const res = await request(app)
      .post('/api/v1/budget/expenses')
      .send({ category_id: cat.id, amount_minor: 1500, spent_date: Date.now() });
    expect(res.status).toBe(201);
    expect((res.body as { amount_minor: number }).amount_minor).toBe(1500);
    db.close();
  });
});

describe('GET /api/v1/budget/expenses', () => {
  it('returns expenses filtered by category', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cat1 = repo.createCategory({ name: 'Cat1', monthly_budget_minor: 1000 });
    const cat2 = repo.createCategory({ name: 'Cat2', monthly_budget_minor: 1000 });
    repo.createExpense({ category_id: cat1.id, amount_minor: 500, spent_date: Date.now() });
    repo.createExpense({ category_id: cat2.id, amount_minor: 300, spent_date: Date.now() });
    const res = await request(app).get(`/api/v1/budget/expenses?categoryId=${cat1.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    db.close();
  });
});

describe('DELETE /api/v1/budget/expenses/:id', () => {
  it('deletes an expense', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cat = repo.createCategory({ name: 'Cat', monthly_budget_minor: 0 });
    const exp = repo.createExpense({
      category_id: cat.id,
      amount_minor: 200,
      spent_date: Date.now(),
    });
    const res = await request(app).delete(`/api/v1/budget/expenses/${exp.id}`);
    expect(res.status).toBe(204);
    db.close();
  });
});

describe('GET /api/v1/budget/summary', () => {
  it('returns monthly summary with spent totals', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cat = repo.createCategory({ name: 'Shopping', monthly_budget_minor: 10000 });
    repo.createExpense({
      category_id: cat.id,
      amount_minor: 2000,
      spent_date: new Date(2026, 4, 10).getTime(),
    });
    const res = await request(app).get('/api/v1/budget/summary?year=2026&month=5');
    expect(res.status).toBe(200);
    const body = res.body as Array<{ spent_minor: number }>;
    expect(body[0].spent_minor).toBe(2000);
    db.close();
  });

  it('defaults to current month when no year/month provided', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/budget/summary');
    expect(res.status).toBe(200);
    db.close();
  });
});

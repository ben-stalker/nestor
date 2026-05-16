import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import ChecklistRepository from '../../src/repositories/ChecklistRepository';
import createChecklistsRouter from '../../src/routes/checklists';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  const repo = new ChecklistRepository(db);
  app.use(createChecklistsRouter(repo));
  app.use(errorHandler);
  return { app, repo };
}

describe('GET /api/v1/checklists', () => {
  it('returns empty list', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/checklists');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    db.close();
  });
});

describe('POST /api/v1/checklists', () => {
  it('creates a checklist', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/checklists')
      .send({ name: 'Morning', type: 'daily_reset' });
    expect(res.status).toBe(201);
    expect((res.body as { name: string }).name).toBe('Morning');
    db.close();
  });

  it('returns 400 on invalid type', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/checklists')
      .send({ name: 'Bad', type: 'invalid_type' });
    expect(res.status).toBe(400);
    db.close();
  });
});

describe('GET /api/v1/checklists/:id', () => {
  it('returns checklist with items', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'Trip', type: 'trip' });
    repo.createItem(cl.id, { text: 'Pack bag', sort_order: 0 });
    const res = await request(app).get(`/api/v1/checklists/${cl.id}`);
    expect(res.status).toBe(200);
    expect((res.body as { items: unknown[] }).items).toHaveLength(1);
    db.close();
  });

  it('returns 404 for missing checklist', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/checklists/9999');
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('PATCH /api/v1/checklists/:id', () => {
  it('updates checklist name', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'Old', type: 'one_off' });
    const res = await request(app).patch(`/api/v1/checklists/${cl.id}`).send({ name: 'New' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('New');
    db.close();
  });
});

describe('DELETE /api/v1/checklists/:id', () => {
  it('deletes a checklist', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'Del', type: 'one_off' });
    const res = await request(app).delete(`/api/v1/checklists/${cl.id}`);
    expect(res.status).toBe(204);
    db.close();
  });
});

describe('POST /api/v1/checklists/:id/items', () => {
  it('adds an item to a checklist', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'List', type: 'one_off' });
    const res = await request(app)
      .post(`/api/v1/checklists/${cl.id}/items`)
      .send({ text: 'Do laundry', sort_order: 0 });
    expect(res.status).toBe(201);
    expect((res.body as { text: string }).text).toBe('Do laundry');
    db.close();
  });

  it('returns 404 for non-existent checklist', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/checklists/9999/items')
      .send({ text: 'Task', sort_order: 0 });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('PATCH /api/v1/checklists/:id/items/:itemId', () => {
  it('ticks an item', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'Test', type: 'daily_reset' });
    const item = repo.createItem(cl.id, { text: 'Task', sort_order: 0 });
    const res = await request(app)
      .patch(`/api/v1/checklists/${cl.id}/items/${item.id}`)
      .send({ ticked: true });
    expect(res.status).toBe(200);
    expect((res.body as { ticked: boolean }).ticked).toBe(true);
    db.close();
  });
});

describe('DELETE /api/v1/checklists/:id/items/:itemId', () => {
  it('deletes an item', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'Test', type: 'one_off' });
    const item = repo.createItem(cl.id, { text: 'Task', sort_order: 0 });
    const res = await request(app).delete(`/api/v1/checklists/${cl.id}/items/${item.id}`);
    expect(res.status).toBe(204);
    db.close();
  });
});

describe('POST /api/v1/checklists/:id/reset', () => {
  it('resets all items to unticked', async () => {
    const db = makeDb();
    const { app, repo } = makeApp(db);
    const cl = repo.create({ name: 'Morning', type: 'daily_reset' });
    const item = repo.createItem(cl.id, { text: 'Brush teeth', sort_order: 0 });
    repo.tickItem(item.id, true);
    const res = await request(app).post(`/api/v1/checklists/${cl.id}/reset`);
    expect(res.status).toBe(200);
    const body = res.body as { items: Array<{ ticked: boolean }> };
    expect(body.items[0].ticked).toBe(false);
    db.close();
  });
});

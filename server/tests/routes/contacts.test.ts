import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import ContactRepository from '../../src/repositories/ContactRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import createContactsRouter from '../../src/routes/contacts';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const noOpPin: RequestHandler = (_req, _res, next) => next();
const blockPin: RequestHandler = (_req, res) => res.status(401).json({ error: 'UNAUTHORIZED' });

function makeApp(
  db: Database.Database,
  profileType: 'admin' | 'teen' | 'child' = 'admin',
  pinMiddleware: RequestHandler = noOpPin,
) {
  const app = express();
  app.use(express.json());
  const contactRepo = new ContactRepository(db);
  const profileRepo = new ProfileRepository(db);

  const profile = profileRepo.create({
    name: 'Test',
    type: profileType,
    colour: '#ff0000',
  });

  app.use((req, _res, next) => {
    req.headers['x-profile-id'] = String(profile.id);
    next();
  });

  app.use(createContactsRouter(contactRepo, pinMiddleware, profileRepo));
  app.use(errorHandler);
  return { app, contactRepo, profile };
}

describe('GET /api/v1/contacts', () => {
  it('returns all contacts for admin', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db);
    contactRepo.create({ name: 'Dr. Smith', category: 'medical' });
    contactRepo.create({ name: 'Police', category: 'emergency' });
    const res = await request(app).get('/api/v1/contacts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    db.close();
  });

  it('filters by category', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db);
    contactRepo.create({ name: 'Dr. Smith', category: 'medical' });
    contactRepo.create({ name: 'Police', category: 'emergency' });
    const res = await request(app).get('/api/v1/contacts?category=medical');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect((res.body as Array<{ name: string }>)[0].name).toBe('Dr. Smith');
    db.close();
  });

  it('returns 400 for invalid category', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/contacts?category=invalid');
    expect(res.status).toBe(400);
    db.close();
  });

  it('child profile only sees emergency contacts', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db, 'child');
    contactRepo.create({ name: 'Dr. Smith', category: 'medical' });
    contactRepo.create({ name: 'Police', category: 'emergency' });
    const res = await request(app).get('/api/v1/contacts');
    expect(res.status).toBe(200);
    const body = res.body as Array<{ category: string }>;
    expect(body.every((c) => c.category === 'emergency')).toBe(true);
    expect(body).toHaveLength(1);
    db.close();
  });

  it('teen profile sees all categories', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db, 'teen');
    contactRepo.create({ name: 'Dr. Smith', category: 'medical' });
    contactRepo.create({ name: 'Police', category: 'emergency' });
    const res = await request(app).get('/api/v1/contacts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    db.close();
  });

  it('returns 401 without profile header', async () => {
    const db = makeDb();
    const app = express();
    app.use(express.json());
    const contactRepo = new ContactRepository(db);
    const profileRepo = new ProfileRepository(db);
    app.use(createContactsRouter(contactRepo, noOpPin, profileRepo));
    app.use(errorHandler);
    const res = await request(app).get('/api/v1/contacts');
    expect(res.status).toBe(401);
    db.close();
  });
});

describe('GET /api/v1/contacts/:id', () => {
  it('returns a contact', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db);
    const c = contactRepo.create({ name: 'Alice', category: 'family' });
    const res = await request(app).get(`/api/v1/contacts/${c.id}`);
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('Alice');
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).get('/api/v1/contacts/9999');
    expect(res.status).toBe(404);
    db.close();
  });

  it('child gets 403 for non-emergency contact', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db, 'child');
    const c = contactRepo.create({ name: 'Dr. Smith', category: 'medical' });
    const res = await request(app).get(`/api/v1/contacts/${c.id}`);
    expect(res.status).toBe(403);
    db.close();
  });

  it('child can read emergency contact', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db, 'child');
    const c = contactRepo.create({ name: 'Police', category: 'emergency' });
    const res = await request(app).get(`/api/v1/contacts/${c.id}`);
    expect(res.status).toBe(200);
    db.close();
  });
});

describe('POST /api/v1/contacts', () => {
  it('creates a contact', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({ name: 'Dr. Jones', category: 'medical', phone: '01234567890' });
    expect(res.status).toBe(201);
    const body = res.body as { name: string; phone: string; category: string };
    expect(body.name).toBe('Dr. Jones');
    expect(body.phone).toBe('01234567890');
    expect(body.category).toBe('medical');
    db.close();
  });

  it('returns 400 for missing required fields', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).post('/api/v1/contacts').send({ name: 'No Category' });
    expect(res.status).toBe(400);
    db.close();
  });

  it('returns 400 for invalid category', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({ name: 'Test', category: 'bogus' });
    expect(res.status).toBe(400);
    db.close();
  });

  it('returns 401 when admin pin fails', async () => {
    const db = makeDb();
    const { app } = makeApp(db, 'admin', blockPin);
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({ name: 'X', category: 'emergency' });
    expect(res.status).toBe(401);
    db.close();
  });
});

describe('PATCH /api/v1/contacts/:id', () => {
  it('updates a contact', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db);
    const c = contactRepo.create({ name: 'Old Name', category: 'family' });
    const res = await request(app)
      .patch(`/api/v1/contacts/${c.id}`)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect((res.body as { name: string }).name).toBe('New Name');
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).patch('/api/v1/contacts/9999').send({ name: 'X' });
    expect(res.status).toBe(404);
    db.close();
  });
});

describe('DELETE /api/v1/contacts/:id', () => {
  it('deletes a contact', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db);
    const c = contactRepo.create({ name: 'To Delete', category: 'other' });
    const res = await request(app).delete(`/api/v1/contacts/${c.id}`);
    expect(res.status).toBe(204);
    expect(contactRepo.get(c.id)).toBeUndefined();
    db.close();
  });

  it('returns 404 for unknown id', async () => {
    const db = makeDb();
    const { app } = makeApp(db);
    const res = await request(app).delete('/api/v1/contacts/9999');
    expect(res.status).toBe(404);
    db.close();
  });

  it('returns 401 when admin pin fails', async () => {
    const db = makeDb();
    const { app, contactRepo } = makeApp(db, 'admin', blockPin);
    const c = contactRepo.create({ name: 'X', category: 'emergency' });
    const res = await request(app).delete(`/api/v1/contacts/${c.id}`);
    expect(res.status).toBe(401);
    db.close();
  });
});

describe('ContactRepository', () => {
  it('round-trip CRUD', () => {
    const db = makeDb();
    const repo = new ContactRepository(db);
    const c = repo.create({ name: 'Vet Clinic', category: 'pets', phone: '07700900000' });
    expect(c.id).toBeGreaterThan(0);
    expect(c.name).toBe('Vet Clinic');
    const found = repo.get(c.id);
    expect(found?.name).toBe('Vet Clinic');
    const updated = repo.update(c.id, { phone: '07700111111' });
    expect(updated.phone).toBe('07700111111');
    repo.delete(c.id);
    expect(repo.get(c.id)).toBeUndefined();
    db.close();
  });

  it('list with category filter', () => {
    const db = makeDb();
    const repo = new ContactRepository(db);
    repo.create({ name: 'A', category: 'medical' });
    repo.create({ name: 'B', category: 'trade' });
    repo.create({ name: 'C', category: 'medical' });
    const medical = repo.list({ category: 'medical' });
    expect(medical).toHaveLength(2);
    const all = repo.list();
    expect(all).toHaveLength(3);
    db.close();
  });
});

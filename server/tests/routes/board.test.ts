import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import BoardMessageRepository from '../../src/repositories/BoardMessageRepository';
import CountdownRepository from '../../src/repositories/CountdownRepository';
import WhiteboardRepository from '../../src/repositories/WhiteboardRepository';
import ChecklistRepository from '../../src/repositories/ChecklistRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createBoardRouter from '../../src/routes/board';
import defaultsFor from '../../src/services/permissionDefaults';

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(() => false),
    unlinkSync: jest.fn(),
  };
});

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

const noOpAdminPin: RequestHandler = (_req, _res, next) => next();

function makeRepos(db: Database.Database) {
  return {
    boardMsgRepo: new BoardMessageRepository(db),
    countdownRepo: new CountdownRepository(db),
    whiteboardRepo: new WhiteboardRepository(db),
    checklistRepo: new ChecklistRepository(db),
    profileRepo: new ProfileRepository(db),
  };
}

function seedProfile(db: Database.Database): number {
  const profileRepo = new ProfileRepository(db);
  const profile = profileRepo.create({
    name: 'Alice',
    type: 'admin',
    colour: '#3b82f6',
    text_size: 'default',
    permissions_json: defaultsFor('admin'),
    accessibility_json: {},
  });
  return profile.id;
}

function makeApp(
  boardMsgRepo: BoardMessageRepository,
  countdownRepo: CountdownRepository,
  whiteboardRepo: WhiteboardRepository,
  checklistRepo: ChecklistRepository,
  profileRepo: ProfileRepository,
) {
  const app = express();
  app.use(express.json());
  app.use(
    createBoardRouter(boardMsgRepo, countdownRepo, whiteboardRepo, checklistRepo, noOpAdminPin, profileRepo),
  );
  app.use(errorHandler);
  return app;
}

describe('Board messages', () => {
  let db: Database.Database;
  let repos: ReturnType<typeof makeRepos>;
  let app: ReturnType<typeof makeApp>;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    repos = makeRepos(db);
    profileId = seedProfile(db);
    app = makeApp(
      repos.boardMsgRepo,
      repos.countdownRepo,
      repos.whiteboardRepo,
      repos.checklistRepo,
      repos.profileRepo,
    );
  });

  it('GET /api/v1/board/messages returns empty list', async () => {
    const res = await request(app)
      .get('/api/v1/board/messages')
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/v1/board/messages creates message', async () => {
    const res = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'Hello board!', pinned: false });
    expect(res.status).toBe(201);
    const body = res.body as { content: string; pinned: boolean; archived: boolean };
    expect(body.content).toBe('Hello board!');
    expect(body.pinned).toBe(false);
    expect(body.archived).toBe(false);
  });

  it('POST /api/v1/board/messages creates pinned message', async () => {
    const res = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'Important!', pinned: true });
    expect(res.status).toBe(201);
    expect((res.body as { pinned: boolean }).pinned).toBe(true);
  });

  it('POST /api/v1/board/messages rejects empty content', async () => {
    const res = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/v1/board/messages/:id updates message', async () => {
    const created = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'Old content' });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .patch(`/api/v1/board/messages/${id}`)
      .set('x-profile-id', String(profileId))
      .send({ content: 'New content' });
    expect(res.status).toBe(200);
    expect((res.body as { content: string }).content).toBe('New content');
  });

  it('PATCH /api/v1/board/messages/:id returns 404 for unknown', async () => {
    const res = await request(app)
      .patch('/api/v1/board/messages/9999')
      .set('x-profile-id', String(profileId))
      .send({ content: 'x' });
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/board/messages/:id/archive archives message', async () => {
    const created = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'Dismiss me' });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .post(`/api/v1/board/messages/${id}/archive`)
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(200);
    expect((res.body as { archived: boolean }).archived).toBe(true);
  });

  it('GET /api/v1/board/messages excludes archived by default', async () => {
    await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'Active' });

    const created = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'Archived' });
    const { id } = created.body as { id: number };
    await request(app)
      .post(`/api/v1/board/messages/${id}/archive`)
      .set('x-profile-id', String(profileId));

    const res = await request(app)
      .get('/api/v1/board/messages')
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBe(1);
    expect((res.body as Array<{ content: string }>)[0].content).toBe('Active');
  });

  it('DELETE /api/v1/board/messages/:id deletes message', async () => {
    const created = await request(app)
      .post('/api/v1/board/messages')
      .set('x-profile-id', String(profileId))
      .send({ content: 'To delete' });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .delete(`/api/v1/board/messages/${id}`)
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(204);

    const listRes = await request(app)
      .get('/api/v1/board/messages')
      .set('x-profile-id', String(profileId));
    expect((listRes.body as unknown[]).length).toBe(0);
  });
});

describe('Countdown timers', () => {
  let db: Database.Database;
  let repos: ReturnType<typeof makeRepos>;
  let app: ReturnType<typeof makeApp>;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    repos = makeRepos(db);
    profileId = seedProfile(db);
    app = makeApp(
      repos.boardMsgRepo,
      repos.countdownRepo,
      repos.whiteboardRepo,
      repos.checklistRepo,
      repos.profileRepo,
    );
  });

  it('GET /api/v1/board/countdowns returns empty list', async () => {
    const res = await request(app)
      .get('/api/v1/board/countdowns')
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/v1/board/countdowns creates countdown', async () => {
    const targetDate = new Date('2027-12-25').getTime();
    const res = await request(app)
      .post('/api/v1/board/countdowns')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Christmas 2027', target_date: targetDate, show_on_home: true });
    expect(res.status).toBe(201);
    const body = res.body as { name: string; target_date: number; show_on_home: boolean };
    expect(body.name).toBe('Christmas 2027');
    expect(body.target_date).toBe(targetDate);
    expect(body.show_on_home).toBe(true);
  });

  it('POST /api/v1/board/countdowns rejects missing name', async () => {
    const res = await request(app)
      .post('/api/v1/board/countdowns')
      .set('x-profile-id', String(profileId))
      .send({ target_date: Date.now() });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/v1/board/countdowns/:id updates countdown', async () => {
    const created = await request(app)
      .post('/api/v1/board/countdowns')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Holiday', target_date: Date.now() + 86400000 });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .patch(`/api/v1/board/countdowns/${id}`)
      .set('x-profile-id', String(profileId))
      .send({ name: 'Summer Holiday', show_on_home: true });
    expect(res.status).toBe(200);
    const body = res.body as { name: string; show_on_home: boolean };
    expect(body.name).toBe('Summer Holiday');
    expect(body.show_on_home).toBe(true);
  });

  it('DELETE /api/v1/board/countdowns/:id deletes countdown', async () => {
    const created = await request(app)
      .post('/api/v1/board/countdowns')
      .set('x-profile-id', String(profileId))
      .send({ name: 'X', target_date: Date.now() + 86400000 });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .delete(`/api/v1/board/countdowns/${id}`)
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(204);
  });
});

describe('Board lists', () => {
  let db: Database.Database;
  let repos: ReturnType<typeof makeRepos>;
  let app: ReturnType<typeof makeApp>;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    repos = makeRepos(db);
    profileId = seedProfile(db);
    app = makeApp(
      repos.boardMsgRepo,
      repos.countdownRepo,
      repos.whiteboardRepo,
      repos.checklistRepo,
      repos.profileRepo,
    );
  });

  it('GET /api/v1/board/lists returns empty list', async () => {
    const res = await request(app)
      .get('/api/v1/board/lists')
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/v1/board/lists creates one_off list', async () => {
    const res = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Weekend tasks', type: 'one_off' });
    expect(res.status).toBe(201);
    const body = res.body as { name: string; type: string };
    expect(body.name).toBe('Weekend tasks');
    expect(body.type).toBe('one_off');
  });

  it('POST /api/v1/board/lists creates recurring list', async () => {
    const res = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Weekly chores', type: 'recurring' });
    expect(res.status).toBe(201);
    expect((res.body as { type: string }).type).toBe('recurring');
  });

  it('POST /api/v1/board/lists rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'X', type: 'daily_reset' });
    expect(res.status).toBe(400);
  });

  it('POST /api/v1/board/lists/:id/items adds item', async () => {
    const created = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'My list' });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .post(`/api/v1/board/lists/${id}/items`)
      .set('x-profile-id', String(profileId))
      .send({ text: 'Buy milk', sort_order: 0 });
    expect(res.status).toBe(201);
    const body = res.body as { text: string; ticked: boolean };
    expect(body.text).toBe('Buy milk');
    expect(body.ticked).toBe(false);
  });

  it('PATCH /api/v1/board/lists/:id/items/:itemId ticks item', async () => {
    const created = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'My list' });
    const { id: listId } = created.body as { id: number };

    const itemRes = await request(app)
      .post(`/api/v1/board/lists/${listId}/items`)
      .set('x-profile-id', String(profileId))
      .send({ text: 'Buy eggs', sort_order: 0 });
    const { id: itemId } = itemRes.body as { id: number };

    const res = await request(app)
      .patch(`/api/v1/board/lists/${listId}/items/${itemId}`)
      .set('x-profile-id', String(profileId))
      .send({ ticked: true });
    expect(res.status).toBe(200);
    expect((res.body as { ticked: boolean }).ticked).toBe(true);
  });

  it('POST /api/v1/board/lists/:id/reset resets items', async () => {
    const created = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Recurring', type: 'recurring' });
    const { id: listId } = created.body as { id: number };

    const itemRes = await request(app)
      .post(`/api/v1/board/lists/${listId}/items`)
      .set('x-profile-id', String(profileId))
      .send({ text: 'Do laundry', sort_order: 0 });
    const { id: itemId } = itemRes.body as { id: number };

    await request(app)
      .patch(`/api/v1/board/lists/${listId}/items/${itemId}`)
      .set('x-profile-id', String(profileId))
      .send({ ticked: true });

    const resetRes = await request(app)
      .post(`/api/v1/board/lists/${listId}/reset`)
      .set('x-profile-id', String(profileId));
    expect(resetRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/board/lists/${listId}`)
      .set('x-profile-id', String(profileId));
    expect((getRes.body as { items: Array<{ ticked: boolean }> }).items[0].ticked).toBe(false);
  });

  it('DELETE /api/v1/board/lists/:id deletes list', async () => {
    const created = await request(app)
      .post('/api/v1/board/lists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Temp' });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .delete(`/api/v1/board/lists/${id}`)
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(204);
  });
});

describe('Guest checklists', () => {
  let db: Database.Database;
  let repos: ReturnType<typeof makeRepos>;
  let app: ReturnType<typeof makeApp>;
  let profileId: number;

  beforeEach(() => {
    db = makeDb();
    repos = makeRepos(db);
    profileId = seedProfile(db);
    app = makeApp(
      repos.boardMsgRepo,
      repos.countdownRepo,
      repos.whiteboardRepo,
      repos.checklistRepo,
      repos.profileRepo,
    );
  });

  it('GET /api/v1/board/guest-checklists returns empty list', async () => {
    const res = await request(app)
      .get('/api/v1/board/guest-checklists')
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/v1/board/guest-checklists creates arrival checklist', async () => {
    const arrivalDate = new Date('2027-06-15').getTime();
    const res = await request(app)
      .post('/api/v1/board/guest-checklists')
      .set('x-profile-id', String(profileId))
      .send({
        name: 'Mum visit',
        guest_name: 'Mum',
        guest_arrival_date: arrivalDate,
        template: 'arrival',
      });
    expect(res.status).toBe(201);
    const body = res.body as { guest_name: string; guest_arrival_date: number; items: Array<{ text: string }> };
    expect(body.guest_name).toBe('Mum');
    expect(body.guest_arrival_date).toBe(arrivalDate);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].text).toBe('Fresh towels in bathroom');
  });

  it('POST /api/v1/board/guest-checklists creates departure checklist', async () => {
    const res = await request(app)
      .post('/api/v1/board/guest-checklists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Post-departure', guest_name: 'Dad', template: 'departure' });
    expect(res.status).toBe(201);
    expect((res.body as { items: Array<{ text: string }> }).items[0].text).toBe(
      'Strip and wash bed linen',
    );
  });

  it('POST /api/v1/board/guest-checklists requires guest_name', async () => {
    const res = await request(app)
      .post('/api/v1/board/guest-checklists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'No guest name', type: 'one_off' });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/v1/board/guest-checklists/:id/items/:itemId ticks item', async () => {
    const created = await request(app)
      .post('/api/v1/board/guest-checklists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Guest', guest_name: 'Friend' });
    const { id: listId } = created.body as { id: number };

    const addRes = await request(app)
      .post(`/api/v1/board/guest-checklists/${listId}/items`)
      .set('x-profile-id', String(profileId))
      .send({ text: 'Set up guest room', sort_order: 0 });
    const { id: itemId } = addRes.body as { id: number };

    const res = await request(app)
      .patch(`/api/v1/board/guest-checklists/${listId}/items/${itemId}`)
      .set('x-profile-id', String(profileId))
      .send({ ticked: true });
    expect(res.status).toBe(200);
    expect((res.body as { ticked: boolean }).ticked).toBe(true);
  });

  it('DELETE /api/v1/board/guest-checklists/:id deletes checklist', async () => {
    const created = await request(app)
      .post('/api/v1/board/guest-checklists')
      .set('x-profile-id', String(profileId))
      .send({ name: 'Temp guest', guest_name: 'X' });
    const { id } = created.body as { id: number };

    const res = await request(app)
      .delete(`/api/v1/board/guest-checklists/${id}`)
      .set('x-profile-id', String(profileId));
    expect(res.status).toBe(204);
  });
});

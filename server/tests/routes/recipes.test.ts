import Database from 'better-sqlite3';
import express from 'express';
import type { RequestHandler } from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import RecipeRepository from '../../src/repositories/RecipeRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createRecipesRouter from '../../src/routes/recipes';
import type { Profile } from '../../src/types/profile';
import defaultsFor from '../../src/services/permissionDefaults';

// Mock sharp to avoid actual image processing in tests
jest.mock('sharp', () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  })),
);

// Mock fs.mkdirSync to avoid creating directories in tests
jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    mkdirSync: jest.fn(),
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

// Simple no-op admin pin middleware for most tests (skip PIN requirement)
const noOpAdminPin: RequestHandler = (_req, _res, next) => next();

// Admin pin middleware that blocks (for testing PIN requirement)
const blockingAdminPin: RequestHandler = (_req, res) => {
  res.status(403).json({ error: 'Invalid admin PIN', code: 'INVALID_ADMIN_PIN' });
};

function makeApp(
  recipeRepo: RecipeRepository,
  profileRepo: ProfileRepository,
  settingsRepo: AppSettingsRepository,
  adminPin: RequestHandler = noOpAdminPin,
) {
  const app = express();
  app.use(express.json());
  app.use(createRecipesRouter(recipeRepo, settingsRepo, profileRepo, adminPin));
  app.use(errorHandler);
  return app;
}

function withProfile(profile: Profile) {
  return { 'x-profile-id': String(profile.id) };
}

const BASE_RECIPE = {
  title: 'Pasta Carbonara',
  description: 'Classic Italian',
  prep_mins: 10,
  cook_mins: 20,
  servings: 4,
  tags: ['italian'],
  ingredients: [{ ingredient: 'spaghetti', quantity: 400, unit: 'g', sort_order: 0 }],
};

describe('Recipes API', () => {
  let db: Database.Database;
  let recipeRepo: RecipeRepository;
  let profileRepo: ProfileRepository;
  let settingsRepo: AppSettingsRepository;
  let app: ReturnType<typeof makeApp>;
  let admin: Profile;
  let child: Profile; // has view_food but NOT add_recipe
  let toddler: Profile; // has no view_food, no add_recipe

  beforeEach(() => {
    db = makeDb();
    recipeRepo = new RecipeRepository(db);
    profileRepo = new ProfileRepository(db);
    settingsRepo = new AppSettingsRepository(db);
    app = makeApp(recipeRepo, profileRepo, settingsRepo);

    admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#000000',
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('admin'),
    });

    child = profileRepo.create({
      name: 'Child',
      type: 'child',
      colour: '#FF0000',
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('child'),
    });

    toddler = profileRepo.create({
      name: 'Toddler',
      type: 'toddler',
      colour: '#00FF00',
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('toddler'),
    });
  });

  afterEach(() => {
    db.close();
  });

  // ─── GET /api/v1/recipes ────────────────────────────────────────────────────

  describe('GET /api/v1/recipes', () => {
    it('returns empty list when no recipes', async () => {
      const res = await request(app).get('/api/v1/recipes').set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns recipes list', async () => {
      recipeRepo.create(BASE_RECIPE);
      const res = await request(app).get('/api/v1/recipes').set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body as Array<{ title: string }>).toHaveLength(1);
      expect((res.body as Array<{ title: string }>)[0].title).toBe('Pasta Carbonara');
    });

    it('filters by search query', async () => {
      recipeRepo.create(BASE_RECIPE);
      recipeRepo.create({ ...BASE_RECIPE, title: 'Pizza', tags: [], ingredients: [] });
      const res = await request(app).get('/api/v1/recipes?search=pizza').set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body as Array<{ title: string }>).toHaveLength(1);
      expect((res.body as Array<{ title: string }>)[0].title).toBe('Pizza');
    });

    it('filters by tags query', async () => {
      recipeRepo.create(BASE_RECIPE); // italian
      recipeRepo.create({ ...BASE_RECIPE, title: 'Sushi', tags: ['japanese'], ingredients: [] });
      const res = await request(app).get('/api/v1/recipes?tags=japanese').set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body as Array<{ title: string }>).toHaveLength(1);
      expect((res.body as Array<{ title: string }>)[0].title).toBe('Sushi');
    });

    it('returns 401 without profile header', async () => {
      const res = await request(app).get('/api/v1/recipes');
      expect(res.status).toBe(401);
    });

    it('returns 403 for profile without view_food permission', async () => {
      const res = await request(app).get('/api/v1/recipes').set(withProfile(toddler)); // toddler has no view_food
      expect(res.status).toBe(403);
    });
  });

  // ─── GET /api/v1/recipes/:id ────────────────────────────────────────────────

  describe('GET /api/v1/recipes/:id', () => {
    it('returns recipe with ingredients', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app).get(`/api/v1/recipes/${recipe.id}`).set(withProfile(admin));
      expect(res.status).toBe(200);
      expect((res.body as { title: string; ingredients: unknown[] }).title).toBe('Pasta Carbonara');
      expect((res.body as { ingredients: unknown[] }).ingredients).toHaveLength(1);
    });

    it('returns 404 for non-existent recipe', async () => {
      const res = await request(app).get('/api/v1/recipes/9999').set(withProfile(admin));
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).get('/api/v1/recipes/abc').set(withProfile(admin));
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/v1/recipes ───────────────────────────────────────────────────

  describe('POST /api/v1/recipes', () => {
    it('creates recipe with ingredients → 201', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set(withProfile(admin))
        .send(BASE_RECIPE);
      expect(res.status).toBe(201);
      const body = res.body as { id: number; title: string; ingredients: unknown[] };
      expect(body.id).toBeGreaterThan(0);
      expect(body.title).toBe('Pasta Carbonara');
      expect(body.ingredients).toHaveLength(1);
    });

    it('returns 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set(withProfile(admin))
        .send({ prep_mins: 10, cook_mins: 20, servings: 4, tags: [], ingredients: [] });
      expect(res.status).toBe(400);
      expect((res.body as { error: string }).error).toBe('validation');
    });

    it('returns 403 for profile without add_recipe permission', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set(withProfile(child))
        .send(BASE_RECIPE);
      expect(res.status).toBe(403);
    });
  });

  // ─── PATCH /api/v1/recipes/:id ──────────────────────────────────────────────

  describe('PATCH /api/v1/recipes/:id', () => {
    it('updates recipe title', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app)
        .patch(`/api/v1/recipes/${recipe.id}`)
        .set(withProfile(admin))
        .send({ title: 'Updated Carbonara' });
      expect(res.status).toBe(200);
      expect((res.body as { title: string }).title).toBe('Updated Carbonara');
    });

    it('updates ingredients', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app)
        .patch(`/api/v1/recipes/${recipe.id}`)
        .set(withProfile(admin))
        .send({
          ingredients: [
            { ingredient: 'rigatoni', quantity: 300, unit: 'g', sort_order: 0 },
            { ingredient: 'pancetta', quantity: 150, unit: 'g', sort_order: 1 },
          ],
        });
      expect(res.status).toBe(200);
      expect((res.body as { ingredients: unknown[] }).ingredients).toHaveLength(2);
    });

    it('returns 404 for non-existent recipe', async () => {
      const res = await request(app)
        .patch('/api/v1/recipes/9999')
        .set(withProfile(admin))
        .send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /api/v1/recipes/:id ─────────────────────────────────────────────

  describe('DELETE /api/v1/recipes/:id', () => {
    it('deletes recipe → 204', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app).delete(`/api/v1/recipes/${recipe.id}`).set(withProfile(admin));
      expect(res.status).toBe(204);
      expect(recipeRepo.get(recipe.id)).toBeUndefined();
    });

    it('returns 404 for non-existent recipe', async () => {
      const res = await request(app).delete('/api/v1/recipes/9999').set(withProfile(admin));
      expect(res.status).toBe(404);
    });

    it('returns 403 when admin PIN middleware blocks', async () => {
      const appWithPin = makeApp(recipeRepo, profileRepo, settingsRepo, blockingAdminPin);
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(appWithPin)
        .delete(`/api/v1/recipes/${recipe.id}`)
        .set(withProfile(admin));
      expect(res.status).toBe(403);
    });
  });

  // ─── POST /api/v1/recipes/:id/photo ─────────────────────────────────────────

  describe('POST /api/v1/recipes/:id/photo', () => {
    it('uploads photo and returns photo_path', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      // Create a small buffer (< 10 MB) as the "photo"
      const smallBuffer = Buffer.alloc(1024, 0xff); // 1 KB

      const res = await request(app)
        .post(`/api/v1/recipes/${recipe.id}/photo`)
        .set(withProfile(admin))
        .attach('photo', smallBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect((res.body as { photo_path: string }).photo_path).toBeTruthy();
      expect((res.body as { photo_path: string }).photo_path).toMatch(/\.webp$/);
    });

    it('returns 400 when photo exceeds 10 MB', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      // Create a buffer larger than 10 MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0xff);

      const res = await request(app)
        .post(`/api/v1/recipes/${recipe.id}/photo`)
        .set(withProfile(admin))
        .attach('photo', largeBuffer, { filename: 'large.jpg', contentType: 'image/jpeg' });

      // multer returns LIMIT_FILE_SIZE error — we handle it as 400
      expect(res.status).toBe(400);
      expect((res.body as { code: string }).code).toBe('FILE_TOO_LARGE');
    });

    it('returns 404 for non-existent recipe', async () => {
      const smallBuffer = Buffer.alloc(100, 0xff);
      const res = await request(app)
        .post('/api/v1/recipes/9999/photo')
        .set(withProfile(admin))
        .attach('photo', smallBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when no photo file provided', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app)
        .post(`/api/v1/recipes/${recipe.id}/photo`)
        .set(withProfile(admin));
      expect(res.status).toBe(400);
    });
  });
});

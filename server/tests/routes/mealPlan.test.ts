import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import MealPlanRepository from '../../src/repositories/MealPlanRepository';
import RecipeRepository from '../../src/repositories/RecipeRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createMealPlanRouter from '../../src/routes/mealPlan';
import type { Profile } from '../../src/types/profile';
import defaultsFor from '../../src/services/permissionDefaults';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeApp(
  mealPlanRepo: MealPlanRepository,
  recipeRepo: RecipeRepository,
  profileRepo: ProfileRepository,
) {
  const app = express();
  app.use(express.json());
  app.use(createMealPlanRouter(mealPlanRepo, recipeRepo, profileRepo));
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

describe('Meal Plan API', () => {
  let db: Database.Database;
  let mealPlanRepo: MealPlanRepository;
  let recipeRepo: RecipeRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;
  let admin: Profile;
  let toddler: Profile; // no view_food

  beforeEach(() => {
    db = makeDb();
    mealPlanRepo = new MealPlanRepository(db);
    recipeRepo = new RecipeRepository(db);
    profileRepo = new ProfileRepository(db);
    app = makeApp(mealPlanRepo, recipeRepo, profileRepo);

    admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#000000',
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: defaultsFor('admin'),
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

  // ─── GET /api/v1/meal-plan ──────────────────────────────────────────────────

  describe('GET /api/v1/meal-plan', () => {
    it('returns empty array when no entries', async () => {
      const res = await request(app)
        .get('/api/v1/meal-plan?start=2026-05-12&end=2026-05-18')
        .set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns entries in date range', async () => {
      mealPlanRepo.upsert({ plan_date: '2026-05-13', slot_name: 'dinner', free_text: 'Pizza' });
      const res = await request(app)
        .get('/api/v1/meal-plan?start=2026-05-12&end=2026-05-18')
        .set(withProfile(admin));
      expect(res.status).toBe(200);
      const body = res.body as Array<{ plan_date: string; slot_name: string; free_text: string }>;
      expect(body).toHaveLength(1);
      expect(body[0].plan_date).toBe('2026-05-13');
      expect(body[0].slot_name).toBe('dinner');
      expect(body[0].free_text).toBe('Pizza');
    });

    it('excludes entries outside the range', async () => {
      mealPlanRepo.upsert({ plan_date: '2026-05-01', slot_name: 'lunch', free_text: 'Soup' });
      const res = await request(app)
        .get('/api/v1/meal-plan?start=2026-05-12&end=2026-05-18')
        .set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 400 when start/end missing', async () => {
      const res = await request(app).get('/api/v1/meal-plan').set(withProfile(admin));
      expect(res.status).toBe(400);
    });

    it('returns 400 when date format is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/meal-plan?start=not-a-date&end=2026-05-18')
        .set(withProfile(admin));
      expect(res.status).toBe(400);
    });

    it('returns 401 without profile header', async () => {
      const res = await request(app).get('/api/v1/meal-plan?start=2026-05-12&end=2026-05-18');
      expect(res.status).toBe(401);
    });

    it('returns 403 when profile lacks view_food', async () => {
      const res = await request(app)
        .get('/api/v1/meal-plan?start=2026-05-12&end=2026-05-18')
        .set(withProfile(toddler));
      expect(res.status).toBe(403);
    });

    it('includes inline recipe when entry has recipe_id', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      mealPlanRepo.upsert({
        plan_date: '2026-05-13',
        slot_name: 'dinner',
        recipe_id: recipe.id,
      });
      const res = await request(app)
        .get('/api/v1/meal-plan?start=2026-05-12&end=2026-05-18')
        .set(withProfile(admin));
      expect(res.status).toBe(200);
      const body = res.body as Array<{ recipe: { id: number; title: string } | null }>;
      expect(body[0].recipe).not.toBeNull();
      expect(body[0].recipe!.id).toBe(recipe.id);
      expect(body[0].recipe!.title).toBe('Pasta Carbonara');
    });
  });

  // ─── POST /api/v1/meal-plan ─────────────────────────────────────────────────

  describe('POST /api/v1/meal-plan', () => {
    it('creates a new entry with free text', async () => {
      const res = await request(app)
        .post('/api/v1/meal-plan')
        .set(withProfile(admin))
        .send({ plan_date: '2026-05-13', slot_name: 'lunch', free_text: 'Salad' });
      expect(res.status).toBe(201);
      const body = res.body as {
        id: number;
        plan_date: string;
        slot_name: string;
        free_text: string;
      };
      expect(body.id).toBeDefined();
      expect(body.plan_date).toBe('2026-05-13');
      expect(body.slot_name).toBe('lunch');
      expect(body.free_text).toBe('Salad');
    });

    it('upserts when same plan_date + slot_name exists', async () => {
      await request(app)
        .post('/api/v1/meal-plan')
        .set(withProfile(admin))
        .send({ plan_date: '2026-05-13', slot_name: 'dinner', free_text: 'Pizza' });

      const res = await request(app)
        .post('/api/v1/meal-plan')
        .set(withProfile(admin))
        .send({ plan_date: '2026-05-13', slot_name: 'dinner', free_text: 'Tacos' });

      expect(res.status).toBe(201);
      expect((res.body as { free_text: string }).free_text).toBe('Tacos');

      // Should only have one entry
      const listRes = await request(app)
        .get('/api/v1/meal-plan?start=2026-05-13&end=2026-05-13')
        .set(withProfile(admin));
      expect(listRes.body).toHaveLength(1);
    });

    it('creates entry with recipe_id', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app)
        .post('/api/v1/meal-plan')
        .set(withProfile(admin))
        .send({ plan_date: '2026-05-14', slot_name: 'breakfast', recipe_id: recipe.id });
      expect(res.status).toBe(201);
      const body = res.body as { recipe_id: number; recipe: { title: string } | null };
      expect(body.recipe_id).toBe(recipe.id);
      expect(body.recipe).not.toBeNull();
    });

    it('returns 400 on invalid body', async () => {
      const res = await request(app)
        .post('/api/v1/meal-plan')
        .set(withProfile(admin))
        .send({ plan_date: 'not-a-date', slot_name: 'lunch' });
      expect(res.status).toBe(400);
    });

    it('returns 401 without profile', async () => {
      const res = await request(app)
        .post('/api/v1/meal-plan')
        .send({ plan_date: '2026-05-13', slot_name: 'lunch' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when profile lacks view_food', async () => {
      const res = await request(app)
        .post('/api/v1/meal-plan')
        .set(withProfile(toddler))
        .send({ plan_date: '2026-05-13', slot_name: 'lunch' });
      expect(res.status).toBe(403);
    });
  });

  // ─── DELETE /api/v1/meal-plan/:id ──────────────────────────────────────────

  describe('DELETE /api/v1/meal-plan/:id', () => {
    it('deletes an existing entry', async () => {
      const entry = mealPlanRepo.upsert({
        plan_date: '2026-05-13',
        slot_name: 'lunch',
        free_text: 'Soup',
      });
      const res = await request(app)
        .delete(`/api/v1/meal-plan/${entry.id}`)
        .set(withProfile(admin));
      expect(res.status).toBe(204);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/api/v1/meal-plan/9999').set(withProfile(admin));
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).delete('/api/v1/meal-plan/abc').set(withProfile(admin));
      expect(res.status).toBe(400);
    });

    it('returns 401 without profile', async () => {
      const entry = mealPlanRepo.upsert({
        plan_date: '2026-05-13',
        slot_name: 'lunch',
        free_text: 'Soup',
      });
      const res = await request(app).delete(`/api/v1/meal-plan/${entry.id}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when profile lacks view_food', async () => {
      const entry = mealPlanRepo.upsert({
        plan_date: '2026-05-13',
        slot_name: 'lunch',
        free_text: 'Soup',
      });
      const res = await request(app)
        .delete(`/api/v1/meal-plan/${entry.id}`)
        .set(withProfile(toddler));
      expect(res.status).toBe(403);
    });
  });
});

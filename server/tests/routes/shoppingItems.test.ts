import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import request from 'supertest';
import { runMigrations } from '../../src/db/migrationRunner';
import errorHandler from '../../src/middleware/errorHandler';
import ShoppingItemRepository from '../../src/repositories/ShoppingItemRepository';
import RecipeRepository from '../../src/repositories/RecipeRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import createShoppingItemsRouter from '../../src/routes/shoppingItems';
import type { Profile } from '../../src/types/profile';
import defaultsFor from '../../src/services/permissionDefaults';

// Suppress event bus side-effects in route tests
jest.mock('../../src/core/eventBus', () => ({
  __esModule: true,
  default: { emit: jest.fn(), on: jest.fn(), off: jest.fn() },
}));

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function makeApp(
  shoppingRepo: ShoppingItemRepository,
  recipeRepo: RecipeRepository,
  profileRepo: ProfileRepository,
) {
  const app = express();
  app.use(express.json());
  app.use(createShoppingItemsRouter(shoppingRepo, recipeRepo, profileRepo));
  app.use(errorHandler);
  return app;
}

function withProfile(profile: Profile) {
  return { 'x-profile-id': String(profile.id) };
}

const BASE_RECIPE = {
  title: 'Test Recipe',
  prep_mins: 5,
  cook_mins: 10,
  servings: 2,
  tags: [],
  ingredients: [
    { ingredient: 'Milk', quantity: 500, unit: 'ml', sort_order: 0 },
    { ingredient: 'Flour', quantity: 200, unit: 'g', sort_order: 1 },
  ],
};

describe('Shopping Items API', () => {
  let db: Database.Database;
  let shoppingRepo: ShoppingItemRepository;
  let recipeRepo: RecipeRepository;
  let profileRepo: ProfileRepository;
  let app: ReturnType<typeof makeApp>;
  let admin: Profile;
  let teen: Profile;
  let child: Profile; // no add_to_shopping

  beforeEach(() => {
    db = makeDb();
    shoppingRepo = new ShoppingItemRepository(db);
    recipeRepo = new RecipeRepository(db);
    profileRepo = new ProfileRepository(db);

    admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#000000',
      permissions_json: defaultsFor('admin'),
    });
    teen = profileRepo.create({
      name: 'Teen',
      type: 'teen',
      colour: '#0000FF',
      permissions_json: defaultsFor('teen'),
    });
    child = profileRepo.create({
      name: 'Child',
      type: 'child',
      colour: '#FF0000',
      permissions_json: defaultsFor('child'),
    });

    app = makeApp(shoppingRepo, recipeRepo, profileRepo);
  });

  afterEach(() => {
    db.close();
  });

  // ── GET /api/v1/shopping ──────────────────────────────────────────────────

  describe('GET /api/v1/shopping', () => {
    it('returns empty list when no items', async () => {
      const res = await request(app).get('/api/v1/shopping').set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all shopping items', async () => {
      shoppingRepo.create({ name: 'Milk', quantity: 2, unit: 'L', category: 'Dairy' });
      shoppingRepo.create({ name: 'Bread' });

      const res = await request(app).get('/api/v1/shopping').set(withProfile(admin));
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('returns 401 without profile header', async () => {
      const res = await request(app).get('/api/v1/shopping');
      expect(res.status).toBe(401);
    });

    it('returns 403 for profile without view_food', async () => {
      // toddler has no view_food permission
      const toddler = profileRepo.create({
        name: 'Toddler',
        type: 'toddler',
        colour: '#00FF00',
        permissions_json: defaultsFor('toddler'),
      });
      const res = await request(app).get('/api/v1/shopping').set(withProfile(toddler));
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/v1/shopping ─────────────────────────────────────────────────

  describe('POST /api/v1/shopping', () => {
    it('creates a shopping item', async () => {
      const res = await request(app)
        .post('/api/v1/shopping')
        .set(withProfile(admin))
        .send({ name: 'Eggs', quantity: 6 });

      expect(res.status).toBe(201);
      const body = res.body as { name: string; quantity: number; id: number };
      expect(body.name).toBe('Eggs');
      expect(body.quantity).toBe(6);
      expect(body.id).toBeGreaterThan(0);
    });

    it('automatically sets added_by_profile_id from the profile header', async () => {
      const res = await request(app)
        .post('/api/v1/shopping')
        .set(withProfile(admin))
        .send({ name: 'Cheese' });

      expect(res.status).toBe(201);
      expect((res.body as { added_by_profile_id: number }).added_by_profile_id).toBe(admin.id);
    });

    it('sets pending_approval = 1 for teen', async () => {
      const res = await request(app)
        .post('/api/v1/shopping')
        .set(withProfile(teen))
        .send({ name: 'Sweets' });

      expect(res.status).toBe(201);
      expect((res.body as { pending_approval: number }).pending_approval).toBe(1);
    });

    it('sets pending_approval = 0 for admin', async () => {
      const res = await request(app)
        .post('/api/v1/shopping')
        .set(withProfile(admin))
        .send({ name: 'Coffee' });

      expect(res.status).toBe(201);
      expect((res.body as { pending_approval: number }).pending_approval).toBe(0);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/shopping')
        .set(withProfile(admin))
        .send({ quantity: 3 });

      expect(res.status).toBe(400);
      expect((res.body as { error: string }).error).toBe('validation');
    });

    it('returns 403 for child (no add_to_shopping)', async () => {
      const res = await request(app)
        .post('/api/v1/shopping')
        .set(withProfile(child))
        .send({ name: 'Biscuits' });

      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/v1/shopping/from-recipe ────────────────────────────────────

  describe('POST /api/v1/shopping/from-recipe', () => {
    it('adds all recipe ingredients to the shopping list', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);

      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({ recipe_id: recipe.id, ingredient_ids: [], scale: 1 });

      expect(res.status).toBe(201);
      const body = res.body as { added: unknown[]; merged: unknown[] };
      expect(body.added).toHaveLength(2);
      expect(body.merged).toHaveLength(0);
    });

    it('scales ingredient quantities', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);

      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({ recipe_id: recipe.id, ingredient_ids: [], scale: 3 });

      const milk = (res.body as { added: Array<{ name: string; quantity: number }> }).added.find(
        (i) => i.name === 'Milk',
      );
      expect(milk?.quantity).toBe(1500);
    });

    it('merges into an existing non-ticked item', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      shoppingRepo.create({ name: 'Milk', quantity: 250, unit: 'ml' });

      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({ recipe_id: recipe.id, ingredient_ids: [], scale: 1 });

      expect(res.status).toBe(201);
      const mergeBody = res.body as { merged: Array<{ quantity: number }> };
      expect(mergeBody.merged).toHaveLength(1);
      expect(mergeBody.merged[0].quantity).toBe(750); // 250 + 500
    });

    it('defaults scale to 1 when omitted', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);

      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({ recipe_id: recipe.id });

      expect(res.status).toBe(201);
      const milk = (res.body as { added: Array<{ name: string; quantity: number }> }).added.find(
        (i) => i.name === 'Milk',
      );
      expect(milk?.quantity).toBe(500);
    });

    it('returns 404 when recipe does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({ recipe_id: 9999 });

      expect(res.status).toBe(404);
    });

    it('returns 400 when recipe_id is missing', async () => {
      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when scale is not positive', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(admin))
        .send({ recipe_id: recipe.id, scale: -1 });

      expect(res.status).toBe(400);
    });

    it('sets pending_approval = 1 for teen via from-recipe', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);

      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(teen))
        .send({ recipe_id: recipe.id });

      expect(res.status).toBe(201);
      (res.body as { added: Array<{ pending_approval: number }> }).added.forEach((item) => {
        expect(item.pending_approval).toBe(1);
      });
    });

    it('returns 403 for profile without add_to_shopping', async () => {
      const recipe = recipeRepo.create(BASE_RECIPE);
      const res = await request(app)
        .post('/api/v1/shopping/from-recipe')
        .set(withProfile(child))
        .send({ recipe_id: recipe.id });

      expect(res.status).toBe(403);
    });
  });

  // ── PATCH /api/v1/shopping/:id ────────────────────────────────────────────

  describe('PATCH /api/v1/shopping/:id', () => {
    it('ticks a shopping item', async () => {
      const item = shoppingRepo.create({ name: 'Butter' });

      const res = await request(app)
        .patch(`/api/v1/shopping/${item.id}`)
        .set(withProfile(admin))
        .send({ ticked: 1 });

      expect(res.status).toBe(200);
      expect((res.body as { ticked: number }).ticked).toBe(1);
    });

    it('updates name and quantity', async () => {
      const item = shoppingRepo.create({ name: 'Old Name', quantity: 1 });

      const res = await request(app)
        .patch(`/api/v1/shopping/${item.id}`)
        .set(withProfile(admin))
        .send({ name: 'New Name', quantity: 5 });

      expect(res.status).toBe(200);
      const patchBody = res.body as { name: string; quantity: number };
      expect(patchBody.name).toBe('New Name');
      expect(patchBody.quantity).toBe(5);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .patch('/api/v1/shopping/9999')
        .set(withProfile(admin))
        .send({ ticked: 1 });

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .patch('/api/v1/shopping/abc')
        .set(withProfile(admin))
        .send({ ticked: 1 });

      expect(res.status).toBe(400);
    });

    it('child (tick_shopping permission) can tick items', async () => {
      const item = shoppingRepo.create({ name: 'Apple' });
      const res = await request(app)
        .patch(`/api/v1/shopping/${item.id}`)
        .set(withProfile(child))
        .send({ ticked: 1 });

      expect(res.status).toBe(200);
    });
  });

  // ── DELETE /api/v1/shopping/:id ───────────────────────────────────────────

  describe('DELETE /api/v1/shopping/:id', () => {
    it('deletes a shopping item', async () => {
      const item = shoppingRepo.create({ name: 'Remove Me' });

      const res = await request(app).delete(`/api/v1/shopping/${item.id}`).set(withProfile(admin));

      expect(res.status).toBe(204);
      expect(shoppingRepo.get(item.id)).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/api/v1/shopping/9999').set(withProfile(admin));

      expect(res.status).toBe(404);
    });

    it('returns 403 for child (no add_to_shopping)', async () => {
      const item = shoppingRepo.create({ name: 'Blocked' });
      const res = await request(app).delete(`/api/v1/shopping/${item.id}`).set(withProfile(child));

      expect(res.status).toBe(403);
    });
  });

  // ── DELETE /api/v1/shopping (clear ticked) ────────────────────────────────

  describe('DELETE /api/v1/shopping', () => {
    it('clears all ticked items and returns count', async () => {
      shoppingRepo.create({ name: 'Ticked A', ticked: 1 });
      shoppingRepo.create({ name: 'Ticked B', ticked: 1 });
      shoppingRepo.create({ name: 'Unticked' });

      const res = await request(app).delete('/api/v1/shopping').set(withProfile(admin));

      expect(res.status).toBe(200);
      expect((res.body as { deleted: number }).deleted).toBe(2);
      expect(shoppingRepo.list()).toHaveLength(1);
    });

    it('returns 0 when nothing is ticked', async () => {
      shoppingRepo.create({ name: 'Fresh' });

      const res = await request(app).delete('/api/v1/shopping').set(withProfile(admin));

      expect(res.status).toBe(200);
      expect((res.body as { deleted: number }).deleted).toBe(0);
    });

    it('child (no tick_shopping) gets 403', async () => {
      // child does have tick_shopping — use toddler (none)
      const toddler = profileRepo.create({
        name: 'Toddler',
        type: 'toddler',
        colour: '#00FF00',
        permissions_json: defaultsFor('toddler'),
      });
      const res = await request(app).delete('/api/v1/shopping').set(withProfile(toddler));

      expect(res.status).toBe(403);
    });
  });
});

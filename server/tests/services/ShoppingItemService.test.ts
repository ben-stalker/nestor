import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import RecipeRepository from '../../src/repositories/RecipeRepository';
import ShoppingItemRepository from '../../src/repositories/ShoppingItemRepository';
import { ShoppingItemService } from '../../src/services/ShoppingItemService';
import { initCrypto } from '../../src/utils/crypto';
import defaultsFor from '../../src/services/permissionDefaults';
import eventBus from '../../src/core/eventBus';

// Suppress event bus emissions; we test side-effects via the repository
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

const BASE_RECIPE = {
  title: 'Pasta Carbonara',
  prep_mins: 10,
  cook_mins: 20,
  servings: 4,
  tags: [],
  ingredients: [
    { ingredient: 'Spaghetti', quantity: 400, unit: 'g', sort_order: 0 },
    { ingredient: 'Eggs', quantity: 4, unit: null, sort_order: 1 },
    { ingredient: 'Bacon', quantity: 200, unit: 'g', sort_order: 2 },
  ],
};

describe('ShoppingItemService.addFromRecipe', () => {
  let db: Database.Database;
  let recipeRepo: RecipeRepository;
  let shoppingRepo: ShoppingItemRepository;
  let profileRepo: ProfileRepository;
  let service: ShoppingItemService;
  let adminProfileId: number;
  let teenProfileId: number;

  beforeEach(() => {
    db = makeDb();
    recipeRepo = new RecipeRepository(db);
    shoppingRepo = new ShoppingItemRepository(db);
    profileRepo = new ProfileRepository(db);
    service = new ShoppingItemService(shoppingRepo, recipeRepo);

    // Create real profiles so FK constraints are satisfied
    const admin = profileRepo.create({
      name: 'Admin',
      type: 'admin',
      colour: '#000000',
      permissions_json: defaultsFor('admin'),
    });
    const teen = profileRepo.create({
      name: 'Teen',
      type: 'teen',
      colour: '#0000FF',
      permissions_json: defaultsFor('teen'),
    });
    adminProfileId = admin.id;
    teenProfileId = teen.id;
  });

  afterEach(() => {
    db.close();
  });

  it('adds all ingredients when ingredientIds is empty', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    expect(result.added).toHaveLength(3);
    expect(result.merged).toHaveLength(0);
    expect(shoppingRepo.list()).toHaveLength(3);
  });

  it('adds only specified ingredient IDs', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);
    const [first] = recipe.ingredients;

    const result = await service.addFromRecipe(recipe.id, [first.id], 1, adminProfileId, 'admin');

    expect(result.added).toHaveLength(1);
    expect(result.added[0].name).toBe('Spaghetti');
    expect(shoppingRepo.list()).toHaveLength(1);
  });

  it('scales quantities by the given scale factor', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);

    const result = await service.addFromRecipe(recipe.id, [], 2, adminProfileId, 'admin');

    const spaghetti = result.added.find((i) => i.name === 'Spaghetti');
    expect(spaghetti?.quantity).toBe(800); // 400 * 2
  });

  it('merges quantity into an existing non-ticked item with same name and unit', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);
    // Pre-existing item — no added_by_profile_id so no FK constraint
    shoppingRepo.create({ name: 'Spaghetti', quantity: 100, unit: 'g' });

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].quantity).toBe(500); // 100 + 400
    // Only 2 new items should be created (Eggs + Bacon)
    expect(result.added).toHaveLength(2);
  });

  it('does not merge with ticked items', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);
    shoppingRepo.create({ name: 'Spaghetti', quantity: 100, unit: 'g', ticked: 1 });

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    // Ticked item is ignored — all 3 added fresh
    expect(result.added).toHaveLength(3);
    expect(result.merged).toHaveLength(0);
  });

  it('treats null+null units as a match for merging', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);
    shoppingRepo.create({ name: 'Eggs', quantity: 2, unit: null });

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    const eggsItem = result.merged.find((i) => i.name === 'Eggs');
    expect(eggsItem?.quantity).toBe(6); // 2 + 4
  });

  it('does not merge when units differ', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);
    shoppingRepo.create({ name: 'Spaghetti', quantity: 1, unit: 'kg' }); // unit differs from 'g'

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    expect(result.added.find((i) => i.name === 'Spaghetti')).toBeDefined();
    expect(result.merged.find((i) => i.name === 'Spaghetti')).toBeUndefined();
  });

  it('sets pending_approval = 1 for teen profile type', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);

    const result = await service.addFromRecipe(recipe.id, [], 1, teenProfileId, 'teen');

    result.added.forEach((item) => {
      expect(item.pending_approval).toBe(1);
    });
  });

  it('sets pending_approval = 0 for non-teen profile types', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);

    const resultAdmin = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');
    resultAdmin.added.forEach((item) => expect(item.pending_approval).toBe(0));
  });

  it('sets added_by_profile_id correctly', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    result.added.forEach((item) => {
      expect(item.added_by_profile_id).toBe(adminProfileId);
    });
  });

  it('assigns a category to each new item', async () => {
    const recipe = recipeRepo.create(BASE_RECIPE);

    const result = await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    const spaghetti = result.added.find((i) => i.name === 'Spaghetti');
    const bacon = result.added.find((i) => i.name === 'Bacon');
    expect(spaghetti?.category).toBe('Pantry');
    expect(bacon?.category).toBe('Meat');
  });

  it('leaves ingredient quantity as null when recipe quantity is null', async () => {
    const recipe = recipeRepo.create({
      ...BASE_RECIPE,
      ingredients: [{ ingredient: 'Herbs', quantity: null, unit: null, sort_order: 0 }],
    });

    const result = await service.addFromRecipe(recipe.id, [], 2, adminProfileId, 'admin');

    expect(result.added[0].quantity).toBeNull();
  });

  it('throws when recipe does not exist', async () => {
    await expect(service.addFromRecipe(9999, [], 1, adminProfileId, 'admin')).rejects.toThrow(
      'not found',
    );
  });

  it('emits shopping:updated event', async () => {
    const bus = eventBus as unknown as { emit: jest.Mock };
    const recipe = recipeRepo.create(BASE_RECIPE);

    await service.addFromRecipe(recipe.id, [], 1, adminProfileId, 'admin');

    expect(bus.emit).toHaveBeenCalledWith('shopping:updated', {});
  });
});

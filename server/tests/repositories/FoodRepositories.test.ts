import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import RecipeRepository from '../../src/repositories/RecipeRepository';
import MealPlanRepository from '../../src/repositories/MealPlanRepository';
import ShoppingItemRepository from '../../src/repositories/ShoppingItemRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

// ─── RecipeRepository ───────────────────────────────────────────────────────

describe('RecipeRepository', () => {
  let db: Database.Database;
  let repo: RecipeRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new RecipeRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  const baseRecipe = {
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta',
    prep_mins: 10,
    cook_mins: 20,
    servings: 4,
    calories: 500,
    tags: ['italian', 'pasta'],
    ingredients: [
      { ingredient: 'spaghetti', quantity: 400, unit: 'g', sort_order: 0 },
      { ingredient: 'eggs', quantity: 4, unit: null, sort_order: 1 },
    ],
  };

  describe('create / get', () => {
    it('creates a recipe and retrieves it with ingredients', () => {
      const recipe = repo.create(baseRecipe);
      expect(recipe.id).toBeGreaterThan(0);
      expect(recipe.title).toBe('Pasta Carbonara');
      expect(recipe.tags).toEqual(['italian', 'pasta']);
      expect(recipe.ingredients).toHaveLength(2);
      expect(recipe.ingredients[0].ingredient).toBe('spaghetti');
      expect(recipe.ingredients[0].quantity).toBe(400);
      expect(recipe.ingredients[0].unit).toBe('g');
    });

    it('returns undefined for missing id', () => {
      expect(repo.get(9999)).toBeUndefined();
    });

    it('creates a recipe with no ingredients', () => {
      const recipe = repo.create({
        title: 'Simple',
        prep_mins: 0,
        cook_mins: 0,
        servings: 1,
        tags: [],
        ingredients: [],
      });
      expect(recipe.ingredients).toHaveLength(0);
    });
  });

  describe('list', () => {
    beforeEach(() => {
      repo.create(baseRecipe);
      repo.create({
        ...baseRecipe,
        title: 'Pizza Margherita',
        tags: ['italian', 'pizza'],
        ingredients: [],
      });
      repo.create({ ...baseRecipe, title: 'Sushi', tags: ['japanese'], ingredients: [] });
    });

    it('returns all recipes without ingredients', () => {
      const list = repo.list();
      expect(list).toHaveLength(3);
      // List view does not include ingredients
      list.forEach((r) => expect(r.ingredients).toHaveLength(0));
    });

    it('filters by search term', () => {
      const list = repo.list({ search: 'pizza' });
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Pizza Margherita');
    });

    it('filters by tags', () => {
      const list = repo.list({ tags: ['japanese'] });
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Sushi');
    });

    it('filters by multiple tags (AND logic)', () => {
      const list = repo.list({ tags: ['italian', 'pizza'] });
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Pizza Margherita');
    });
  });

  describe('update', () => {
    it('updates scalar fields', () => {
      const recipe = repo.create(baseRecipe);
      const updated = repo.update(recipe.id, { title: 'Pasta Bake', prep_mins: 15 });
      expect(updated?.title).toBe('Pasta Bake');
      expect(updated?.prep_mins).toBe(15);
      expect(updated?.cook_mins).toBe(20); // unchanged
    });

    it('replaces ingredients on update', () => {
      const recipe = repo.create(baseRecipe);
      const updated = repo.update(recipe.id, {
        ingredients: [{ ingredient: 'rigatoni', quantity: 300, unit: 'g', sort_order: 0 }],
      });
      expect(updated?.ingredients).toHaveLength(1);
      expect(updated?.ingredients[0].ingredient).toBe('rigatoni');
    });

    it('preserves ingredients when not included in update', () => {
      const recipe = repo.create(baseRecipe);
      const updated = repo.update(recipe.id, { title: 'Updated Title' });
      expect(updated?.ingredients).toHaveLength(2);
    });

    it('updates tags', () => {
      const recipe = repo.create(baseRecipe);
      const updated = repo.update(recipe.id, { tags: ['comfort-food'] });
      expect(updated?.tags).toEqual(['comfort-food']);
    });

    it('returns undefined for missing id', () => {
      expect(repo.update(9999, { title: 'X' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes existing recipe and cascades to ingredients', () => {
      const recipe = repo.create(baseRecipe);
      expect(repo.delete(recipe.id)).toBe(true);
      expect(repo.get(recipe.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(9999)).toBe(false);
    });

    it('cascade deletes ingredients when recipe is deleted', () => {
      const recipe = repo.create(baseRecipe);
      repo.delete(recipe.id);
      const rows = db
        .prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ?')
        .all(recipe.id);
      expect(rows).toHaveLength(0);
    });
  });
});

// ─── MealPlanRepository ─────────────────────────────────────────────────────

describe('MealPlanRepository', () => {
  let db: Database.Database;
  let repo: MealPlanRepository;
  let recipeRepo: RecipeRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new MealPlanRepository(db);
    recipeRepo = new RecipeRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create / get', () => {
    it('creates an entry with free_text', () => {
      const entry = repo.create({
        plan_date: '2025-01-01',
        slot_name: 'dinner',
        free_text: 'Takeaway',
        recipe_id: null,
      });
      expect(entry.id).toBeGreaterThan(0);
      expect(entry.plan_date).toBe('2025-01-01');
      expect(entry.slot_name).toBe('dinner');
      expect(entry.free_text).toBe('Takeaway');
      expect(entry.recipe).toBeNull();
    });

    it('creates an entry linked to a recipe and joins it', () => {
      const recipe = recipeRepo.create({
        title: 'Pasta',
        prep_mins: 10,
        cook_mins: 20,
        servings: 4,
        tags: [],
        ingredients: [],
      });
      const entry = repo.create({
        plan_date: '2025-01-02',
        slot_name: 'lunch',
        recipe_id: recipe.id,
      });
      expect(entry.recipe).not.toBeNull();
      expect(entry.recipe?.title).toBe('Pasta');
    });
  });

  describe('listForRange', () => {
    it('returns entries within date range', () => {
      repo.create({ plan_date: '2025-01-01', slot_name: 'breakfast' });
      repo.create({ plan_date: '2025-01-03', slot_name: 'lunch' });
      repo.create({ plan_date: '2025-01-07', slot_name: 'dinner' });

      const entries = repo.listForRange('2025-01-01', '2025-01-05');
      expect(entries).toHaveLength(2);
      expect(entries.map((e) => e.plan_date)).toContain('2025-01-01');
      expect(entries.map((e) => e.plan_date)).toContain('2025-01-03');
    });

    it('excludes entries outside range', () => {
      repo.create({ plan_date: '2024-12-31', slot_name: 'dinner' });
      const entries = repo.listForRange('2025-01-01', '2025-01-07');
      expect(entries).toHaveLength(0);
    });
  });

  describe('upsert', () => {
    it('creates entry if none exists for date + slot', () => {
      const entry = repo.upsert({ plan_date: '2025-02-01', slot_name: 'breakfast' });
      expect(entry.id).toBeGreaterThan(0);
    });

    it('replaces existing entry for same date + slot', () => {
      const first = repo.upsert({
        plan_date: '2025-02-01',
        slot_name: 'lunch',
        free_text: 'Sandwich',
      });
      const second = repo.upsert({
        plan_date: '2025-02-01',
        slot_name: 'lunch',
        free_text: 'Salad',
      });
      expect(second.id).toBe(first.id);
      expect(second.free_text).toBe('Salad');
    });

    it('does not create duplicate entries on upsert', () => {
      repo.upsert({ plan_date: '2025-02-01', slot_name: 'dinner' });
      repo.upsert({ plan_date: '2025-02-01', slot_name: 'dinner' });
      const entries = repo.listForRange('2025-02-01', '2025-02-01');
      expect(entries).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('deletes an entry', () => {
      const entry = repo.create({ plan_date: '2025-03-01', slot_name: 'breakfast' });
      expect(repo.delete(entry.id)).toBe(true);
      expect(repo.get(entry.id)).toBeUndefined();
    });
  });
});

// ─── ShoppingItemRepository ─────────────────────────────────────────────────

describe('ShoppingItemRepository', () => {
  let db: Database.Database;
  let repo: ShoppingItemRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new ShoppingItemRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create / list', () => {
    it('creates and lists items', () => {
      repo.create({ name: 'Milk', quantity: 2, unit: 'L', category: 'dairy' });
      repo.create({ name: 'Bread' });
      const items = repo.list();
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.name)).toContain('Milk');
      expect(items.map((i) => i.name)).toContain('Bread');
    });

    it('created item has ticked=0 by default', () => {
      repo.create({ name: 'Eggs' });
      const [item] = repo.list();
      expect(item.ticked).toBe(0);
    });
  });

  describe('update / tick', () => {
    it('ticks an item', () => {
      const item = repo.create({ name: 'Butter' });
      const updated = repo.update(item.id, { ticked: 1 });
      expect(updated?.ticked).toBe(1);
    });

    it('unticks an item', () => {
      const item = repo.create({ name: 'Cheese', ticked: 1 });
      const updated = repo.update(item.id, { ticked: 0 });
      expect(updated?.ticked).toBe(0);
    });

    it('updates name and category', () => {
      const item = repo.create({ name: 'Generic Item' });
      const updated = repo.update(item.id, { name: 'Specific Item', category: 'bakery' });
      expect(updated?.name).toBe('Specific Item');
      expect(updated?.category).toBe('bakery');
    });

    it('returns undefined for missing id', () => {
      expect(repo.update(9999, { ticked: 1 })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes an item', () => {
      const item = repo.create({ name: 'Delete Me' });
      expect(repo.delete(item.id)).toBe(true);
      expect(repo.get(item.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      expect(repo.delete(9999)).toBe(false);
    });
  });

  describe('clearTicked', () => {
    it('removes all ticked items and returns count', () => {
      repo.create({ name: 'Ticked 1', ticked: 1 });
      repo.create({ name: 'Ticked 2', ticked: 1 });
      repo.create({ name: 'Unticked' });

      const count = repo.clearTicked();
      expect(count).toBe(2);

      const remaining = repo.list();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Unticked');
    });

    it('returns 0 when nothing is ticked', () => {
      repo.create({ name: 'Fresh item' });
      expect(repo.clearTicked()).toBe(0);
    });
  });
});

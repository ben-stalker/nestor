# STORY-5.1: Recipes and meal_plan schema + repos

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** `recipes`, `recipe_ingredients`, `meal_plan`, and `shopping_items` tables and repositories
**So that** food features can persist data

---

## Acceptance Criteria

- [ ] Migrations create all four tables per architecture data model
- [ ] Indexes: `idx_meal_plan_date` on `meal_plan(plan_date)`, `idx_recipe_ingredients_recipe` on `recipe_ingredients(recipe_id)`, `idx_shopping_items_ticked` on `shopping_items(ticked)`
- [ ] Repositories with full CRUD + search:
  - `RecipeRepository.search({ query, tags })` returns matching recipes
  - `MealPlanRepository.findInRange(start, end)`
  - `ShoppingItemRepository.list({ ticked })`
- [ ] Tests cover CRUD + search

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_food.sql`
- `server/src/repositories/RecipeRepository.ts`
- `server/src/repositories/RecipeIngredientRepository.ts`
- `server/src/repositories/MealPlanRepository.ts`
- `server/src/repositories/ShoppingItemRepository.ts`
- `server/src/types/food.ts`
- `server/tests/repositories/food/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  photo_path TEXT,
  prep_mins INTEGER, cook_mins INTEGER, servings INTEGER NOT NULL DEFAULT 4,
  calories_per_serving INTEGER,
  method_json TEXT NOT NULL DEFAULT '[]', -- array of step strings
  tags_json TEXT NOT NULL DEFAULT '[]',
  source_url TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  quantity REAL, unit TEXT, ingredient TEXT NOT NULL, note TEXT, sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE TABLE meal_plan (
  id INTEGER PRIMARY KEY,
  plan_date INTEGER NOT NULL, slot TEXT NOT NULL,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  free_text TEXT,
  cooked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_meal_plan_date ON meal_plan(plan_date);
CREATE TABLE shopping_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL, quantity REAL, unit TEXT, category TEXT,
  ticked INTEGER NOT NULL DEFAULT 0,
  pending_approval INTEGER NOT NULL DEFAULT 0,
  added_by_profile_id INTEGER, recipe_id INTEGER, added_at INTEGER NOT NULL
);
CREATE INDEX idx_shopping_items_ticked ON shopping_items(ticked);
```
2. `RecipeRepository.search`:
```ts
search({ query, tags }: { query?: string; tags?: string[] }) {
  let sql = `SELECT * FROM recipes WHERE 1=1`;
  const params: any[] = [];
  if (query) { sql += ` AND title LIKE ?`; params.push(`%${query}%`); }
  if (tags?.length) { sql += ` AND ` + tags.map(_ => `tags_json LIKE ?`).join(' AND '); tags.forEach(t => params.push(`%"${t}"%`)); }
  return this.db.prepare(sql).all(...params);
}
```
3. `MealPlanRepository.findInRange` joins recipes for hydration.
4. Tests with in-memory SQLite.

### Key technical details

- Method/tags stored as JSON for simplicity (no FTS needed for MVP volume).
- Quantity is REAL to allow 0.5 / 1.25 — units are free-form strings; normalisation deferred.
- `pending_approval` flag on shopping_items: set true if added by a Teen profile.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-5.2 (API), STORY-5.3 (URL import), STORY-5.4 (planner), STORY-5.5 (library), STORY-5.6/5.7 (shopping)

---

## Test Checklist

- [ ] Unit: recipe CRUD round-trip
- [ ] Unit: recipe search by title contains
- [ ] Unit: search by tag finds recipe with that tag
- [ ] Unit: ingredients delete cascade with recipe
- [ ] Unit: meal_plan findInRange works across dates
- [ ] Unit: shopping_items list filters by ticked

---

## Notes

- A future SQLite FTS5 index can be added if title search becomes slow — out of scope for MVP.
- Tags stored as JSON of lowercase strings; canonicalise at write time.

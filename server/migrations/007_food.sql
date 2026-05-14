CREATE TABLE IF NOT EXISTS recipes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  prep_mins   INTEGER NOT NULL DEFAULT 0,
  cook_mins   INTEGER NOT NULL DEFAULT 0,
  servings    INTEGER NOT NULL DEFAULT 4,
  calories    INTEGER,
  tags_json   TEXT    NOT NULL DEFAULT '[]',
  photo_path  TEXT,
  source_url  TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  quantity   REAL,
  unit       TEXT,
  ingredient TEXT    NOT NULL,
  notes      TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meal_plan (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_date        TEXT    NOT NULL,  -- ISO date YYYY-MM-DD
  slot_name        TEXT    NOT NULL,
  recipe_id        INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  free_text        TEXT,
  servings_override INTEGER
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  quantity            REAL,
  unit                TEXT,
  category            TEXT,
  ticked              INTEGER NOT NULL DEFAULT 0,
  added_by_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  pending_approval    INTEGER NOT NULL DEFAULT 0,
  created_at          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_date ON meal_plan(plan_date);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_ticked ON shopping_items(ticked);

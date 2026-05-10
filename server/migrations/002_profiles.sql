CREATE TABLE IF NOT EXISTS profiles (
  id                 INTEGER PRIMARY KEY,
  name               TEXT NOT NULL,
  type               TEXT NOT NULL CHECK(type IN ('baby','toddler','child','teen','grandparent','guest','admin')),
  colour             TEXT NOT NULL,
  pin_hash           TEXT,
  avatar_path        TEXT,
  accessibility_json TEXT,
  permissions_json   TEXT NOT NULL,
  text_size          TEXT NOT NULL DEFAULT 'default' CHECK(text_size IN ('small','default','large','xlarge')),
  simplified_nav     INTEGER NOT NULL DEFAULT 0,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);

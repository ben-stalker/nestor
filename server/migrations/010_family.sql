CREATE TABLE chores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  assigned_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','one_off')),
  recurring_rule TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE chore_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL
);

CREATE INDEX idx_chore_completions_profile ON chore_completions(profile_id, completed_at);

CREATE TABLE reward_redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  reward_label TEXT NOT NULL,
  redeemed_at INTEGER NOT NULL
);

CREATE TABLE health_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK(log_type IN (
    'medicine','temperature','symptom','vaccination','growth',
    'feed','nappy','sleep','mood','weight'
  )),
  data_json TEXT NOT NULL,
  logged_at INTEGER NOT NULL
);

CREATE INDEX idx_health_logs_profile ON health_logs(profile_id, logged_at);

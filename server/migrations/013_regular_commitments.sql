CREATE TABLE IF NOT EXISTS regular_commitments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  direction TEXT NOT NULL DEFAULT 'out',
  day_of_month INTEGER,
  category TEXT,
  currency TEXT NOT NULL DEFAULT 'GBP',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_regular_commitments_direction ON regular_commitments(direction);
CREATE INDEX IF NOT EXISTS idx_regular_commitments_active ON regular_commitments(active);

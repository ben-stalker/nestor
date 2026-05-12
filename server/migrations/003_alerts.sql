CREATE TABLE IF NOT EXISTS alerts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT    NOT NULL,
  severity    TEXT    NOT NULL DEFAULT 'info',  -- info | warning | error
  message     TEXT    NOT NULL,
  deep_link   TEXT,                              -- optional client route
  profile_id  INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  dismissed   INTEGER NOT NULL DEFAULT 0,        -- boolean
  dismissed_at INTEGER,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(dismissed, created_at DESC);

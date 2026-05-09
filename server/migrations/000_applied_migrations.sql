CREATE TABLE IF NOT EXISTS applied_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

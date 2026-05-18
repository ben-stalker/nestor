'use strict';
/**
 * Seed the Lighthouse CI SQLite database.
 * Plain CJS so it can run with `node` without tsx/ts-node.
 * Usage: NESTOR_DB_PATH=/tmp/lhci.db node scripts/seed-lhci.cjs
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.NESTOR_DB_PATH || '/tmp/lhci.db';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'server', 'migrations');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const allFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => /^\d{3}_[a-z0-9_]+\.sql$/.test(f))
  .sort();

// Bootstrap migration creates the applied_migrations table
const bootstrapFile = allFiles.find((f) => f.startsWith('000_'));
if (bootstrapFile) {
  db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, bootstrapFile), 'utf8'));
}

const applied = new Set(
  db
    .prepare('SELECT filename FROM applied_migrations')
    .all()
    .map((r) => r.filename),
);

for (const filename of allFiles) {
  if (applied.has(filename)) continue;
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
  db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO applied_migrations (filename, applied_at) VALUES (?, ?)').run(
      filename,
      Date.now(),
    );
  })();
}

// Mark setup complete so the wizard doesn't intercept Lighthouse audit URLs
db.prepare(
  "INSERT OR REPLACE INTO app_settings(key, value, updated_at) VALUES('setup_complete', 'true', ?)",
).run(Date.now());

db.close();
console.log('[seed-lhci] Database seeded at', DB_PATH);

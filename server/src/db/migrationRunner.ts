import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILENAME_RE = /^\d{3}_[a-z0-9_]+\.sql$/;

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

export function runMigrations(db: Database.Database, migrationsDir: string = MIGRATIONS_DIR): void {
  const allFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => {
      if (!MIGRATION_FILENAME_RE.test(f)) {
        // eslint-disable-next-line no-console
        console.warn(`[migrations] Skipping malformed filename: ${f}`);
        return false;
      }
      return true;
    })
    .sort();

  // Bootstrap the tracking table from the lowest-numbered migration so the
  // runner can record all files, including 000 itself.
  const bootstrapFile = allFiles.find((f) => f.startsWith('000_'));
  if (bootstrapFile) {
    const bootstrapSql = fs.readFileSync(path.join(migrationsDir, bootstrapFile), 'utf8');
    db.exec(bootstrapSql);
  }

  const applied = new Set<string>(
    db
      .prepare<[], { filename: string }>('SELECT filename FROM applied_migrations')
      .all()
      .map((r) => r.filename),
  );

  allFiles.forEach((filename) => {
    if (applied.has(filename)) return;

    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');

    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO applied_migrations (filename, applied_at) VALUES (?, ?)').run(
        filename,
        Date.now(),
      );
    })();
  });
}

export default runMigrations;

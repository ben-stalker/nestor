# STORY-1.3: SQLite database wrapper and migration runner

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** a single SQLite connection helper and a numbered-SQL migration runner that runs on startup
**So that** the schema can evolve safely without breaking existing installs

---

## Acceptance Criteria

- [x] `server/src/db/connection.ts` exports a singleton `Database` instance from `better-sqlite3`
- [x] On open, the connection sets `PRAGMA journal_mode=WAL`, `PRAGMA foreign_keys=ON`, `PRAGMA synchronous=NORMAL`
- [x] DB file path defaults to `~/.nestor/nestor.db`; the directory is created if missing
- [x] Path overridable via `NESTOR_DB_PATH` environment variable (used by tests)
- [x] Migration runner reads `server/migrations/*.sql` (numbered `001_*.sql`, `002_*.sql`, ...)
- [x] An `applied_migrations(filename TEXT PRIMARY KEY, applied_at INTEGER)` table tracks which files have been applied
- [x] On startup, any not-yet-applied SQL files run in filename order, each inside its own transaction
- [x] `npm run db:reset` script (defined in `server/package.json`) deletes the DB file (dev-only — refuses if `NODE_ENV=production`)
- [x] Unit tests cover: ordering by numeric prefix, idempotency (re-running applies no new files), failure rolls back the failing migration cleanly

---

## Technical Implementation

### Files to create / modify

- `server/src/db/connection.ts` — singleton SQLite connection + `getDb()`
- `server/src/db/migrationRunner.ts` — discovers, applies, records migrations
- `server/migrations/000_applied_migrations.sql` — bootstraps the `applied_migrations` table
- `server/package.json` — add `db:reset` script
- `server/tests/db/migrationRunner.test.ts` — Jest unit tests
- `server/tests/db/connection.test.ts`

### Implementation steps

1. Install `better-sqlite3` and `@types/better-sqlite3` in the server workspace.
2. In `server/src/db/connection.ts`, export `getDb()` returning a memoised `Database` instance. Resolve path from `process.env.NESTOR_DB_PATH ?? path.join(os.homedir(), '.nestor', 'nestor.db')`. Use `fs.mkdirSync(dir, { recursive: true })` before opening.
3. Apply pragmas immediately after open: `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=NORMAL` (see Architecture §"Database — Configuration").
4. Create `server/migrations/000_applied_migrations.sql` defining `CREATE TABLE IF NOT EXISTS applied_migrations(filename TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);`.
5. In `server/src/db/migrationRunner.ts`, expose `runMigrations(db)`. It must (a) read the migrations directory, (b) sort by filename, (c) `SELECT filename FROM applied_migrations` to find applied set, (d) for each unapplied file: `db.transaction(() => { db.exec(sql); db.prepare('INSERT INTO applied_migrations (filename, applied_at) VALUES (?, ?)').run(filename, Date.now()); })()`.
6. Hook `runMigrations(getDb())` into the server bootstrap path so it runs synchronously before any route is registered (the Express bootstrap arrives in STORY-1.4 and will call this).
7. Add `db:reset` script to `server/package.json`: `"db:reset": "node -e \"if(process.env.NODE_ENV==='production') process.exit(1); require('fs').rmSync(process.env.NESTOR_DB_PATH || require('path').join(require('os').homedir(),'.nestor','nestor.db'),{force:true})\""`.
8. Write Jest tests using an in-memory `:memory:` SQLite (or temp file): assert ordering, idempotency, transaction rollback on bad SQL.

### Key technical details

- Architecture §"Database Design": migrations are append-only — never edit a previously-released migration.
- Use `better-sqlite3` (synchronous) — Architecture §Backend rationale ("simpler than async for a single-device app").
- The `applied_migrations` table itself is created by the lowest-numbered migration `000_applied_migrations.sql`, applied via `IF NOT EXISTS` so the runner is bootstrappable on a fresh DB.
- Migration filenames must match `/^\d{3}_[a-z0-9_]+\.sql$/` — enforce in the runner with a warning for malformed names.
- Tests should use a fresh temp file path per test (`os.tmpdir() + '/' + crypto.randomUUID() + '.db'`) and clean up in `afterEach`.

---

## Dependencies

- **Blocked by:** STORY-1.1
- **Blocks:** STORY-1.4, STORY-1.5, all schema migrations downstream

---

## Test Checklist

- [x] Unit: empty DB + 3 migrations → all 3 applied in numeric order
- [x] Unit: re-run with same files → 0 new applications
- [x] Unit: bad SQL in migration 002 → 001 stays applied, 002 not recorded, error thrown
- [x] Unit: `journal_mode` pragma reports `wal` after open
- [x] Unit: `foreign_keys` pragma reports `1`
- [ ] Manual: delete `~/.nestor/nestor.db`, restart server, DB recreated and `applied_migrations` populated

## Completion Notes

Completed 2026-05-09. All 8 unit tests pass (2 suites: connection + migrationRunner).
Files delivered: `server/src/db/connection.ts`, `server/src/db/migrationRunner.ts`,
`server/migrations/000_applied_migrations.sql`, `server/tests/db/connection.test.ts`,
`server/tests/db/migrationRunner.test.ts`, `server/tsconfig.test.json`.
`db:reset` script added to `server/package.json`. ESLint config updated with
`tsconfigRootDir` and test tsconfig so lint covers test files.

---

## Notes

- WAL mode is critical for NFR-002 (24/7 reliability) — survives unclean shutdown without corruption.
- Future migrations (profiles, calendar_events, etc.) all land via this runner.
- Architecture §"Backup" notes single-file backup (`cp nestor.db backup.db`) — works because of WAL checkpoint; document in STORY-19.9.

# STORY-1.5: Repository pattern base + app_settings repository

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a base repository class and an `app_settings` repository with in-memory cache
**So that** all feature work has a consistent persistence pattern

---

## Acceptance Criteria

- [ ] Migration `server/migrations/001_app_settings.sql` creates `app_settings(key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER NOT NULL)`
- [ ] `server/src/repositories/BaseRepository.ts` is an abstract class holding a `Database` reference and exposing protected helpers `get<T>(sql, params)`, `all<T>(sql, params)`, `run(sql, params)`
- [ ] `AppSettingsRepository` extends `BaseRepository` and exposes `getAll(): Record<string, unknown>`, `get<T>(key: string): T | undefined`, `set(key, value)`, `setMany(map)`, `delete(key)`
- [ ] Settings are JSON-serialised on write and parsed on read
- [ ] An in-memory cache is populated on first `getAll()` and invalidated on every write
- [ ] Type safety: `server/src/db/settings-keys.ts` declares Zod schemas for each known key (e.g. `location`, `orientation`, `enabled_nav_modes`, `meal_slots`, `quiet_hours`, `kiosk_lock`, `setup_complete`, `encryption_salt`, `language`, `locale`, `voice_internal_token`, `update_available_version`, `reminder_windows`, `fuel_rates`, `community_plugin_index_url`, `vehicle_reminder_days`, `vaccination_schedule_region`, `nav_layout`, `plugins_enabled`)
- [ ] Strict typed accessor: `appSettings.get<typeof LocationSchema>('location')` returns the parsed type
- [ ] Unit tests cover get/set, batch setMany, cache hit/miss, cache invalidation, JSON round-trip, unknown-key warning

---

## Technical Implementation

### Files to create / modify

- `server/migrations/001_app_settings.sql`
- `server/src/repositories/BaseRepository.ts`
- `server/src/repositories/AppSettingsRepository.ts`
- `server/src/db/settings-keys.ts` — Zod schemas + KnownKey union
- `server/tests/repositories/AppSettingsRepository.test.ts`

### Implementation steps

1. Author the migration: `CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);`.
2. Install `zod` in the server workspace.
3. Define `BaseRepository` with constructor `(db: Database)` storing the connection. Protected helpers wrap `db.prepare(sql).get(...)`, `.all(...)`, `.run(...)`.
4. Implement `AppSettingsRepository`:
   - `getAll()` — checks `this.cache`; if null, runs `SELECT key, value FROM app_settings`, parses each `value` with `JSON.parse`, populates `this.cache: Record<string, unknown>`, returns it.
   - `get<T>(key)` — calls `getAll()` then returns `cache[key] as T | undefined`.
   - `set(key, value)` — `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at` with `JSON.stringify(value)`. Then `this.cache = null` (invalidate).
   - `setMany(map)` — wraps `set` calls in a `db.transaction(() => …)()` for atomicity.
   - `delete(key)` — `DELETE FROM app_settings WHERE key = ?`; invalidate cache.
5. In `settings-keys.ts`, define Zod schemas per key (use Architecture §"Data Model" for known keys plus the list in AC). Export a `KnownSettingKey` union of literal strings and a `validateSetting(key, value)` helper used optionally on `set()`.
6. Emit a `settings:updated` event on the event bus (STORY-1.9) on every write — but only after STORY-1.9 lands; for now leave a TODO comment.
7. Author Jest tests using a fresh in-memory SQLite per test, applying migration 001, then exercising every method.

### Key technical details

- Architecture §"Component 8: Data Layer" defines the repository pattern; §"Caching Strategy" specifies "loaded once on startup, cached in memory, invalidated on write".
- Cache invalidation strategy: simple null-out then re-populate on next `getAll()`. Acceptable because settings are read often, written rarely.
- `value` column is TEXT — every value is JSON-serialised, even strings, for consistency. Tests must verify that `set('foo', 'bar')` then `get('foo')` returns the string `'bar'`, not `'"bar"'`.
- Foreign keys are not relevant here (single table).
- Treat unknown keys with a `logger.warn({ key }, 'Unknown app_settings key written')` but do NOT block writes — plugins set their own keys via STORY-16.4's `plugin_settings` table, but core may add new keys before they're declared in `settings-keys.ts`.

---

## Dependencies

- **Blocked by:** STORY-1.3
- **Blocks:** STORY-1.8, STORY-2.1, STORY-3.1, almost every domain repository

---

## Test Checklist

- [ ] Unit: `set('foo', { a: 1 })` → `get('foo')` returns `{ a: 1 }` (object identity not preserved, equality yes)
- [ ] Unit: `setMany({ a: 1, b: 2 })` writes both atomically — failing one rolls back both
- [ ] Unit: cache: 1st `getAll()` reads from DB, 2nd reads from cache; verify by spying on the prepared statement
- [ ] Unit: any `set()`/`setMany()`/`delete()` invalidates the cache
- [ ] Unit: Zod-validated key with bad value via `validateSetting` throws
- [ ] Unit: round-trip primitives: string, number, boolean, array, nested object

---

## Notes

- Many downstream stories declare new known settings keys; they should add to `settings-keys.ts` in their PR rather than spreading the definition.
- The encryption helper (STORY-1.8) reads `encryption_salt` from this repository and writes it on first call if missing.

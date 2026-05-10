# STORY-2.1: Profiles schema and repository

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** the `profiles` table and a repository for all profile CRUD
**So that** every other module can scope data by profile

---

## Acceptance Criteria

- [x] Migration `server/migrations/002_profiles.sql` creates the `profiles` table with columns from Architecture §"Data Model": `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL`, `type TEXT NOT NULL CHECK(type IN ('baby','toddler','child','teen','grandparent','guest','admin'))`, `colour TEXT NOT NULL`, `pin_hash TEXT`, `avatar_path TEXT`, `accessibility_json TEXT`, `permissions_json TEXT NOT NULL`, `text_size TEXT NOT NULL DEFAULT 'default' CHECK(text_size IN ('small','default','large','xlarge'))`, `simplified_nav INTEGER NOT NULL DEFAULT 0`, `created_at INTEGER NOT NULL`
- [x] `ProfileRepository` extends `BaseRepository` and implements `list()`, `get(id)`, `create(input)`, `update(id, patch)`, `delete(id)`, `verifyPin(id, pin)`
- [x] PIN hashing uses `bcrypt` with cost factor 10
- [x] `verifyPin` returns `boolean` (true if PIN matches; false otherwise; false if profile has no `pin_hash`)
- [x] Validation via Zod: `colour` matches `/^#[0-9A-Fa-f]{6}$/`, `name` non-empty, `type` is the union enum, `text_size` is the enum
- [x] `list()` and `get()` strip `pin_hash` from the returned object
- [x] Cannot delete the last admin (repository throws `LastAdminError`)
- [x] Unit tests cover all methods + last-admin protection + PIN verify happy/sad paths

---

## Technical Implementation

### Files to create / modify

- `server/migrations/002_profiles.sql`
- `server/src/repositories/ProfileRepository.ts`
- `server/src/types/profile.ts` — `Profile`, `ProfileInput`, `ProfileType` types + Zod schemas
- `server/src/types/permissions.ts` — placeholder (full permission keys land in STORY-2.3)
- `server/tests/repositories/ProfileRepository.test.ts`

### Implementation steps

1. Install `bcrypt` and `@types/bcrypt`.
2. Author migration with the exact schema above and an index `CREATE INDEX idx_profiles_type ON profiles(type);`.
3. Define `Profile` type and Zod schema in `server/src/types/profile.ts`. Export `ProfileType = 'baby' | 'toddler' | … | 'admin'`. Permissions are `Record<string, boolean>` stored as JSON.
4. Implement `ProfileRepository`:
   - `list(): Profile[]` — `SELECT id, name, type, colour, avatar_path, accessibility_json, permissions_json, text_size, simplified_nav, created_at FROM profiles ORDER BY id` (NO pin_hash). Parse JSON columns; return typed array.
   - `get(id): Profile | undefined` — same with `WHERE id = ?`.
   - `create(input)`: validate with Zod; if `input.pin` provided, `bcrypt.hashSync(input.pin, 10)`; insert. Return new profile (no PIN hash).
   - `update(id, patch)`: validate; if `patch.pin` provided, hash; build dynamic SET clause; throw if profile not found.
   - `delete(id)`: count admins via `SELECT COUNT(*) FROM profiles WHERE type='admin' AND id != ?`; if zero AND target is admin, throw `LastAdminError`. Otherwise `DELETE FROM profiles WHERE id = ?`.
   - `verifyPin(id, pin)`: `SELECT pin_hash FROM profiles WHERE id = ?`; if no hash, return false; else `bcrypt.compareSync(pin, hash)`.
5. Author Jest tests with fresh in-memory SQLite + applied migrations.

### Key technical details

- Architecture §"Data Model" defines the schema verbatim; do not deviate.
- `permissions_json` defaults are computed in STORY-2.4 based on profile type — for now `create` requires `permissions` in input; if missing, store `'{}'`.
- `accessibility_json` is free-form JSON for per-profile a11y tweaks (font, colour-blind palette, etc.).
- `bcrypt` cost 10 per Architecture §"Authentication" — non-negotiable for passwords.
- `LastAdminError extends Error` with `code: 'LAST_ADMIN'` so the error middleware (STORY-1.4) can map it to a 400.
- All timestamps as integer epoch ms.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-2.2, STORY-2.3, STORY-2.4, every domain repository that scopes by profile

---

## Test Checklist

- [x] Unit: `create` with valid input returns profile without `pin_hash`
- [x] Unit: `verifyPin` returns true on correct PIN, false on incorrect, false when no PIN set
- [x] Unit: `update` patches only provided fields
- [x] Unit: `delete` succeeds for non-last admin
- [x] Unit: `delete` throws `LastAdminError` for the last admin
- [x] Unit: invalid `colour` (not hex) throws Zod validation error
- [x] Unit: invalid `type` throws
- [x] Unit: `list()` returns multiple profiles ordered by id

---

## Notes

- Avatars stored as filesystem paths to `~/.nestor/uploads/avatars/`; upload endpoint lands in STORY-17.2.
- Profile-type permission DEFAULTS arrive in STORY-2.4; this story doesn't auto-fill them.

## Post-implementation

- `BaseRepository.get<T>` renamed to `queryOne<T>` to allow `ProfileRepository.get(id: number)` as a domain method without TypeScript override conflict.
- All internal single-row queries in `ProfileRepository` (`get`, `delete`, `verifyPin`) use `this.queryOne()` consistently — no direct `this.db.prepare().get()` calls in subclass code.
- `LastAdminError` lives in `server/src/errors/profile.ts` (default export) and is re-exported from `ProfileRepository` for consumer convenience.

# STORY-2.3: Profile and admin-PIN middleware

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** developer
**I want** Express middleware that resolves the active profile and gates admin operations
**So that** every protected endpoint can rely on `req.profile`

---

## Acceptance Criteria

- [x] `requireProfile` middleware reads `X-Profile-Id` header, looks up the profile, attaches `req.profile`; returns 401 if missing or invalid
- [x] `requirePermission(permKey: PermissionKey)` middleware checks `req.profile.permissions[permKey] === true`; returns 403 with `{ code: 'PERMISSION_DENIED', details: { required: permKey } }` if missing
- [x] `requireAdminPin` middleware reads `X-Admin-Pin` header, finds an admin profile, bcrypt-compares against its `pin_hash`; returns 403 if invalid; succeeds for any admin's PIN
- [x] `server/src/middleware/permissions.ts` declares the full permission key catalogue (≈25 keys derived from PRD §5 Profile Permission Matrix): `view_calendar`, `add_calendar_event`, `edit_calendar_event`, `delete_calendar_event`, `view_food`, `add_recipe`, `add_to_shopping`, `tick_shopping`, `clear_shopping`, `view_vehicles`, `book_vehicle`, `manage_vehicles`, `view_chores`, `complete_chore`, `manage_chores`, `view_health_log`, `add_health_log`, `view_finance`, `manage_finance`, `view_house`, `manage_house`, `view_pets`, `manage_pets`, `view_board`, `post_board_message`, `view_contacts`, `manage_contacts`, `manage_settings`, `manage_plugins`
- [x] All middlewares export TypeScript types augmenting `Express.Request` with `profile?: Profile`
- [x] Unit/integration tests cover each middleware in isolation via Supertest stubs

---

## Technical Implementation

### Files to create / modify

- `server/src/middleware/requireProfile.ts`
- `server/src/middleware/requirePermission.ts`
- `server/src/middleware/requireAdminPin.ts`
- `server/src/middleware/permissions.ts` — exports `PermissionKey` union type and `ALL_PERMISSIONS` array
- `server/src/types/express.d.ts` — module augmentation for `Express.Request.profile`
- `server/src/routes/profiles.ts` — replace the placeholder admin-PIN middleware from STORY-2.2 with the real one
- `server/tests/middleware/*.test.ts`

### Implementation steps

1. `server/src/middleware/permissions.ts`: declare the full catalogue as a const string union and export `ALL_PERMISSIONS` and `type PermissionKey = typeof ALL_PERMISSIONS[number]`.
2. `server/src/types/express.d.ts`:
```ts
declare global {
  namespace Express {
    interface Request {
      profile?: Profile;
    }
  }
}
export {};
```
3. `requireProfile`: read `req.headers['x-profile-id']`; coerce to number; `repo.get(id)`; if missing → `res.status(401).json({ error: 'Unknown profile', code: 'UNKNOWN_PROFILE' })`; else attach to `req.profile`, call `next()`.
4. `requirePermission(permKey)`:
```ts
return (req, res, next) => {
  if (!req.profile) return res.status(401).json({ error: 'No profile', code: 'NO_PROFILE' });
  const perms = req.profile.permissions ?? {};
  if (perms[permKey] !== true) return res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED', details: { required: permKey } });
  next();
};
```
5. `requireAdminPin`: read `X-Admin-Pin`; iterate `repo.list()` filtered to admins, compare via `bcrypt.compareSync(pin, profile.pin_hash)`; succeed on first match. If no match → 403 `{ code: 'INVALID_ADMIN_PIN' }`. Cache admin pin hashes in memory (15s TTL) to avoid repeated bcrypts under burst.
6. Update `server/src/routes/profiles.ts` to use the real `requireAdminPin`.
7. Author tests using Supertest with a small Express app that wires only the middleware under test.

### Key technical details

- Architecture §"Authentication & Authorization" defines the header-based auth.
- The permission catalogue derives from PRD §5 Profile Permission Matrix. Each key represents a single capability and maps to a checkbox in the admin Profiles panel (STORY-17.2).
- `requireAdminPin` succeeds if ANY admin's PIN matches — it's a household-shared admin secret, not per-user. PRD §5 calls this out explicitly.
- bcrypt compare is intentionally slow (~100ms at cost 10) — the 15s in-memory cache keeps the admin UI responsive without weakening security materially.
- Header names in Express are lowercased (`req.headers['x-profile-id']`) — never rely on capitalisation.
- All admin-tier domain routes (calendar admin actions, plugin enable/disable, settings writes) chain `requireProfile + requireAdminPin` (or `requireProfile + requirePermission('manage_xyz')`).

---

## Dependencies

- **Blocked by:** STORY-2.2
- **Blocks:** STORY-2.4, every protected endpoint in modules

---

## Test Checklist

- [x] Unit: missing `X-Profile-Id` → 401 `UNKNOWN_PROFILE`
- [x] Unit: invalid profile ID → 401
- [x] Unit: valid profile attaches `req.profile`
- [x] Unit: `requirePermission('add_recipe')` denies child profile, allows admin
- [x] Unit: `requireAdminPin` accepts valid PIN, rejects wrong PIN
- [x] Unit: `requireAdminPin` rejects when no admin profiles exist
- [x] Unit: bcrypt cache reuses the hash within 15s window (verify via spy on `listAdminPinHashes` call count)

---

## Notes

- The `manage_settings` and `manage_plugins` keys generally co-require `requireAdminPin` AND the permission — admin acts as a second factor.
- Permission defaults per profile type land in STORY-2.4; this story does not auto-populate them.

---

## Implementation Notes

**Completed:** 2026-05-10

- Created `server/src/middleware/permissions.ts` — 29 `PermissionKey` constants as `as const` array
- Created `server/src/types/express.d.ts` — module augmentation for `Express.Request.profile?: Profile`
- Created `createRequireProfile` (default export) — reads `X-Profile-Id`, coerces to int, returns 401 on invalid/missing
- Created `requirePermission(permKey)` (default export) — returns 401 if no profile, 403 with `PERMISSION_DENIED` if key not `true`
- Created `createRequireAdminPin` (default export) — reads `X-Admin-Pin`, 15s cache of admin pin hashes via `repo.listAdminPinHashes()`, bcrypt compares all admin hashes
- Added `listAdminPinHashes()` to `ProfileRepository` — returns `{ id, pin_hash }[]` for admin profiles
- Replaced placeholder `requireAdminPin` stub in `profiles.ts` with real `createRequireAdminPin(repo)` default
- Updated `profiles.ts` route factory to accept injected `adminPinMiddleware` param (default = real middleware)
- 20 new tests (163 server total, was 143). lint + typecheck clean. Next: STORY-2.4.

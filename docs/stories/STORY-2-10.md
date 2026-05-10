# STORY-2.10: Kiosk-child mode

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** parent
**I want** to lock the screen into a child's view, requiring an admin PIN to exit
**So that** my 5-year-old can use the screen alone without breaking anything

---

## Acceptance Criteria

- [x] `app_settings.kiosk_lock` set with the locked profile ID
- [x] When set, profile switcher disabled, admin routes return 403, only child-permitted nav modes visible
- [x] Long-press hidden corner triple-tap → admin PIN prompt → unlock
- [x] Visual indicator (small icon) that the screen is locked

---

## Technical Implementation

### Files created

- `server/src/middleware/kioskLock.ts` — blocks admin routes (403 KIOSK_LOCKED) when `kiosk_lock` is set
- `server/src/routes/admin.ts` — `POST /api/v1/admin/kiosk-lock` (activate) + `POST /api/v1/admin/kiosk-unlock` (verify admin PIN + clear); both exempt from kiosk middleware
- `client/src/core/KioskOverlay.tsx` — lock icon + hidden bottom-right triple-tap target + `AdminPinPrompt` (verifies via `/api/v1/admin/kiosk-unlock`, invalidates settings on success)
- `client/src/api/admin.ts` — `activateKioskLock()` + `unlockKiosk()` API calls

### Files modified

- `server/src/db/settings-keys.ts` — `KioskLockSchema` changed from `z.boolean()` to `z.string().nullable()` (stores profile ID)
- `server/src/routes/profiles.ts` — `adminPinMiddleware` param now accepts `RequestHandler | RequestHandler[]`; normalised to array with spread
- `server/src/app.ts` — wires `kioskLock` + `requireAdminPin` as a chain on profiles write routes; mounts admin router at `/api/v1/admin`
- `client/src/core/hooks/useAppSettings.ts` — adds `kiosk_lock?: string | null` to `AppSettings`
- `client/src/core/navModes.ts` — adds `NAV_MODE_PERMISSION` map (nav mode id → permission key)
- `client/src/core/NavBar.tsx` — fetches locked profile permissions; filters visible modes in kiosk mode
- `client/src/core/AvatarStrip.tsx` — applies `avatar-strip--locked` class + `aria-disabled` when kiosk is active
- `client/src/core/AppShell.tsx` — renders `<KioskOverlay />`
- `client/src/index.css` — kiosk indicator + tap target CSS + `avatar-strip--locked` class

### Tests created

- `server/tests/middleware/kioskLock.test.ts` — 5 tests: allows when unset/null, blocks when set, message content, clears on delete
- `server/tests/routes/admin.test.ts` — 11 tests: activate (sets value, validation, overwrite), unlock (wrong PIN, correct PIN, multi-admin, validation), escape-hatch bypass
- `client/tests/core/KioskOverlay.test.tsx` — 12 tests: hidden when unlocked, lock indicator visible, triple-tap trigger, PIN entry, success/error/rate-limit flows
- `client/tests/core/AvatarStrip.test.tsx` — 3 kiosk tests added: locked class, aria-disabled, unlocked state
- `client/tests/core/NavBar.test.tsx` — 3 kiosk tests added: permission filtering, loading state (hide gated modes), null kiosk lock shows all

---

## Implementation Notes

- `kiosk_lock` stores the locked profile ID as a string (or null/absent when inactive).
- The activate and unlock admin routes bypass the `kioskLock` middleware intentionally — they are the escape hatch.
- Triple-tap detection: 3 clicks on the hidden corner button within 800ms opens the admin PIN prompt.
- NavBar permission filtering: `NAV_MODE_PERMISSION` maps each nav mode to its `view_*` permission key; `home` has no entry (always visible). Modes are hidden until permissions load in kiosk mode.
- `AdminPinPrompt` in `KioskOverlay` is a self-contained PIN keypad — same UX as `PinPrompt` but verifies against any admin profile via the unlock endpoint.

---

## Dependencies

- **Blocked by:** STORY-2.8 ✓

---

## Test Results

- Server: 199 tests passing (+14 new)
- Client: 161 tests passing (+17 new)
- Total: 360 tests, all green
- Lint: clean
- Typecheck: clean

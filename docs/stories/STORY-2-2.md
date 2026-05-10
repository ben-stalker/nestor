# STORY-2.2: Profile API endpoints with rate-limited PIN verification

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** developer
**I want** REST endpoints for profile CRUD and PIN verification
**So that** the React app can manage profiles

---

## Acceptance Criteria

- [x] `GET /api/v1/profiles` — returns list of profiles (no `pin_hash`)
- [x] `POST /api/v1/profiles` — creates a profile (admin PIN required)
- [x] `PATCH /api/v1/profiles/:id` — updates a profile (admin PIN required)
- [x] `DELETE /api/v1/profiles/:id` — deletes a profile (admin PIN required); cannot delete the last admin (returns 400 with `code: LAST_ADMIN`)
- [x] `POST /api/v1/profiles/:id/verify-pin` — accepts `{ pin }`; returns `{ valid: boolean }`; rate-limited to 5 requests per 15 minutes per IP
- [x] `GET /api/v1/profiles/:id/permissions` — returns the parsed `permissions_json` object
- [x] All inputs validated by Zod
- [x] All endpoints return JSON; errors follow `{ error, code, details? }`
- [x] Integration tests cover happy paths, permission denials, last-admin protection, and rate-limiting

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/profiles.ts`
- `server/src/middleware/rateLimit.ts` — wrappers around `express-rate-limit`
- `server/src/app.ts` — mount the route under `/api/v1/profiles`
- `server/tests/routes/profiles.test.ts`

### Implementation steps

1. Install `express-rate-limit`.
2. `server/src/middleware/rateLimit.ts`: export `pinVerifyLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many PIN attempts', code: 'RATE_LIMITED' } })`.
3. `server/src/routes/profiles.ts`:
   - `GET /` → `repo.list()`.
   - `POST /` → admin-PIN middleware (lands in STORY-2.3; for this story stub it as `requireAdminPin = (req, res, next) => next()` and add a TODO; tests will mock).
   - `PATCH /:id` → admin-PIN.
   - `DELETE /:id` → admin-PIN; catch `LastAdminError` → 400.
   - `POST /:id/verify-pin` → `pinVerifyLimiter`; body Zod `{ pin: z.string().min(1) }`; return `{ valid: repo.verifyPin(id, pin) }`.
   - `GET /:id/permissions` → returns parsed `permissions_json`.
4. Mount in `server/src/app.ts` after the body parser middleware.
5. Author Supertest tests covering each endpoint:
   - 200 happy paths.
   - 400 invalid input (missing fields, bad colour).
   - 400 last-admin delete.
   - 429 after 6 PIN attempts within 15 minutes (use `request.agent` from `supertest` and a spy on the limiter, or use the `keyGenerator` to inject the IP).

### Key technical details

- Architecture §"Authentication & Authorization": no JWTs; admin operations gated by `X-Admin-Pin`. The full middleware lands in STORY-2.3; this story can use a placeholder `requireAdminPin` that calls `next()` — STORY-2.3's real implementation replaces it before merge of dependent stories.
- `pin_hash` MUST never appear in any response — verified by tests using `expect(body).not.toHaveProperty('pin_hash')`.
- Architecture §"Security Best Practices": rate-limit on PIN verify is mandatory.
- All endpoint inputs validated with Zod; the validation result is the typed body.

---

## Dependencies

- **Blocked by:** STORY-2.1
- **Blocks:** STORY-2.3 (full middleware), STORY-2.8 (profile switcher)

---

## Test Checklist

- [x] Integration: `GET /api/v1/profiles` returns array, no `pin_hash`
- [x] Integration: `POST /api/v1/profiles` with valid body creates profile, returns 201
- [x] Integration: `POST` with invalid colour returns 400 with details
- [x] Integration: `PATCH /api/v1/profiles/:id` updates fields
- [x] Integration: `DELETE` last admin returns 400 with `code: LAST_ADMIN`
- [x] Integration: `POST /api/v1/profiles/:id/verify-pin` with correct PIN returns `{ valid: true }`
- [x] Integration: with incorrect PIN returns `{ valid: false }`
- [x] Integration: 6th attempt within 15 min returns 429
- [x] Integration: `GET /api/v1/profiles/:id/permissions` returns parsed permissions object

---

## Notes

- Admin-PIN middleware is stubbed in this story; replaced fully in STORY-2.3. Wire the real middleware before STORY-2.4 lands.
- Rate-limiter key defaults to IP address — fine for LAN; document that on Tailscale all requests come from the same Tailscale IP per device.

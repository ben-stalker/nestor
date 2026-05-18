# STORY-20.2: Supertest API integration test harness

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** developer
**I want** a test harness that boots Express against in-memory SQLite
**So that** I can write end-to-end API tests

---

## Acceptance Criteria

- [ ] `server/tests/helpers/app.ts` boots app with isolated DB
- [ ] Auth helpers: `asAdmin()`, `asProfile(id)`, `withAdminPin()`
- [ ] Tests for at least one endpoint per major module already pass
- [ ] Each test gets a fresh DB (no cross-test pollution)
- [ ] Helper for seeding common fixtures (one admin, one child, one event)

---

## Technical Implementation

### Files to create / modify

- `server/tests/helpers/app.ts`
- `server/tests/helpers/auth.ts`
- `server/tests/helpers/fixtures.ts`
- `server/tests/integration/*.test.ts` — at least one per module

### Implementation steps

1. Harness:
```ts
export async function bootTestApp() {
  process.env.NESTOR_DB_PATH = ':memory:';
  const { app } = await import('../../src/index'); // factory style
  await runMigrations();
  return { app, request: supertest(app) };
}
export async function teardownTestApp() { /* close DB */ }
```
2. Refactor `server/src/index.ts` to a factory `createApp({ db })` if not already, so each test gets a fresh DB.
3. Auth helpers:
```ts
export function asAdmin(req) { return req.set('X-Profile-Id', String(adminProfile.id)); }
export function withAdminPin(req, pin = '0000') { return req.set('X-Admin-Pin', pin); }
```
4. Fixtures:
```ts
export async function seedBasic() {
  const admin = await profileRepo.create({ name: 'Admin', type: 'admin', colour: '#000', pin_hash: bcrypt.hashSync('0000', 10) });
  const child = await profileRepo.create({ name: 'Kid', type: 'child', colour: '#abc' });
  return { admin, child };
}
```
5. Per-module integration tests cover one happy-path endpoint (calendar, food, vehicles, family, house, finance, pets, board, contacts, EV, alerts).
6. Tests run via `npm test` from STORY-20.1.

### Key technical details

- App factory pattern is essential — global Express singleton means tests pollute each other.
- `:memory:` SQLite is fast and isolated.
- `supertest` directly invokes Express handlers without a real network port.
- Migrations run on every test app boot.

---

## Dependencies

- **Blocked by:** STORY-20.1, STORY-1.4
- **Blocks:** STORY-20.4 (E2E uses similar harness conceptually)

---

## Test Checklist

- [ ] Unit: harness boots app
- [ ] Unit: each module has at least one passing integration test
- [ ] Unit: tests don't cross-pollute (fresh DB per test)
- [ ] Manual: full suite < 30s

---

## Notes

- The harness should be importable from any test file.
- Consider `vitest` later for parallelisation; not urgent.

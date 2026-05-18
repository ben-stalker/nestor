# STORY-20.1: Jest unit-test infrastructure

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 1 — Foundations
**Estimate:** S (1d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** developer
**I want** Jest configured for both server and client with shared config
**So that** unit tests run consistently

---

## Acceptance Criteria

- [ ] `jest.config.base.ts` at repo root defines shared options (transform, coverage, testEnvironment switch)
- [ ] `server/jest.config.ts` extends base; uses `ts-jest` and an in-memory SQLite via `@databases/sqlite-test` (or `better-sqlite3` with `:memory:`)
- [ ] `client/jest.config.ts` extends base; uses `jest-environment-jsdom` plus `@testing-library/jest-dom`
- [ ] `npm test` at root runs both packages' tests
- [ ] Coverage thresholds enforced: 80% on `server/src/services/**` and `server/src/repositories/**`
- [ ] Coverage report uploaded as a CI artefact in `ci.yml` (from STORY-1.2)
- [ ] At least one passing dummy test per package proves the harness works

---

## Technical Implementation

### Files to create / modify

- `jest.config.base.ts`
- `server/jest.config.ts`
- `client/jest.config.ts`
- `server/tests/setup.ts` — sets `NESTOR_DB_PATH=:memory:`, silences Pino in tests
- `client/tests/setup.ts` — extends jest-dom matchers, mocks `matchMedia`, `IntersectionObserver`
- Root `package.json` — `"test": "npm run test --workspaces --if-present"`

### Implementation steps

1. Install dev deps at root: `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
2. Author `jest.config.base.ts` with common transforms, `moduleFileExtensions`, coverage formatters (`text-summary`, `lcov`).
3. Author server config: `testEnvironment: 'node'`, `setupFiles: ['./tests/setup.ts']`, `testMatch: ['**/tests/**/*.test.ts']`, `coverageThreshold` for services/repos.
4. Author client config: `testEnvironment: 'jsdom'`, `setupFilesAfterEach: ['./tests/setup.ts']`, alias `@/` → `client/src/` via `moduleNameMapper`.
5. Add a placeholder test to each (`tests/smoke.test.ts`) that asserts `1 + 1 === 2`.
6. Wire `npm test` at root to run via npm workspaces.
7. Verify CI from STORY-1.2 picks up `npm test` and that thresholds report.

### Key technical details

- Use `ts-jest` preset rather than Babel so type errors surface in tests.
- Tests must never touch the real filesystem DB — `NESTOR_DB_PATH=:memory:` redirects in test setup.
- Pino logging silenced via `pino` test transport (`level: 'silent'`) so test output is clean.
- Coverage thresholds intentionally only apply to services/repos for MVP — UI components are exercised by Playwright (STORY-20.4) where tests are fewer but flow-rich.
- `@databases/sqlite-test` or `better-sqlite3(":memory:")` — pick the latter for fewer deps; both work.

---

## Dependencies

- **Blocked by:** STORY-1.1
- **Blocks:** STORY-20.2 (Supertest harness), STORY-20.3 (RTL tests), every story whose AC includes "unit tests"

---

## Test Checklist

- [ ] Unit: smoke test passes in server package
- [ ] Unit: smoke test passes in client package
- [ ] Manual: `npm test` at root runs both
- [ ] Manual: introducing a coverage drop in a service file fails CI
- [ ] Manual: tests run in <5s on the smoke suite

---

## Notes

- The `coverageThreshold` is only on services/repositories — UI/component coverage is a stretch goal once Playwright (20.4) and RTL smoke tests (20.3) settle.
- Consider `vitest` later for client tests (faster) — out of scope for MVP; we standardise on Jest for both.

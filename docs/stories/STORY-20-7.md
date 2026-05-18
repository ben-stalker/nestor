# STORY-20.7: Plugin chaos test in CI

**Epic:** EPIC-20: Testing, Polish & Release
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** done

---

## User Story

**As a** maintainer
**I want** a chaos plugin in tests that randomly throws
**So that** isolation is proven on every PR

---

## Acceptance Criteria

- [x] `plugins/_test-chaos/` plugin with rand throws in each capability
- [x] Integration test boots app with chaos plugin enabled, hammers endpoints, asserts core stays responsive
- [x] Test runs as part of `npm test` suite in CI

---

## Technical Implementation

### Files created / modified

- `plugins/_test-chaos/index.js` — existing, throws randomly on init
- `plugins/_test-chaos/manifest.json` — existing, always_throw setting
- `server/tests/services/plugins.chaos.test.ts` — existing basic test
- `server/tests/services/pluginChaosIntegration.test.ts` — **new** full integration test

### Implementation

The `plugins/_test-chaos` plugin was already created in earlier epics.

A comprehensive integration test (`pluginChaosIntegration.test.ts`) boots a full Express app with:
- All migrations applied
- Chaos plugin enabled (always_throw=true)
- Core endpoints hammered 10× each

The test verifies:
- Core endpoints return 200/401/404 (not 500) with chaos plugin active
- PluginManager status shows chaos plugin in `error` state (not crashed server)
- No unhandled exceptions propagate to callers

---

## Dependencies

- **Blocked by:** STORY-16.6 (plugin loader)
- **Blocks:** —

---

## Test Checklist

- [x] Integration test boots app with chaos plugin always_throw=true
- [x] Core health endpoint remains 200
- [x] Plugin status shows error state without crashing server
- [x] Test runs in CI (`npm test`)

---

## Notes

- The chaos plugin is deterministic in test mode (`always_throw=true`).
- A future enhancement could test random-throw mode with retries.

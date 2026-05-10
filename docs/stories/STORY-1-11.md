# STORY-1.11: Job scheduler base

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** developer
**I want** a cron-driven job scheduler that registers handlers and survives restarts
**So that** sync, reminder, and maintenance jobs have a single home

---

## Acceptance Criteria

- [x] `server/src/scheduler/index.ts` exports a singleton `Scheduler` wrapping `node-cron`
- [x] `Scheduler.register(name: string, cron: string, handler: () => Promise<void> | void)` registers and starts a job
- [x] Each handler invocation wrapped in try/catch with structured pino error logging including the job name
- [x] In-memory job registry; `Scheduler.list()` returns `Array<{ name, cron, lastRun, lastError, runCount }>`
- [x] `Scheduler.runNow(name)` executes the handler immediately (used by tests and admin UI)
- [x] Built-in jobs registered at startup with placeholder no-op handlers (real handlers wired in their respective stories): `weather-refresh` (`*/30 * * * *`), `caldav-sync` (`*/15 * * * *`), `reminder-eval` (`5 0 * * *`), `github-update-poll` (`0 3 * * *`), `vacuum-db` (`0 3 * * 0`)
- [x] `Scheduler.stop()` halts all jobs (used in tests and graceful shutdown)
- [x] Unit tests verify registration, isolation of failing jobs, runNow behaviour, and that an exception does not stop the schedule

---

## Technical Implementation

### Files to create / modify

- `server/src/scheduler/index.ts` — `Scheduler` class + `registerBuiltinJobs()`
- `server/src/index.ts` — call `registerBuiltinJobs()` after WS server; `Scheduler.stop()` on shutdown
- `server/tests/scheduler/scheduler.test.ts` — 23 tests

### Implementation steps

1. Installed `node-cron` and `@types/node-cron` in the server workspace (v4.2.1 / v3.0.11).
2. Authored `Scheduler` class in `server/src/scheduler/index.ts`:
   - `register(name, cron, handler)` — validates expression, wraps handler in try/catch, tracks `runCount`/`lastRun`/`lastError`, calls `node-cron`'s `schedule()`.
   - `runNow(name)` — invokes handler immediately, updates metadata, throws if name not found.
   - `list()` — returns `JobInfo[]` without exposing internal `handler`/`task` references.
   - `stop()` — calls `task.stop()` on each job and clears the registry.
   - `clearRegistry()` — test helper to reset state between tests.
3. `registerBuiltinJobs()` in same file — registers five placeholder jobs logged via `pino.debug`.
4. In `server/src/index.ts`: `registerBuiltinJobs()` called after `createWsServer()`; `Scheduler.stop()` called in the graceful shutdown path.

---

## Dependencies

- **Blocked by:** STORY-1.4 ✓
- **Blocks:** STORY-3.1, STORY-4.4, STORY-4.11, STORY-14.3, STORY-19.8

---

## Test Checklist

- [x] Unit: register stores job with correct name/cron/runCount=0
- [x] Unit: invalid cron expression throws at register time
- [x] Unit: handler throws → `lastError` set, error logged, caller not affected
- [x] Unit: async handler rejects → same error isolation behaviour
- [x] Unit: `runCount` increments on each invocation (scheduled and runNow)
- [x] Unit: `lastRun` timestamp set after each invocation
- [x] Unit: `runNow` invokes handler immediately and updates metadata
- [x] Unit: `runNow` throws for unknown job name
- [x] Unit: `Scheduler.list()` returns all jobs without internal handler/task
- [x] Unit: duplicate name overwrites previous entry
- [x] Unit: second job still runs after first job throws (isolation)
- [x] Unit: `registerBuiltinJobs()` registers exactly 5 jobs with correct names

---

## Progress Tracking

**Status History:**
- 2026-05-10: Created by sprint planning
- 2026-05-10: Implemented by Claude Code

**Actual Effort:** M (matched estimate)

**Implementation Notes:**
- node-cron v4 API — `schedule(expr, fn, opts)` starts immediately; no separate `.start()` needed.
- `Scheduler.clearRegistry()` (not `_reset`) avoids `no-underscore-dangle` ESLint rule.
- Tests mock node-cron entirely; extract the wrapped fn via typed `mock.calls` to verify isolation without real timers.
- 23 new tests (93 server total). lint + typecheck clean.

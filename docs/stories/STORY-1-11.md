# STORY-1.11: Job scheduler base

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a cron-driven job scheduler that registers handlers and survives restarts
**So that** sync, reminder, and maintenance jobs have a single home

---

## Acceptance Criteria

- [ ] `server/src/scheduler/index.ts` exports a singleton `Scheduler` wrapping `node-cron`
- [ ] `Scheduler.register(name: string, cron: string, handler: () => Promise<void> | void)` registers and starts a job
- [ ] Each handler invocation wrapped in try/catch with structured pino error logging including the job name
- [ ] In-memory job registry; `Scheduler.list()` returns `Array<{ name, cron, lastRun, lastError, runCount }>`
- [ ] `Scheduler.runNow(name)` executes the handler immediately (used by tests and admin UI)
- [ ] Built-in jobs registered at startup with placeholder no-op handlers (real handlers wired in their respective stories): `weather-refresh` (`*/30 * * * *`), `caldav-sync` (`*/15 * * * *`), `reminder-eval` (`5 0 * * *`), `github-update-poll` (`0 3 * * *`), `vacuum-db` (`0 3 * * 0`)
- [ ] `Scheduler.stop()` halts all jobs (used in tests and graceful shutdown)
- [ ] Unit tests with `jest.useFakeTimers()` verify registration, isolation of failing jobs, runNow behaviour, and that an exception does not stop the schedule

---

## Technical Implementation

### Files to create / modify

- `server/src/scheduler/index.ts`
- `server/src/scheduler/builtins.ts` — registers placeholder jobs
- `server/src/index.ts` — call `Scheduler.start()` after migrations
- `server/tests/scheduler/index.test.ts`

### Implementation steps

1. Install `node-cron` and `@types/node-cron` in the server workspace.
2. Author `Scheduler`:
```ts
import cron from 'node-cron';
type Job = { name: string; cron: string; handler: () => any; task: cron.ScheduledTask; lastRun?: number; lastError?: string; runCount: number };
class Scheduler {
  private jobs = new Map<string, Job>();
  register(name, expr, handler) {
    if (!cron.validate(expr)) throw new Error(`Invalid cron: ${expr}`);
    const wrapped = async () => {
      const j = this.jobs.get(name)!;
      j.runCount += 1;
      j.lastRun = Date.now();
      try { await handler(); j.lastError = undefined; }
      catch (err: any) { j.lastError = err.message; logger.error({ err, job: name }, 'scheduled job threw'); }
    };
    const task = cron.schedule(expr, wrapped, { scheduled: false });
    this.jobs.set(name, { name, cron: expr, handler, task, runCount: 0 });
  }
  start() { for (const j of this.jobs.values()) j.task.start(); }
  stop() { for (const j of this.jobs.values()) j.task.stop(); }
  list() { return [...this.jobs.values()].map(({ task, handler, ...rest }) => rest); }
  async runNow(name) { const j = this.jobs.get(name); if (!j) throw new Error(`No such job: ${name}`); await j.handler(); }
}
export const scheduler = new Scheduler();
```
3. `server/src/scheduler/builtins.ts`: register the five placeholder jobs listed in AC, each calling `logger.debug({ job }, 'placeholder')`. These are replaced with real handlers in:
   - `weather-refresh` → STORY-3.1
   - `caldav-sync` → STORY-4.4
   - `reminder-eval` → STORY-14.3
   - `github-update-poll` → STORY-19.8
   - `vacuum-db` → here (run `db.exec('VACUUM')`)
4. In `server/src/index.ts`, after `runMigrations()`: `import './scheduler/builtins'; scheduler.start();`. On SIGTERM, call `scheduler.stop()` before closing DB.
5. Author tests using `jest.useFakeTimers()`:
   - Register a job with `'* * * * *'`, advance one minute, assert handler called.
   - Register a throwing handler, advance — verify scheduler still runs subsequent jobs and logs error.
   - `runNow` invokes the handler immediately and updates `lastRun`/`runCount`.

### Key technical details

- Architecture §"Component 6: Job Scheduler" specifies `node-cron` and lists the built-in cron expressions.
- `cron.validate` is exposed by `node-cron` — use it to fail fast at register time.
- `node-cron`'s `ScheduledTask` constructor with `{ scheduled: false }` lets us start all jobs together via `Scheduler.start()`.
- Architecture §"Reliability": jobs must not crash the process. The try/catch is non-negotiable.
- Vacuum job runs Sunday 03:00 (`0 3 * * 0`) per Architecture §"Database — Configuration" (weekly off-peak).

---

## Dependencies

- **Blocked by:** STORY-1.4
- **Blocks:** STORY-3.1, STORY-4.4, STORY-4.11, STORY-14.3, STORY-19.8

---

## Test Checklist

- [ ] Unit: register + advance fake timers fires handler
- [ ] Unit: invalid cron expression throws at register
- [ ] Unit: handler throws → `lastError` set, scheduler continues, error logged
- [ ] Unit: `runNow` invokes handler immediately
- [ ] Unit: `Scheduler.list()` returns all registered jobs with metadata
- [ ] Unit: `Scheduler.stop()` cancels future executions
- [ ] Manual: server starts; `journalctl -u nestor-server` shows scheduled job logs

---

## Notes

- All cron expressions use server local time. Document in admin (STORY-17.1) that schedules follow the host timezone.
- The `vacuum-db` job is the only built-in with a real handler in this story; the others are stubs to demonstrate the registry.

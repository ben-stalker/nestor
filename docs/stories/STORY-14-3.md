# STORY-14.3: Reminder evaluator scheduler job

**Epic:** EPIC-14: Alert System
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a nightly job that evaluates reminders across all modules
**So that** alerts are pushed proactively

---

## Acceptance Criteria

- [ ] Scheduler job registered with cron `5 0 * * *` (00:05 daily)
- [ ] Each module exposes an `evaluateReminders(now)` hook (vehicles, pets, finance, subscriptions, maintenance, meter readings, bin schedules, baby tracking, guests)
- [ ] Engine calls each hook, catching exceptions; one failing module does not stop others
- [ ] Manual run endpoint `POST /api/v1/admin/run-reminder-eval` for diagnostics (admin only)
- [ ] Logs structured metrics: per-module duration, alerts pushed
- [ ] Reads `app_settings.reminder_windows` JSON for default lead-times (per STORY-17.10)

---

## Technical Implementation

### Files to create / modify

- `server/src/services/ReminderEvaluator.ts`
- `server/src/scheduler/jobs/reminderEval.ts`
- `server/src/routes/admin.ts` — manual-run endpoint
- `server/tests/services/ReminderEvaluator.test.ts`

### Implementation steps

1. Hook registry pattern:
```ts
type ReminderHook = (now: Date) => Promise<{ pushed: number }>;
const hooks: { name: string; fn: ReminderHook }[] = [];
export function registerReminderHook(name: string, fn: ReminderHook) { hooks.push({ name, fn }); }
export async function runAll(now = new Date()) {
  const results = [];
  for (const { name, fn } of hooks) {
    const start = Date.now();
    try {
      const { pushed } = await fn(now);
      results.push({ name, ok: true, pushed, durationMs: Date.now() - start });
    } catch (e) {
      log.error({ err: e, module: name }, 'reminder hook failed');
      results.push({ name, ok: false, durationMs: Date.now() - start });
    }
  }
  return results;
}
```
2. Scheduler job calls `runAll`.
3. Modules register at startup (`registerReminderHook('bins', binsReminderHook)`, etc.).
4. Admin endpoint `POST /api/v1/admin/run-reminder-eval` runs `runAll` and returns the results JSON.
5. Tests:
   - Two hooks: one succeeds, one throws → both attempted, error logged
   - Manual endpoint returns array of results
   - Permission: non-admin gets 403

### Key technical details

- Architecture §"Component 6: Job Scheduler" + §"Component 5: Alert Engine".
- Hooks are registered by their module's bootstrap (so this story is module-agnostic — modules add hooks independently).
- The job runs at 00:05 to cover overnight (so morning bin reminders fire reliably).
- Settings-driven lead-time windows: hooks read `app_settings.reminder_windows[<key>]`.

---

## Dependencies

- **Blocked by:** STORY-14.2, STORY-1.11
- **Blocks:** STORY-8.4 (bin alerts), STORY-6.6 (vehicle reminders), STORY-9.5 (finance end-dates), STORY-10.3 (pet reminders)

---

## Test Checklist

- [ ] Unit: registered hooks each invoked once
- [ ] Unit: hook throws → other hooks still run
- [ ] Unit: results array contains per-hook ok + durationMs
- [ ] Unit: admin endpoint returns 200 with results
- [ ] Unit: non-admin endpoint returns 403

---

## Notes

- Hooks are intentionally synchronous in registration order — a future improvement could parallelise with `Promise.allSettled` but sequential is fine for MVP volume.
- Manual run endpoint is also useful for end-to-end testing in Playwright.

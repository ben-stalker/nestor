# STORY-8.4: Bin day alerts

**Epic:** EPIC-8: House Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** S (1d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** household member
**I want** a "bin out tomorrow" alert
**So that** I don't forget

---

## Acceptance Criteria

- [ ] Reminder evaluator (from STORY-14.3) calls a `bins.evaluateReminders(now)` hook
- [ ] Hook evaluates each active bin schedule for next 24h; pushes alert if `alert_evening_before` or `alert_morning_of` matches
- [ ] Alert message i18n: "{name} bin out tomorrow" / "{name} bin out today" with severity `info`
- [ ] Optional audio chime per bin (consumed by STORY-14.5)
- [ ] Alert auto-dismissed when collection day passes (cleanup at midnight in nightly job)
- [ ] Dedup: same alert not raised twice in same day

---

## Technical Implementation

### Files to create / modify

- `server/src/services/bins/reminders.ts`
- `server/src/scheduler/jobs/binCleanup.ts` — midnight cleanup
- `server/src/services/AlertEngine.ts` — register hook (or central registry)
- `server/tests/services/bins/reminders.test.ts`

### Implementation steps

1. Hook signature:
```ts
export async function evaluateReminders(now: Date) {
  const schedules = await binRepo.list({ active: true });
  for (const s of schedules) {
    const upcoming = nextCollections(s, now, 1, holidays)[0];
    if (!upcoming) continue;
    const hoursUntil = (upcoming.getTime() - now.getTime()) / 3.6e6;
    if (s.alert_evening_before && isEveningOf(now, upcoming)) {
      await alertEngine.push({ source: 'house', source_module: 'bins', alert_type: 'bin_evening_before', severity: 'info',
        message: i18n.t('alerts.bin.tomorrow', { name: s.name }), nav_mode_badge: 'house', deep_link: '/house/bins',
        audio_chime: !!s.audio_chime });
    }
    if (s.alert_morning_of && isMorningOf(now, upcoming)) {
      await alertEngine.push({ /* alerts.bin.today */ });
    }
  }
}
```
2. Register hook in the central reminder evaluator (STORY-14.3).
3. Midnight cleanup job: dismisses bin alerts whose collection day has passed.
4. Dedup is handled in `AlertRepository.push` (STORY-14.1).
5. Tests with frozen time (`vi.useFakeTimers`):
   - Bin tomorrow at evening 18:00 → alert pushed once
   - Same evening, second invocation → no second alert (dedup)
   - Bin today at 07:00 → "today" alert
   - After collection day → cleanup dismisses

### Key technical details

- "Evening" = `now` between 17:00 and 23:59 the day before; "morning of" = `now` between 06:00 and 09:00 the same day. Configurable globally via `app_settings.bin_alert_windows` (defer if needed).
- The same `audio_chime` flag travels into the alert payload; STORY-14.5 plays it.
- i18n strings live in `house.json` namespace.

---

## Dependencies

- **Blocked by:** STORY-8.2, STORY-14.3
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: evening before → alert pushed once
- [ ] Unit: morning of → "today" alert
- [ ] Unit: dedup prevents second push same day
- [ ] Unit: cleanup dismisses past collections
- [ ] Unit: audio_chime flag carried into alert payload

---

## Notes

- Per-bin override of alert windows is plumbed via the schedule columns (`alert_evening_before`, `alert_morning_of`).
- Alerts use `nav_mode_badge='house'` so the navbar badge counts.

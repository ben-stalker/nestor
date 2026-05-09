# STORY-4.3: Recurring event expansion via ical.js

**Epic:** EPIC-4: Calendar Module
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** RRULE strings expanded into individual occurrences server-side
**So that** week and month views render without each client computing recurrences

---

## Acceptance Criteria

- [ ] Helper `expandRecurring(event, rangeStart, rangeEnd)` returns N event instances within the range
- [ ] Supports `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY` with `BYDAY`, `INTERVAL`, `COUNT`, `UNTIL`, `EXDATE`
- [ ] `EventRepository.findInRange` calls expansion for each event whose `recurring_rule` is non-null
- [ ] Times stored UTC; expansion respects DST transitions in the display tz (`app_settings.timezone`)
- [ ] Each expanded instance keeps the master event's `id` plus an `occurrence_id` like `${id}::${startEpoch}`
- [ ] Unit tests cover: weekly Mon/Wed/Fri series, monthly on the 31st (skip months without), DST spring-forward + fall-back boundaries, EXDATE, COUNT termination, UNTIL termination

---

## Technical Implementation

### Files to create / modify

- `server/src/services/recurrenceExpander.ts`
- `server/src/repositories/EventRepository.ts` — extend `findInRange` to expand
- `server/tests/services/recurrenceExpander.test.ts`

### Implementation steps

1. Install `ical.js`.
2. Author `expandRecurring(event, rangeStart, rangeEnd, tz)`:
```ts
import ICAL from 'ical.js';
const rule = ICAL.Recur.fromString(event.recurring_rule);
const dtstart = ICAL.Time.fromJSDate(new Date(event.start_datetime), false /* utc */);
const iter = rule.iterator(dtstart);
const out = [];
let next: ICAL.Time | null;
while ((next = iter.next())) {
  const ts = next.toJSDate().getTime();
  if (ts > rangeEnd) break;
  if (ts < rangeStart) continue;
  if (event.exdates?.includes(ts)) continue;
  out.push({ ...event, start_datetime: ts, end_datetime: ts + (event.end_datetime - event.start_datetime), occurrence_id: `${event.id}::${ts}` });
}
return out;
```
3. EXDATEs: parse from a separate column `exdates_json` or embedded in RRULE — for MVP, add an `event_exdates(event_id, ts)` table or re-use `recurring_rule` extension `;EXDATE=...`.
4. Update `EventRepository.findInRange`: after the SQL fetch, partition into `recurring`/`single`; expand recurring within range; concat and sort.
5. DST: pass `tz` from settings to `ICAL.Time` so wall-time-anchored events (e.g. "every Monday 09:00") shift correctly across DST.
6. Tests:
   - Weekly Mon/Wed/Fri: 3 occurrences in a 7-day window starting Monday
   - Monthly on 31st: skips Feb/April/June/etc.
   - DST: weekly 09:00 event keeps 09:00 wall time across spring-forward
   - EXDATE: skipped occurrence absent from output
   - COUNT=5: returns at most 5
   - UNTIL: nothing after UNTIL

### Key technical details

- `ical.js` is the de-facto JS RFC-5545 library; do NOT roll our own RRULE expander.
- Expansion should be lazy enough that a 5-year daily series queried for a single week returns ~7 occurrences, not 1825.
- All datetimes are epoch ms in UTC at storage; expansion converts to wall time via tz then back to epoch ms for transport.
- Cache: optional in-memory cache keyed by `(event.id, rangeStart, rangeEnd)` — only worthwhile if profiling shows hot spot; skip for MVP.

---

## Dependencies

- **Blocked by:** STORY-4.2
- **Blocks:** STORY-4.7 (day view), STORY-4.8 (week view), STORY-4.9 (month view), STORY-3.3 (carousel events)

---

## Test Checklist

- [ ] Unit: weekly BYDAY=MO,WE,FR returns 3 in a Mon–Sun range
- [ ] Unit: monthly on 31 skips months without 31
- [ ] Unit: spring-forward DST keeps wall-clock time
- [ ] Unit: fall-back DST keeps wall-clock time
- [ ] Unit: EXDATE skipped
- [ ] Unit: COUNT terminates iteration
- [ ] Unit: UNTIL terminates iteration
- [ ] Unit: range fully before series start → []
- [ ] Unit: range fully after series end (UNTIL) → []

---

## Notes

- Architecture §"Recurring Events" was deliberately light — this story owns the canonical implementation.
- Edits to a single occurrence (Phase 2) will introduce `event_overrides` table; not in MVP.

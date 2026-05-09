# STORY-8.2: Bin schedule alternating-cycle calculator

**Epic:** EPIC-8: House Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a pure function `nextCollections(binSchedule, fromDate, count) -> Date[]`
**So that** UI can render upcoming collections without per-date entry

---

## Acceptance Criteria

- [ ] Pure function `nextCollections(schedule, fromDate, count): Date[]`
- [ ] Inputs: `day_of_week` (0–6), `frequency_weeks` (1/2/4), `anchor_date`, `bank_holiday_shift` (boolean)
- [ ] Output: next N collection dates from `fromDate` (inclusive if today qualifies)
- [ ] Bank holiday shift: forwards by 1 day (or skips to next non-holiday day) if scheduled day falls on a UK bank holiday
- [ ] Bundled UK bank holidays (2026–2030) in `data/uk-bank-holidays.json`; region-swappable via setting
- [ ] Pure function: no DB or filesystem; takes a `holidayList` argument for testability
- [ ] Unit tests cover weekly, fortnightly, every-4-weeks, bank holiday shift, leap year, year boundary

---

## Technical Implementation

### Files to create / modify

- `server/src/services/bins/recurrence.ts`
- `server/src/data/uk-bank-holidays.json`
- `server/src/services/bins/holidays.ts` — load + cache holiday list
- `server/tests/services/bins/recurrence.test.ts`

### Implementation steps

1. Algorithm:
```ts
export function nextCollections(s: BinSchedule, from: Date, count: number, holidays: Set<string>): Date[] {
  // Find the first scheduled day >= from that satisfies cycle
  const out: Date[] = [];
  // Walk from anchor_date in steps of (frequency_weeks * 7) days
  let d = new Date(s.anchor_date);
  while (d < from) d = addWeeks(d, s.frequency_weeks);
  while (out.length < count) {
    let collection = d;
    if (s.bank_holiday_shift && holidays.has(toIsoDate(collection))) {
      collection = nextNonHoliday(collection, holidays);
    }
    if (collection >= from) out.push(collection);
    d = addWeeks(d, s.frequency_weeks);
  }
  return out;
}
```
2. `nextNonHoliday(d, holidays)`: increments by 1 day until not in holiday set.
3. `holidays.ts` loads JSON and exposes `getHolidays(region: string): Set<string>` (ISO date strings).
4. JSON contents: 2026–2030 UK bank holidays (verifiable from UK government source).
5. Tests:
   - Weekly Monday from Jan 1 (Mon) → next 4 Mondays
   - Fortnightly Monday → every 14 days
   - Every-4-weeks → every 28 days
   - Bank holiday: 26 Dec on a Wednesday → shifted to Thu 27
   - Leap year crossing
   - Year boundary

### Key technical details

- PRD §14 "How alternating schedules work".
- UK bank holidays: hardcoded JSON for MVP; community can contribute regional packs.
- Pure function ergonomics make testing straightforward — no time mocking needed.
- The DB record stores `anchor_date` so the cycle is deterministic; never recompute "what week are we in" from now.
- `frequency_weeks` constrained to 1, 2, or 4 keeps the algorithm simple.

---

## Dependencies

- **Blocked by:** STORY-8.1
- **Blocks:** STORY-8.3 (UI uses this), STORY-8.4 (alerts), STORY-3.4 (day card markers)

---

## Test Checklist

- [ ] Unit: weekly anchor 2026-01-05 (Mon), from=2026-01-05, count=4 → 4 Mondays
- [ ] Unit: fortnightly anchor 2026-01-05, from=2026-01-12 → next is 2026-01-19
- [ ] Unit: every-4-weeks correctness
- [ ] Unit: bank holiday shift skips holiday
- [ ] Unit: shift over a Christmas+Boxing Day pair
- [ ] Unit: year boundary works
- [ ] Unit: empty holiday set behaves like shift=false

---

## Notes

- A future "skip-week" feature (council changes schedule for one week) is not in MVP; would extend BinSchedule with `exceptions[]`.
- Region beyond UK lands as a community contribution; default 'uk-eaw' (England & Wales).

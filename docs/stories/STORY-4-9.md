# STORY-4.9: Calendar — Month view

**Epic:** EPIC-4: Calendar Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a month grid with event dots
**So that** I can see density at a glance and jump to a day

---

## Acceptance Criteria

- [ ] `<MonthView month={isoMonth}>` renders 6×7 grid (always 6 rows for layout stability)
- [ ] First day of week from locale (`app_settings.first_day_of_week`)
- [ ] Each cell shows: date number, up to 3 event dots colour-coded by profile, "+N more" text if overflow
- [ ] Today's cell visually highlighted
- [ ] Tap day → navigates to day view for that date
- [ ] Swipe / arrow buttons between months
- [ ] Days outside the current month rendered with reduced opacity

---

## Technical Implementation

### Files to create / modify

- `client/src/calendar/MonthView.tsx`
- `client/src/calendar/MonthCell.tsx`
- `client/src/calendar/index.tsx` — route `/calendar/month/:isoMonth?`
- `client/tests/calendar/MonthView.test.tsx`

### Implementation steps

1. Compute month grid:
```ts
function buildMonthGrid(month: string, firstDayOfWeek: 0|1) {
  const first = startOfMonth(parseISO(month + '-01'));
  const gridStart = startOfWeek(first, { weekStartsOn: firstDayOfWeek });
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
```
2. Single events query for `gridStart..gridStart+42d`; group by day.
3. Cell renders date, up to 3 colour dots, "+N more" if 4+ events.
4. Tap cell → `navigate(/calendar/day/${date})`.
5. Today highlight via `aria-current="date"` + ring.
6. Swipe via touch handlers; arrow buttons in header.
7. Tests: 35-day months render 6 rows; correct dot count; out-of-month opacity; navigation.

### Key technical details

- PRD §10 month view.
- 6×7 grid is always 42 cells; some are previous/next month, rendered dimmed.
- Recurring events expanded for the month range (via STORY-4.3).
- Performance: 200 events per month is the upper bound; fine without virtualisation.

---

## Dependencies

- **Blocked by:** STORY-4.7
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: 42 cells rendered
- [ ] RTL: out-of-month cells dimmed
- [ ] RTL: 5 events on one day → 3 dots + "+2 more"
- [ ] RTL: tap day → navigates to /calendar/day/<date>
- [ ] RTL: arrow forward → next month renders
- [ ] RTL: locale fr-FR starts Monday, weekdays in French

---

## Notes

- A future grid style (tile heatmap) is in scope for Phase 2; MVP keeps the dot pattern.
- All-day events count toward the dot total.

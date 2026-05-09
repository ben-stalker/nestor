# STORY-4.8: Calendar — Week view

**Epic:** EPIC-4: Calendar Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a 7-day week view with colour-coded events
**So that** I can plan the week

---

## Acceptance Criteria

- [ ] `<WeekView weekStart={monday}>` renders 7 columns of day timelines, each reusing `<DayView>` blocks
- [ ] Filter pills along top (profile filters, plus pet/vehicle if present)
- [ ] Today column visually highlighted (subtle accent border + background)
- [ ] Tap event → `<EventModal>` view mode
- [ ] Quick-add card bottom-right with "Event / All-day / Recurring" buttons
- [ ] Today summary at bottom-left: today's events as compact list
- [ ] First day of week from `app_settings.first_day_of_week` (Mon default; Sun for US)
- [ ] Swipe / arrow buttons navigate weeks
- [ ] Filters (`useFilters()`) applied

---

## Technical Implementation

### Files to create / modify

- `client/src/calendar/WeekView.tsx`
- `client/src/calendar/WeekHeader.tsx`
- `client/src/calendar/WeekGrid.tsx`
- `client/src/calendar/index.tsx` — route `/calendar/week/:isoWeek?`
- `client/tests/calendar/WeekView.test.tsx`

### Implementation steps

1. Compute `weekStart`/`weekEnd` from URL param or default (today's week per locale).
2. Single TanStack query for whole week range; partition events by day.
3. Render header row of 7 day labels with date number; today column gets `aria-current="date"` + accent class.
4. For each column, render compressed `<DayView>` (reuse layout function from STORY-4.7) at narrow width.
5. All-day events row spans across days they cover.
6. Today summary card at bottom-left lists today's events compactly.
7. Quick-add FAB bottom-right with action sheet.
8. Swipe (touch) and arrow buttons (keyboard) navigate ±1 week (`navigate(/calendar/week/${nextIsoWeek})`).
9. Tests: render with mock events, assert today column highlighted, navigation arrows update URL.

### Key technical details

- Design ref: `calendar_.png`.
- Reuse `layoutOverlaps` from STORY-4.7.
- Compute "today" column via `formatInTimeZone` in user tz (so "today" is correct after midnight in non-UTC tz).
- Performance: a single range fetch for the whole week (~50–200 events) is fine; no virtualisation needed.

---

## Dependencies

- **Blocked by:** STORY-4.7
- **Blocks:** STORY-4.9 (month view shares header)

---

## Test Checklist

- [ ] RTL: 7 day columns rendered with weekday headers
- [ ] RTL: today column has accent class
- [ ] RTL: tap event opens modal
- [ ] RTL: quick-add FAB opens action sheet
- [ ] RTL: arrow → navigates week
- [ ] RTL: filter change re-fetches
- [ ] Manual: portrait 1080×1920 shows all 7 columns readable
- [ ] Manual: locale fr-FR places Monday first, French weekday names

---

## Notes

- Multi-day events display visually as a single bar across spanned days at top of grid.
- The week view shares the same modal opener and quick-add wiring as DayView.

# STORY-4.8: Calendar — Week View

**Epic:** 4 — Calendar Module  
**Status:** ✅ Complete  
**Priority:** P1  
**Estimate:** L  
**Completed:** 2026-05-13

## Summary

Implements the 7-column Calendar Week view: a scrollable timeline grid with one column per day, colour-coded event blocks, today column highlighted, event detail sheet, and quick-add on empty slot tap. Also extends `CalendarPage` with Day/Week tab navigation.

## What Was Built

### Client

**`client/src/calendar/WeekHeader.tsx`**
- 7-column header row showing weekday abbreviation + day number via `Intl.DateTimeFormat`
- Today column gets `aria-current="date"` and `.week-header__cell--today` accent class
- Gutter spacer aligns with the hour gutter in WeekGrid

**`client/src/calendar/WeekGrid.tsx`**
- `WeekGrid`: renders 7 `WeekColumn` components, one per day
- `WeekColumn`: applies `layoutOverlaps` from STORY-4.7, renders `EventBlock` per timed event
- `dayKey(date)` helper maps a `Date` to `"YYYY-M-D"` string for the `eventsByDay` map
- Today column gets `.week-column--today` accent background
- Slot click floored to 30-min boundary, calls `onSlotClick`

**`client/src/calendar/WeekView.tsx`**
- `getWeekDays(anchor)` — computes Monday-anchored 7-day array
- `weekBounds(weekDays)` — derives `start`/`end` epoch ms for TanStack Query
- `eventsByDay` built via `reduce` into `Map<string, CalendarEventRaw[]>`
- Same `EventDetailModal` + `QuickAddSheet` pattern as DayView
- Exposes `data-testid="week-view"` for tests

**`client/src/calendar/index.tsx`** — `CalendarPage` extended
- Added `ViewMode` union type (`'day' | 'week'`)
- Day/Week tab strip with `role="tablist"` and `aria-selected` on active tab
- Navigation steps by 1 day (day view) or 7 days (week view)
- Renders `<DayView>` or `<WeekView>` per selected mode

**`client/src/index.css`**
- `.calendar-page__view-tabs` + `.calendar-page__view-tab` + active state (bottom border accent)
- `.week-view` + `.week-view__body`
- `.week-header` + `.week-header__gutter` + `.week-header__cell` + `--today` modifier
- `.week-header__weekday` + `.week-header__day-num`
- `.week-grid`
- `.week-column` + `.week-column--today` (accent background + border)

## Acceptance Criteria

- [x] `<WeekView>` renders 7 columns of day timelines, each reusing `EventBlock` + `layoutOverlaps`
- [x] Today column visually highlighted (accent background + border-left colour)
- [x] Tap event → opens `EventDetailModal` view mode
- [x] Tap empty slot → opens `QuickAddSheet` with day + time
- [x] Week anchored to Monday (Mon–Sun)
- [x] `CalendarPage` tab strip switches between Day and Week views
- [x] Navigation steps by 7 days in week mode

## Tests

**`client/tests/calendar/WeekView.test.tsx`** — 9 tests:
- Renders 7 day column headers
- Today column has `aria-current="date"`
- Non-today week has no `aria-current`
- Renders an event button
- Clicking event opens detail modal
- Closing detail modal removes it
- Profile colour applied to event
- Clicking day column opens quick-add sheet
- Quick-add sheet can be closed

**Total client tests:** 290 (281 before STORY-4.8)
**Total server tests:** 348 (unchanged)

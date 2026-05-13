# STORY-4.7: Calendar — Day View

**Epic:** 4 — Calendar Module  
**Status:** ✅ Complete  
**Priority:** P1  
**Estimate:** L  
**Completed:** 2026-05-13

## Summary

Implements the full-screen Calendar Day view: an hourly timeline (06:00–22:00) with time-positioned event cards, all-day event strip, overlap layout, event detail sheet, and quick-add sheet on empty slot tap.

## What Was Built

### Client

**`client/src/api/calendar.ts`**
- `CalendarEventRaw` interface matching server `CalendarEvent` shape (snake_case fields from API)
- `getEvents(start, end, profileIds?)` — fetches from `GET /api/v1/calendar/events`

**`client/src/calendar/layoutOverlaps.ts`**
- `layoutOverlaps<E>(events)` — greedy interval-graph colouring
- Sorts events by `start_datetime`; assigns each event to the first free column; computes `totalColumns` per event by counting all mutual overlaps
- Returns `LayoutItem<E>[]` with `{ event, column, totalColumns }`

**`client/src/calendar/HourGutter.tsx`**
- Left-side hour labels (06–21, one per 64px row)
- Exports `PX_PER_HOUR`, `DAY_START_HOUR`, `DAY_END_HOUR` constants used by DayView

**`client/src/calendar/EventBlock.tsx`**
- Absolutely-positioned `<button>` for a single timed event
- Props: `colour`, `top`, `height`, `column`, `totalColumns`
- Width/left computed as percentage of `totalColumns`
- Compact mode (< 32px height) hides the time label
- Locale-aware time via `Intl.DateTimeFormat(navigator.language)`

**`client/src/calendar/DayView.tsx`**
- TanStack Query: `['events', start, end]` with 2-min stale time
- Separates all-day (`all_day !== 0`) vs timed events
- Runs `layoutOverlaps` on timed events; renders `EventBlock` for each
- `eventTopPx` / `eventHeightPx` clamp to the visible 06:00–22:00 window
- Profile colour lookup via `useProfiles()` → `Map<number, string>`
- Colour priority: `colour_override ?? profileColor ?? '#4a90d9'`
- Grid click handler: floors Y position to 30-min boundary, opens `QuickAddSheet`
- Tap event → opens inline `EventDetailModal` (placeholder for STORY-4.10)
- All-day strip at top when all-day events present

**`client/src/calendar/index.tsx`** — `CalendarPage`
- Date navigation (prev/next day, "Today" pill when not on today)
- Header shows locale-formatted full date
- Mounts `<DayView date={date} />`
- Route entry point for `/calendar`

**`client/src/router.tsx`**
- `/calendar` route updated from `Placeholder` to `CalendarPage`

**`client/src/index.css`**
- `.calendar-page` layout (flex column, header + scrollable DayView)
- `.day-view` + `.day-view__allday` + `.day-view__timeline`
- `.hour-gutter` + `.hour-gutter__label`
- `.event-grid` (repeating-linear-gradient for hour lines)
- `.event-block` + `.event-block--compact`
- `.allday-event`
- `.event-detail-modal` + `.quick-add-sheet`

## Acceptance Criteria

- [x] `<DayView date={date}>` renders hours 06:00–22:00 with events as time-positioned cards
- [x] Events colour-coded by `profile.colour` (or `colour_override` if set)
- [x] Tap event → opens `EventDetailModal` in view mode (STORY-4.10 will enhance)
- [x] Tap empty slot → opens quick-add sheet with floored 30-min start time
- [x] All-day events stacked at top strip
- [x] Locale-aware time format via `Intl.DateTimeFormat`
- [x] Overlapping events laid out side-by-side (greedy column assignment)

## Tests

**`client/tests/calendar/layoutOverlaps.test.ts`** — 7 tests:
- Empty array → empty result
- Single event → column 0, totalColumns 1
- Two non-overlapping → both column 0
- Two overlapping → columns 0 and 1 with totalColumns 2
- Three mutually overlapping → columns 0, 1, 2 with totalColumns 3
- Boundary-adjacent events don't overlap
- Sorts by start time before assigning columns

**`client/tests/calendar/DayView.test.tsx`** — 11 tests:
- Timed event renders as accessible button
- Multiple timed events render
- Two overlapping events both render
- Clicking event opens detail modal
- Closing detail modal removes it
- Profile colour applied to event block
- `colour_override` takes priority
- All-day event appears in all-day strip
- No all-day strip when no all-day events
- Clicking event grid opens quick-add sheet
- Quick-add sheet can be closed

**Total client tests:** 281 (263 before)
**Total server tests:** 348 (unchanged)

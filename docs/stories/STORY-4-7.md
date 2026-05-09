# STORY-4.7: Calendar — Day view

**Epic:** EPIC-4: Calendar Module
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a full-screen day view with timeline
**So that** I can see today's events with start/end times

---

## Acceptance Criteria

- [ ] `<DayView date={date}>` renders hours `app_settings.day_view_start..end` (default 06:00–22:00) with events as time-positioned cards
- [ ] Events colour-coded by `profile.colour` (or `colour_override` if set)
- [ ] Tap event → opens `<EventModal>` (STORY-4.10) in view mode
- [ ] Tap empty slot (≥30min slot click) → opens quick-add modal with start = clicked slot
- [ ] All-day events stacked at top, full width
- [ ] Locale-aware time format (`formatTime` from STORY-18.2)
- [ ] Filters from `useFilters()` (STORY-2.9) applied
- [ ] Overlapping events lay out side-by-side automatically (CSS grid columns or simple flex)

---

## Technical Implementation

### Files to create / modify

- `client/src/calendar/DayView.tsx`
- `client/src/calendar/HourGutter.tsx`
- `client/src/calendar/EventBlock.tsx`
- `client/src/calendar/layoutOverlaps.ts` — pure function for column assignment
- `client/src/calendar/index.tsx` — route `/calendar/day/:date?`
- `client/tests/calendar/DayView.test.tsx`

### Implementation steps

1. Compute event positions: each event gets `top = (start - dayStart) / hourMs * pxPerHour`, `height = duration / hourMs * pxPerHour`.
2. Lay out overlaps: sort events by start; for each, find the leftmost free column at its time range; assign column.
```ts
export function layoutOverlaps(events: CalendarEvent[]): { event; column; columns }[] {
  // greedy interval graph colouring
}
```
3. Render hour gutter on the left (06:00..22:00 with hour labels), grid in the right side.
4. All-day events: separate strip at top.
5. Empty slot click: floor to nearest 30-minute boundary, open quick-add with that time.
6. Use `useEvents(start, end, filters.profiles)` to fetch.
7. Tests:
   - Single event renders at correct top/height
   - Two overlapping events render in 2 columns
   - All-day event in top strip
   - Empty slot click triggers quick-add with floored time

### Key technical details

- PRD §10 day view.
- Events colour: `colour_override ?? profileColour(event.profile_id)`.
- Default day window 06:00–22:00; admins can extend via settings.
- The same `<DayView>` can be reused inside the carousel detail modal (STORY-3.3).

---

## Dependencies

- **Blocked by:** STORY-4.3 (events expanded), STORY-4.10 (modal)
- **Blocks:** STORY-4.8 (week view reuses event-block layout), STORY-4.9 (month view)

---

## Test Checklist

- [ ] RTL: render 3 events at different times → 3 blocks at correct positions
- [ ] RTL: 2 overlapping events → 2 columns
- [ ] RTL: all-day event in top strip
- [ ] RTL: tap event → modal opens in view mode
- [ ] RTL: tap empty slot → quick-add opens with floored start
- [ ] Manual: 1080p portrait shows full day cleanly
- [ ] Manual: 1920×1080 landscape shows hours wider

---

## Notes

- Multi-day events span across day views — show a chevron indicator at the boundary.
- Event durations < 30 min show a compact label with title only.

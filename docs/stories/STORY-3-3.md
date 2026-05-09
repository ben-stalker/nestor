# STORY-3.3: Day carousel — read-only render

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a horizontal day carousel showing yesterday + today (large) + next 4 days
**So that** I can see what is coming at a glance

---

## Acceptance Criteria

- [ ] `<DayCarousel>` accepts a `[start, end]` date range and renders one day card per day (default 6 cards: yesterday, today large, +4 days)
- [ ] Today card ~50% of available width; flanking cards thin (~12.5% each)
- [ ] Each card shows: date, day name, mini weather (high/low/icon/precip%), event list colour-coded by profile
- [ ] Smooth scroll-snap horizontal scroll, 200–300ms (Framer Motion)
- [ ] Tap thin card → animate it to focal width
- [ ] Tap focal card → opens full-screen day view modal (uses `<DayView>` from STORY-4.7 in a modal wrapper, OR navigate to `/calendar/day/:date`)
- [ ] Long-press empty area → opens quick-add modal (STORY-4.10) with that date prefilled
- [ ] "↩ Back to Today" pill appears when scrolled away from today
- [ ] Reduced-motion users see instant transitions
- [ ] Carousel respects active filters (`useFilters()` from STORY-2.9) — events filtered by selected profiles

---

## Technical Implementation

### Files to create / modify

- `client/src/home/DayCarousel.tsx`
- `client/src/home/DayCard.tsx`
- `client/src/home/api.ts` — `useDayRange(start, end)` TanStack query
- `client/src/calendar/api.ts` — share `useEvents(start, end, profileIds)`
- `client/tests/home/DayCarousel.test.tsx`

### Implementation steps

1. Compute date range from props (defaults: today − 1 to today + 4).
2. TanStack queries:
   - `useEvents(start, end, profileIds)` → `/api/v1/calendar/events?start=&end=&profileIds=`
   - `useWeather()` → `/api/v1/weather`
3. `<DayCarousel>` renders cards in a horizontal flex:
```tsx
<motion.div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
  <LayoutGroup>
    {days.map(d => <DayCard key={d.iso} date={d} focal={d.iso === focal} ... />)}
  </LayoutGroup>
</motion.div>
```
4. Use `LayoutGroup` + `layout` prop on cards to animate width transitions.
5. `<DayCard>`:
   - Date+day name (locale-aware).
   - Mini weather: icon + high/low + precip% (from useWeather; per-day from `weather.daily[i]`).
   - Event list: filter events whose `profile_id` matches active filters (or null), render compact rows colour-coded by profile.
   - Long-press detector via `react-use-gesture` or simple `onTouchStart`/`onTouchEnd` timer (>=600ms).
6. Back-to-today pill: appears when `focal !== today` (Framer `AnimatePresence`).
7. Reduced-motion: read `useReducedMotion()`, set transition duration to 0.
8. Tests: render with mocked events, assert today card is wider, tap thin card sets new focal, long-press calls quick-add handler.

### Key technical details

- PRD §9 "Main Pane — Day Carousel".
- Use `framer-motion` `LayoutGroup` + `AnimatePresence` for smooth width morphing.
- The carousel must NOT re-fetch on every focal change — events for the visible window are fetched once.
- Filters interact via `useFilters()` (STORY-2.9); when filter changes, query key changes, refetch.
- Events shown in compact form (title only, max 3 with "+N more"); tap card opens full day view for detail.

---

## Dependencies

- **Blocked by:** STORY-3.2 (home layout), STORY-2.5 (Card primitive), STORY-4.3 (events expanded), STORY-3.1 (weather)
- **Blocks:** STORY-3.4 (day card markers), STORY-4.7 (day view used as detail modal)

---

## Test Checklist

- [ ] RTL: renders 6 cards, today is wider
- [ ] RTL: tap thin card → focal changes
- [ ] RTL: long-press → quick-add handler called with date
- [ ] RTL: filter changes → only matching events render
- [ ] RTL: scroll right → "Back to Today" pill appears
- [ ] RTL: reduced-motion → transitions are 0ms
- [ ] Manual: portrait, snap scroll feels smooth on a touchscreen

---

## Notes

- Day card "markers" (WFH/school/vehicle/etc.) come in STORY-3.4 once dependent modules exist.
- The day view modal can either reuse `<DayView>` (STORY-4.7) inside `<Modal>` or navigate to a route — both fine; pick the modal route to keep the home context.

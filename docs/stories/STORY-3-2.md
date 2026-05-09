# STORY-3.2: Home route layout

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** the Home screen with alerts strip, day carousel area, journey widget area, and plugin strip area
**So that** all home-screen widgets have their place

---

## Acceptance Criteria

- [ ] `client/src/home/index.tsx` route mounted at `/`
- [ ] Sections (top→bottom in portrait): header (greeting + date/time + weather) → alerts strip → day carousel → journey widget → plugin strip
- [ ] Header reads active profile to greet by name ("Good morning, Sarah") with i18n string `home.greeting.{morning|afternoon|evening}`
- [ ] Live clock updating each minute (`HH:mm` per locale)
- [ ] Date in locale long format
- [ ] Sub-widgets accept mock data props until later stories complete (DayCarousel, AlertsStrip, etc. ship as `<Skeleton>` placeholders)
- [ ] Layout matches design `home_.png` (filter row at top, then carousel, then "Coming up" + journey + plugin strip)
- [ ] Landscape orientation re-flows: filters move to left rail (provided by FilterPanel from STORY-2.9)

---

## Technical Implementation

### Files to create / modify

- `client/src/home/index.tsx`
- `client/src/home/Greeting.tsx`
- `client/src/home/Clock.tsx`
- `client/src/router.tsx` — register route
- `client/public/locales/en/home.json` — strings
- `client/tests/home/index.test.tsx`

### Implementation steps

1. Build layout grid:
```tsx
<div className="grid gap-6 p-6 grid-rows-[auto_auto_1fr_auto_auto]">
  <Header />
  <AlertsStripPlaceholder />
  <DayCarouselPlaceholder />
  <JourneyWidgetPlaceholder />
  <PluginStripPlaceholder />
</div>
```
2. Header component:
   - Greeting based on time of day (morning <12, afternoon <18, evening else) using `useActiveProfile()`.
   - Clock that updates every 60s (`setInterval` with `clearInterval` cleanup).
   - Date via `formatDate` from STORY-18.2.
   - Mini-weather slot (placeholder until STORY-3.5).
3. Use `<Card>` primitive (STORY-2.5) for each section.
4. Placeholders use `<Skeleton>` from STORY-2.5 with the eventual component's footprint so layout doesn't reflow when real data arrives.
5. Tests: render with mocked profile, assert greeting matches morning/afternoon/evening branches, assert clock updates after `vi.advanceTimersByTime`.

### Key technical details

- Design ref: `home_.png` (top filter row → "Today" carousel → "Coming up" + journey time + plugin widgets).
- Header greeting rotates by time-of-day; threshold values pulled from i18n config to support cultural variations.
- The orientation-driven layout is delegated to `<AppShell>` (STORY-2.6); `<HomePage>` only worries about its own grid.
- `useActiveProfile()` from STORY-2.8 provides the profile; if null (rare), fall back to "Hello".

---

## Dependencies

- **Blocked by:** STORY-2.6, STORY-3.1
- **Blocks:** STORY-3.3 (carousel slot), STORY-3.5 (mini weather), STORY-3.6 (alerts strip), STORY-3.7 (journey widget), STORY-3.8 (plugin strip)

---

## Test Checklist

- [ ] RTL: 09:00 renders "Good morning"
- [ ] RTL: 14:00 renders "Good afternoon"
- [ ] RTL: 22:00 renders "Good evening"
- [ ] RTL: clock advances after 60s with fake timers
- [ ] RTL: date string respects en-GB long format
- [ ] Manual: portrait shows expected vertical stack
- [ ] Manual: landscape, with filters in left rail (verifies STORY-2.9 wiring)

---

## Notes

- The "Coming Up" widget is STORY-3.9 (P2) — placeholder card stub here is fine.
- Plugin widget strip (STORY-3.8) renders zero items until plugins land; section hides itself.

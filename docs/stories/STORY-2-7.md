# STORY-2.7: Bottom navbar / side rail with mode buttons

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a navbar with the 10 default modes, configurable layout
**So that** I can navigate to any section in one tap

---

## Acceptance Criteria

- [ ] `<NavBar>` reads `app_settings.enabled_nav_modes` (a JSON array of mode IDs in display order)
- [ ] Default 10 modes per PRD §8 with labels and icons matching `home_.png` / `calendar_.png` / `food.png` footers: Home, Calendar, Food, Travel (Vehicles), Family, House, Finance, Pets, EV, Board
- [ ] Each button: large icon (28–32px) above a label, mode accent colour applied on `aria-current="page"`
- [ ] Unread alert badge (small numbered pill) overlays each button, driven by `useAppStore.alertCount` (per-mode badge counts arrive in STORY-14.6)
- [ ] Portrait layouts (selectable via `app_settings.nav_layout`):
  - `single` — one row, fits all modes (designed for ≤8 modes)
  - `double` — two rows
  - `scrollable` — single horizontally scrollable row
  - `hamburger` — primary 4 visible + "More" opens a sheet
- [ ] Landscape: vertical rail, single column, scrollable if overflow
- [ ] Tap → React Router `navigate()` to the mode's route (`/` for home, `/calendar`, `/food`, `/vehicles`, `/family`, `/house`, `/finance`, `/pets`, `/ev`, `/board`)
- [ ] Hidden modes are simply omitted from the list (admin can hide via STORY-17.6)
- [ ] All buttons are `<TouchTarget>` with min 44×44 hit area; labels visible at 1.5m (≥14px)

---

## Technical Implementation

### Files to create / modify

- `client/src/core/NavBar.tsx`
- `client/src/core/navModes.ts` — default mode definitions: `{ id, route, labelKey, iconName, accentColour }`
- `client/src/core/icons/*` — SVG icon components (or `lucide-react` install — Architecture allows it; keep import small)
- `client/src/core/AppShell.tsx` — render `<NavBar>` inside the navbar/rail grid slot
- `client/src/store/appStore.ts` — extend with `badgeCounts: Record<string, number>` (per-mode)
- `client/tests/core/NavBar.test.tsx`

### Implementation steps

1. Install `lucide-react` for icons (lightweight, tree-shakeable).
2. `client/src/core/navModes.ts`:
```ts
export const DEFAULT_NAV_MODES = [
  { id: 'home', route: '/', labelKey: 'nav.home', icon: HomeIcon, accent: 'mode-home' },
  { id: 'calendar', route: '/calendar', labelKey: 'nav.calendar', icon: CalendarIcon, accent: 'mode-calendar' },
  { id: 'food', route: '/food', labelKey: 'nav.food', icon: ChefHatIcon, accent: 'mode-food' },
  { id: 'vehicles', route: '/vehicles', labelKey: 'nav.vehicles', icon: CarIcon, accent: 'mode-vehicles' },
  { id: 'family', route: '/family', labelKey: 'nav.family', icon: UsersIcon, accent: 'mode-family' },
  { id: 'house', route: '/house', labelKey: 'nav.house', icon: HouseIcon, accent: 'mode-house' },
  { id: 'finance', route: '/finance', labelKey: 'nav.finance', icon: PoundIcon, accent: 'mode-finance' },
  { id: 'pets', route: '/pets', labelKey: 'nav.pets', icon: PawIcon, accent: 'mode-pets' },
  { id: 'ev', route: '/ev', labelKey: 'nav.ev', icon: BoltIcon, accent: 'mode-ev' },
  { id: 'board', route: '/board', labelKey: 'nav.board', icon: PinIcon, accent: 'mode-board' },
] as const;
```
3. `<NavBar>` reads `useAppSettings().data?.enabled_nav_modes ?? DEFAULT_NAV_MODES.map(m => m.id)` and `nav_layout`. Filter and order modes accordingly.
4. Render via `useLocation()` to determine active mode; apply accent colour.
5. Badge: `useAppStore(s => s.badgeCounts[mode.id] ?? 0)` — render a small `<Pill>` with the number when > 0.
6. Layout variants implemented as conditional class names plus, for `hamburger`, a sheet `<Modal>` showing overflow modes.
7. Use NavLink for accessibility (`aria-current="page"`).
8. Author RTL test: render with mocked settings, click each button, assert `navigate` called with right route; verify badge appears when store has count.

### Key technical details

- PRD §8 lists the 10 default modes and the four layout options.
- Default `enabled_nav_modes` (set during wizard / install) populates `app_settings.enabled_nav_modes` with all 10 IDs.
- Mode accent colours are the keys from STORY-2.5's Tailwind theme (`mode.home`, etc.). The active button receives `text-mode-home` and a coloured underline/indicator.
- Use `lucide-react` icons for consistency with the warm/calm aesthetic — outline style, ~28px stroke 1.5.
- Badge counts are updated by STORY-14.6's `GET /api/v1/alerts/badge-counts` and the WS `alert:new` / `alert:dismissed` events.
- Designs reference: footer icons in `home_.png` / `calendar_.png` / `food.png`. Note the reddish "Family" pill, orange "Food" highlight, etc. — accent colour reflects mode, not active state.

---

## Dependencies

- **Blocked by:** STORY-2.6, STORY-1.7
- **Blocks:** STORY-2.8, STORY-3.2, STORY-14.6, STORY-17.6, STORY-18.8

---

## Test Checklist

- [ ] Unit: renders all 10 default modes
- [ ] Unit: respects `enabled_nav_modes` order and visibility
- [ ] Unit: tapping a button calls `navigate('/calendar')`
- [ ] Unit: badge appears when `badgeCounts.calendar > 0`
- [ ] Unit: hamburger layout shows 4 + "More"; tapping More opens a sheet with overflow modes
- [ ] Manual: portrait — bottom navbar at the bottom; landscape — vertical rail on the inline-start
- [ ] Manual: tap target meets 44×44 minimum on touchscreen
- [ ] a11y: `aria-current="page"` on active button

---

## Notes

- All labels are i18n keys; English translations land alongside this story (add to `client/public/locales/en/translation.json` namespace `nav`).
- "Travel" and "Vehicles" are the same mode in PRD §8 — use `vehicles` as the ID and `nav.vehicles` as the label key (translation can read "Travel" if preferred per locale).

# STORY-2.6: App shell with portrait/landscape layout

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** the app to render with a navbar in the right place for the screen orientation
**So that** the layout is purposeful, not rotated

---

## Acceptance Criteria

- [ ] `<AppShell>` component wraps every authenticated route
- [ ] Detects orientation via `window.matchMedia('(orientation: portrait)')` and listens for changes
- [ ] Portrait mode: bottom horizontal navbar (per `home_.png`, `calendar_.png`, `food.png`)
- [ ] Landscape mode: left vertical icon rail (88px wide)
- [ ] Orientation overridable via `app_settings.orientation` (`'auto' | 'portrait' | 'landscape'`); when not `'auto'`, ignores the media query
- [ ] Layout reflows live without a page reload when `app_settings.orientation` changes (subscribe to `settings:updated` WS message)
- [ ] CSS Grid layout: portrait `grid-rows: [filters] [main] [navbar]`; landscape `grid-cols: [rail] [filters] [main]`
- [ ] Visual regression / Playwright snapshot at viewports 1080×1920 (portrait) and 1920×1080 (landscape)
- [ ] All layout uses CSS logical properties (`margin-inline-start`, `padding-block`, etc.) — no `margin-left/right`

---

## Technical Implementation

### Files to create / modify

- `client/src/core/AppShell.tsx`
- `client/src/core/hooks/useOrientation.ts`
- `client/src/core/hooks/useAppSettings.ts` — TanStack Query against `GET /api/v1/settings`
- `client/src/router.tsx` — wrap routes with `<AppShell>`
- `client/src/index.css` — add CSS Grid layout rules
- `client/tests/core/AppShell.test.tsx`
- `client/tests-e2e/orientation.spec.ts` — Playwright snapshot test (lands as part of STORY-20.4 too)

### Implementation steps

1. `useOrientation()`:
```ts
export function useOrientation(): 'portrait' | 'landscape' {
  const setting = useAppSettings().data?.orientation ?? 'auto';
  const [media, setMedia] = useState<'portrait' | 'landscape'>(() => window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape');
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = () => setMedia(mq.matches ? 'portrait' : 'landscape');
    mq.addEventListener('change', handler); return () => mq.removeEventListener('change', handler);
  }, []);
  return setting === 'auto' ? media : setting;
}
```
2. `<AppShell>`:
```tsx
function AppShell() {
  const orientation = useOrientation();
  return (
    <div className={cn('app-shell', `app-shell--${orientation}`)} data-orientation={orientation}>
      <Outlet /> {/* For now; navbar/filters placeholders until 2.7 / 2.9 */}
    </div>
  );
}
```
3. CSS Grid in `index.css`:
```css
.app-shell { display: grid; min-height: 100vh; background: var(--color-bg-warm); }
.app-shell--portrait { grid-template-rows: auto 1fr auto; grid-template-areas: "filters" "main" "navbar"; }
.app-shell--landscape { grid-template-columns: 88px auto 1fr; grid-template-areas: "rail filters main"; }
.app-shell > .navbar { grid-area: navbar; }
.app-shell > .rail { grid-area: rail; }
.app-shell > .filters { grid-area: filters; }
.app-shell > main { grid-area: main; overflow: auto; }
```
4. `useAppSettings` hook: TanStack Query keyed `['app-settings']` calling `apiFetch('/settings')`. Subscribe to WS `settings:updated` message in a wrapping provider — invalidate query on receipt.
5. Wire `<AppShell>` into the router so every authenticated route renders inside it.
6. Author Playwright snapshot test at both viewports (will be merged into STORY-20.4's E2E suite).

### Key technical details

- PRD §7 and §8 describe portrait/landscape behaviours. Designs `home_.png`, `calendar_.png`, `food.png` are all portrait — landscape is a transform of the same content with a left rail instead of bottom navbar.
- `app_settings.orientation` is set during the install script (orientation auto-detected) and configurable in admin.
- Avoid JS-driven reflow on rotation; CSS Grid handles it.
- CSS logical properties (`margin-inline-start`) prepare the codebase for RTL (STORY-18.6).
- The actual navbar content lands in STORY-2.7; this story's `<AppShell>` exposes named grid slots.

---

## Dependencies

- **Blocked by:** STORY-2.5
- **Blocks:** STORY-2.7, STORY-2.9, STORY-3.2, every routed page

---

## Test Checklist

- [ ] Unit: `useOrientation` returns the media-query value when setting is `auto`
- [ ] Unit: `useOrientation` returns the explicit setting when not `auto`
- [ ] Integration: changing `app_settings.orientation` via admin endpoint reflows the shell within 1s (WS-driven)
- [ ] Manual / Playwright: 1080×1920 viewport renders with bottom navbar slot at the bottom
- [ ] Manual / Playwright: 1920×1080 viewport renders with left rail slot on the inline-start
- [ ] Lint: no `margin-left`/`margin-right`/`padding-left`/`padding-right` in core CSS

---

## Notes

- The reference touchscreen is portrait per the designs; landscape is supported but secondary visually. Test both.
- Real touchscreen hardware behaviour differs from the desktop browser — test on actual device before declaring done (per Architecture NFR-003).

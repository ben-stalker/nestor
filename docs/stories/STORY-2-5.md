# STORY-2.5: Design system tokens and core primitives

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** Tailwind tokens (colours, spacing, type scale, radii, shadows) and a small set of primitive components
**So that** all modules look and feel consistent and meet readability/accessibility targets

---

## Acceptance Criteria

- [ ] Tailwind theme defines:
  - Background tokens: `bg-warm` (`#FBF5EC` warm-white per `home_.png`), `bg-warm-dark` (deep warm grey for dark mode), `surface` (`#FFFFFF`), `surface-elev` (subtle shadow)
  - Text tokens: `text-primary`, `text-secondary`, `text-muted`
  - 9 mode accent colours (one per nav mode): `home`, `calendar`, `food`, `vehicles`, `family`, `house`, `finance`, `pets`, `ev`, `board` (10 nav modes — one accent each; `home` and `board` may share neutral)
  - 12 profile colours (per PRD §6; e.g. `profile-1` … `profile-12`) — vibrant but accessible
  - Alert colours: `alert-urgent` (red), `alert-warning` (amber), `alert-info` (blue), `alert-success` (green)
- [ ] Type scale CSS custom properties driven by `--base-font-size` (default `18px`):
  - `--text-display: clamp(48px, 5vw, 72px)`
  - `--text-h1: 32px`
  - `--text-h2: 24px`
  - `--text-body: var(--base-font-size)`
  - `--text-caption: 14px`
  - All Tailwind `text-*` utilities map to these via theme extension
- [ ] Radii: `--radius-card: 24px`, `--radius-button: 16px`
- [ ] Inter typeface self-hosted in `client/public/fonts/Inter/` (weight 400/500/600/700/800), loaded via `@font-face` in `index.css`
- [ ] Primitive components in `client/src/shared/ui/`:
  - `<Card>` — radius 24, surface bg, configurable padding (`sm`/`md`/`lg`), optional shadow
  - `<Button>` — radius 16, variants `primary`/`secondary`/`ghost`/`danger`, sizes `sm`/`md`/`lg`, loading state, disabled state
  - `<TouchTarget>` — wraps interactive children, enforces minimum 44×44px hit area via padding (transparent if smaller content); `as` prop for semantic element
  - `<Modal>` — full-screen on portrait, dialog on landscape; trap focus; `prefers-reduced-motion` aware (instant vs spring transition)
  - `<Pill>` — small rounded badge with optional colour and icon (used for filters, status)
  - `<Avatar>` — circular, configurable size, profile colour border, initials fallback
  - `<IconButton>` — square 44×44 icon-only button
  - `<Skeleton>` — shimmer loader with `animate-pulse` (respects reduced motion)
  - `<EmptyState>` — icon + heading + body + optional CTA, used by every list view
- [ ] Storybook OR `/ui` dev route showcases each primitive with all variants
- [ ] All primitives gate animation behind `prefers-reduced-motion`
- [ ] All primitives are accessible: ARIA labels, focus rings, semantic elements

---

## Technical Implementation

### Files to create / modify

- `client/tailwind.config.cjs` — extend theme with token mapping
- `client/src/index.css` — `@font-face` for Inter; CSS custom properties on `:root` and `[data-theme=dark]`
- `client/public/fonts/Inter/*` — woff2 files (download or vendor)
- `client/src/shared/ui/Card.tsx`
- `client/src/shared/ui/Button.tsx`
- `client/src/shared/ui/TouchTarget.tsx`
- `client/src/shared/ui/Modal.tsx`
- `client/src/shared/ui/Pill.tsx`
- `client/src/shared/ui/Avatar.tsx`
- `client/src/shared/ui/IconButton.tsx`
- `client/src/shared/ui/Skeleton.tsx`
- `client/src/shared/ui/EmptyState.tsx`
- `client/src/shared/ui/index.ts` — re-export
- `client/src/shared/ui/__gallery__.tsx` — dev route at `/ui` showing every primitive
- `client/tests/shared/ui/*.test.tsx` — RTL tests for key behaviours

### Implementation steps

1. Vendor Inter woff2 files (Bold/SemiBold/Regular/Medium) into `client/public/fonts/Inter/`. Add `@font-face` declarations in `client/src/index.css` with `font-display: swap`.
2. Extend `tailwind.config.cjs`:
```js
theme: {
  extend: {
    colors: {
      'bg-warm': 'var(--color-bg-warm)',
      surface: 'var(--color-surface)',
      'text-primary': 'var(--color-text-primary)',
      // … all tokens use CSS custom properties so runtime theme/profile overrides work
      profile: { 1: 'var(--profile-1)', 2: 'var(--profile-2)', /* … 12 */ },
      alert: { urgent: 'var(--alert-urgent)', warning: 'var(--alert-warning)', info: 'var(--alert-info)', success: 'var(--alert-success)' },
      mode: { home: '#…', calendar: '#…', food: '#…', /* per PRD §6 */ },
    },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    fontSize: {
      display: 'var(--text-display)',
      h1: 'var(--text-h1)', h2: 'var(--text-h2)',
      body: 'var(--text-body)', caption: 'var(--text-caption)',
    },
    borderRadius: { card: 'var(--radius-card)', button: 'var(--radius-button)' },
  },
}
```
3. Populate `:root` in `index.css` with all referenced custom properties (warm-white background `#FBF5EC` matches `home_.png` and `food.png`).
4. Author each primitive as a typed React component using `forwardRef` where ref forwarding matters. Use `clsx` (install) for conditional classes.
5. `<TouchTarget>` polymorphic via `as` prop — renders `<button>` by default; ensures `min-h-11 min-w-11` (44px) and centres content.
6. `<Modal>`: use `react-focus-lock` (install) for focus trap; close on Escape; portal via `react-dom`. Detect `prefers-reduced-motion: reduce` via `useReducedMotion()` from `framer-motion` (install) and swap spring transitions for instant.
7. `<Skeleton>`: animate via Tailwind `animate-pulse` (default), but apply `motion-reduce:animate-none` Tailwind utility so reduced-motion users see a static skeleton.
8. Build a dev-only route `/ui` mounted only when `import.meta.env.DEV` showing each primitive in all variants.
9. Author RTL tests: `<TouchTarget>` size assertion (compute style), `<Button>` loading/disabled, `<Modal>` Escape close, `<Avatar>` initials fallback.

### Key technical details

- PRD §6 "UI Style Direction" defines the warm/calm aesthetic — match `home_.png` (cream backgrounds, pill filters, soft shadows, 24px-radius cards).
- Architecture NFR-006 specifies WCAG 2.1 AA: minimum tap target 44×44px, contrast 4.5:1.
- Architecture NFR-008 specifies 18px body and the larger display sizes for legibility at 1.5m.
- All radii, font sizes, and colours must be CSS custom properties so per-profile overrides (text-size, colour-blind palette in STORY-18.4 / STORY-18.7) work at runtime by toggling a class on `<html>`.
- 12 profile colours: pull from PRD §6 — typically a balanced palette like coral, peach, sage, teal, periwinkle, lilac, plum, rose, sand, ochre, sky, mint. Provide both default and Wong/Okabe-Ito (colour-blind safe) palettes — colour-blind toggle lands in STORY-18.7.
- Mode accent colours match the navbar icons in `home_.png` and `food.png` (orange "Food", red "Family", etc.).
- `<Avatar>` border colour comes from the active profile's `colour` field; the component receives a `colour` prop.

---

## Dependencies

- **Blocked by:** STORY-1.6
- **Blocks:** STORY-2.6, STORY-2.7, STORY-2.8, STORY-3.x, every UI module

---

## Test Checklist

- [ ] Unit: `<TouchTarget>` rendered as `<button>` has `min-height` ≥ 44px (computed style)
- [ ] Unit: `<Modal>` Escape closes; focus is trapped while open
- [ ] Unit: `<Button loading>` shows spinner and disables click
- [ ] Unit: `<Avatar>` with no `src` shows uppercase initials of `name`
- [ ] Unit: `<Skeleton>` applies `animate-pulse` and `motion-reduce:animate-none`
- [ ] Manual: `/ui` route renders every primitive at every variant; visually matches the warm/calm direction in `home_.png`
- [ ] Manual: setting `prefers-reduced-motion: reduce` in OS removes spring transitions in `<Modal>`
- [ ] Lighthouse a11y on `/ui` ≥ 95

---

## Notes

- This is the largest non-feature story in Sprint 2 — invest in it; it pays off across every subsequent module.
- Storybook is optional; the `/ui` gallery route is sufficient for MVP.
- Day card, alert pill, and filter pill specific styles arrive in their respective module stories — the primitives here are foundational, not feature-finished.

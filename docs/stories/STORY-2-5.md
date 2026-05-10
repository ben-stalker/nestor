# STORY-2.5: Design system tokens and core primitives

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** L (3d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** Tailwind tokens (colours, spacing, type scale, radii, shadows) and a small set of primitive components
**So that** all modules look and feel consistent and meet readability/accessibility targets

---

## Acceptance Criteria

- [x] Tailwind theme defines:
  - Background tokens: `bg-warm` (`#FBF5EC` warm-white per `home_.png`), `bg-warm-dark` (deep warm grey for dark mode), `surface` (`#FFFFFF`), `surface-elev` (subtle shadow)
  - Text tokens: `text-primary`, `text-secondary`, `text-muted`
  - 9 mode accent colours (one per nav mode): `home`, `calendar`, `food`, `vehicles`, `family`, `house`, `finance`, `pets`, `ev`, `board` (10 nav modes — one accent each; `home` and `board` may share neutral)
  - 12 profile colours (per PRD §6; e.g. `profile-1` … `profile-12`) — vibrant but accessible
  - Alert colours: `alert-urgent` (red), `alert-warning` (amber), `alert-info` (blue), `alert-success` (green)
- [x] Type scale CSS custom properties driven by `--base-font-size` (default `18px`):
  - `--text-display: clamp(3rem, 5vw, 4.5rem)`
  - `--text-h1: 2rem`
  - `--text-h2: 1.5rem`
  - `--text-body: var(--base-font-size)`
  - `--text-caption: 0.875rem`
  - All Tailwind `text-*` utilities map to these via `@theme` extension
- [x] Radii: `--radius-card: 24px`, `--radius-button: 16px`
- [x] Inter typeface self-hosted via `@fontsource/inter` (weight 400/500/600/700/800), loaded via CSS imports in `index.css`
- [x] Primitive components in `client/src/shared/ui/`:
  - `<Card>` — radius 24, surface bg, configurable padding (`sm`/`md`/`lg`), optional shadow
  - `<Button>` — radius 16, variants `primary`/`secondary`/`ghost`/`danger`, sizes `sm`/`md`/`lg`, loading state, disabled state
  - `<TouchTarget>` — wraps interactive children, enforces minimum 44×44px hit area via `min-h-11 min-w-11`; `as` prop for semantic element
  - `<Modal>` — full-screen on portrait, dialog on landscape; `react-focus-lock` focus trap; `prefers-reduced-motion` aware; Escape closes
  - `<Pill>` — small rounded badge with optional colour and icon
  - `<Avatar>` — circular, configurable size, profile colour border, initials fallback
  - `<IconButton>` — square 44×44 icon-only button with `aria-label`
  - `<Skeleton>` — shimmer loader with `animate-pulse` and `motion-reduce:animate-none`
  - `<EmptyState>` — icon + heading + body + optional CTA
- [x] `/ui` dev route (lazy-loaded, DEV-only) showcases each primitive with all variants
- [x] All primitives gate animation behind `prefers-reduced-motion` (via `useReducedMotion` hook)
- [x] All primitives are accessible: ARIA labels, focus rings, semantic elements

---

## Technical Implementation

### Files created / modified

- `client/src/index.css` — Tailwind v4 `@theme` tokens; `@fontsource/inter` imports; dark-mode overrides on `[data-theme=dark]`
- `client/src/hooks/useReducedMotion.ts` — hook wrapping `matchMedia('prefers-reduced-motion: reduce')`
- `client/src/shared/ui/Card.tsx`
- `client/src/shared/ui/Button.tsx`
- `client/src/shared/ui/TouchTarget.tsx`
- `client/src/shared/ui/Modal.tsx`
- `client/src/shared/ui/Pill.tsx`
- `client/src/shared/ui/Avatar.tsx`
- `client/src/shared/ui/IconButton.tsx`
- `client/src/shared/ui/Skeleton.tsx`
- `client/src/shared/ui/EmptyState.tsx`
- `client/src/shared/ui/index.ts` — re-exports all primitives
- `client/src/shared/ui/__gallery__.tsx` — dev route showing every primitive
- `client/src/App.tsx` — lazy `/ui` route (DEV-only)
- `client/tests/shared/ui/Button.test.tsx`
- `client/tests/shared/ui/TouchTarget.test.tsx`
- `client/tests/shared/ui/Modal.test.tsx`
- `client/tests/shared/ui/Avatar.test.tsx`
- `client/tests/shared/ui/Skeleton.test.tsx`

### Notes

- Tailwind v4 uses CSS `@theme` (no `tailwind.config.cjs`); story requirement for `.cjs` file was written for v3.
- `@fontsource/inter` achieves self-hosting: Vite bundles woff2 files into dist.
- `useReducedMotion` implemented as a lightweight hook (no framer-motion dependency).
- 33 new client tests (57 total; 185 server total).

---

## Test Checklist

- [x] Unit: `<TouchTarget>` has `min-h-11` and `min-w-11` classes
- [x] Unit: `<Modal>` Escape closes; aria-modal set; backdrop click closes
- [x] Unit: `<Button loading>` shows spinner and disables click
- [x] Unit: `<Avatar>` with no `src` shows uppercase initials of `name`
- [x] Unit: `<Skeleton>` applies `animate-pulse` and `motion-reduce:animate-none`

---

## Dependencies

- **Blocked by:** STORY-1.6 ✓
- **Blocks:** STORY-2.6, STORY-2.7, STORY-2.8, STORY-3.x, every UI module

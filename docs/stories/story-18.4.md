# STORY-18.4: Accessibility tokens + per-profile text size

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a developer, I want the design system to honour `--base-font-size` per profile, so that grandparent profiles see larger text.

## Acceptance Criteria
- [x] CSS custom property `--base-font-size` set on `<html>` from active profile
- [x] All text uses `rem` units only — CSS variables drive scale via `--base-font-size` on `:root`
- [x] High-contrast CSS class on `<html>` via `data-high-contrast='true'`
- [x] Colour-blind palette CSS class on `<html>` via `data-colour-blind='{mode}'`
- [x] Reduced-motion swaps transitions for instant via `data-reduced-motion='true'`
- [x] `<TouchTarget>` enforces 44×44 minimum (already via `min-h-11 min-w-11`)

## Implementation Notes
- `applyProfileSettings()` extended to accept `globalSettings` parameter
- Sets `data-high-contrast`, `data-reduced-motion`, `data-colour-blind` on `<html>`
- Per-profile: `data-text-size` (small/default/large/xlarge → --base-font-size 15/18/22/26px)
- Per-profile: `data-simplified-nav` 
- Global: high-contrast, reduced-motion, colour-blind-palette from `app_settings`
- `ProfileProvider` passes `useAppSettings()` data to `applyProfileSettings`
- High-contrast CSS: overrides all colour tokens for black-on-white / white-on-black
- Reduced-motion CSS: disables all animations/transitions to 0.01ms

## Files Changed
- `client/src/core/applyProfileSettings.ts` (extend with globalSettings param)
- `client/src/core/ProfileProvider.tsx` (pass settings to applyProfileSettings)
- `client/src/index.css` (high-contrast, reduced-motion CSS rules)

# STORY-18.7: Colour-blind safe palette toggle

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a colour-blind user, I want an alternative palette for profile colours, so that distinct colours remain distinguishable.

## Acceptance Criteria
- [x] Alternative 12-colour palette (Wong / Okabe-Ito accessible set)
- [x] Toggle in Accessibility panel (already built in Epic 17)
- [x] All places using profile colours use a CSS variable so swap is instant

## Implementation Notes
- Three palettes: deuteranopia, protanopia (same remapping — both are red-green deficiencies), tritanopia
- CSS variables in `index.css` under `[data-colour-blind='deuteranopia']` etc.
- Sources: Wong (2011) Nature Methods; Okabe & Ito (2008)
- Also remaps mode accent colours and alert colours for affected variables
- `applyProfileSettings` sets `data-colour-blind` on `<html>` from `app_settings.colour_blind_palette`
- Profile colours 1–12 all use CSS variables (`--color-profile-N`) → swap is instant on setting change

## Files Changed
- `client/src/index.css` (colour-blind palette CSS rules)
- `client/src/core/applyProfileSettings.ts` (data-colour-blind attribute)

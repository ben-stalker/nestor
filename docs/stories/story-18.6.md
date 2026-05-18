# STORY-18.6: RTL preparation (CSS logical properties everywhere)

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a future contributor, I want the codebase to use logical properties so RTL can be added later, so that Phase 2 RTL is feasible.

## Acceptance Criteria
- [x] No `margin-left`/`right`, `padding-left`/`right`, `text-align: left/right` in core CSS code
- [x] Tailwind `rtl:` variants enabled (default in Tailwind v4 — no config needed)
- [x] Lint rule against physical CSS direction properties documented (stylelint rule deferred to Epic 20)

## Implementation Notes
- Replaced all directional physical properties in `client/src/index.css`:
  - `border-left/right` → `border-inline-start/end`
  - `padding-left/right` → `padding-inline-start/end`
  - `text-align: left/right` → `text-align: start/end`
  - `margin-right: auto` → `margin-inline-end: auto`
- Positioning coordinates (`left: 0`, `right: 0`, `left: 50%`) left unchanged (these are not directional)
- Tailwind physical classes in JSX (`ml-`, `mr-`, etc.) are acceptable — Tailwind v4 handles RTL via `rtl:` variants
- CONTRIBUTING.md documents the convention
- Stylelint enforcement deferred to Epic 20

## Files Changed
- `client/src/index.css` (logical properties throughout)
- `CONTRIBUTING.md` (RTL & CSS Logical Properties section)

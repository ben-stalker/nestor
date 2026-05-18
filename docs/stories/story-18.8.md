# STORY-18.8: Simplified navigation mode (per profile)

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a less-tech-comfortable user, I want a simpler nav with fewer modes and bigger buttons, so that I'm not overwhelmed.

## Acceptance Criteria
- [x] Profile flag `simplified_nav` collapses nav to: Home + Calendar + Board + Contacts
- [x] Larger button sizes (88×88 minimum)
- [x] Reduced information density (fewer modes shown)

## Implementation Notes
- NavBar detects simplified mode from two sources: `activeProfile.simplified_nav === 1` OR `app_settings.simplified_nav_global`
- `SIMPLIFIED_MODE_IDS = ['home', 'calendar', 'board', 'contacts']` — 4 core modes
- `NavButton` receives `simplified` prop: enlarges button to 88×88, icon to 36px, text-body size
- Simplified mode always uses `'scrollable'` layout (ignores nav_layout setting)
- Hamburger layout is bypassed in simplified mode (all modes visible)
- Both portrait and landscape rails respect simplified flag
- `data-simplified-nav='true'` on `<html>` already handled by `applyProfileSettings` (labels hidden via CSS)
- Global toggle available via Admin → Accessibility → "Simplified navigation"

## Files Changed
- `client/src/core/NavBar.tsx` (isSimplified logic, NavButton simplified prop, layout overrides)

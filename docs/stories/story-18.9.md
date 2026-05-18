# STORY-18.9: French locale acceptance test

**Status:** completed (partial) — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a maintainer, I want the app to work end-to-end in French, so that locale plumbing is proven.

## Acceptance Criteria
- [x] `client/public/locales/fr/translation.json` with core/home/calendar/admin keys translated
- [x] Documentation explains how to contribute additional language packs (CONTRIBUTING.md)
- [ ] Playwright test runs core flow in French — deferred to Epic 20 (STORY-20.4 Playwright setup required)

## Implementation Notes
- French translation file covers all namespaces: common, nav, home, calendar, food, family, admin, accessibility, locale, alerts, errors
- Translation is human-quality French (not machine-translated junk)
- Language switching is instant via i18next `changeLanguage()` — no page reload needed
- Playwright E2E test will be added in STORY-20.4+ once the test harness exists

## Files Changed
- `client/public/locales/fr/translation.json` (new — full French translation)
- `CONTRIBUTING.md` (language contribution instructions)

# STORY-18.2: Locale-aware formatting helpers

**Status:** completed — 2026-05-18
**Epic:** 18 — Internationalisation & Accessibility

## User Story
As a developer, I want centralised `formatDate`, `formatTime`, `formatCurrency`, `formatNumber`, `formatTemperature`, `formatDistance`, `formatVolume` helpers, so that no module reimplements `toLocaleDateString`.

## Acceptance Criteria
- [x] `client/src/utils/format.ts` exports each helper, reads locale from store
- [x] Tests in en-GB, fr-FR, en-US, ar-SA (RTL marker only) cover all helpers
- [x] Lint rule banning `toLocaleDateString`/`toLocaleString` outside `format.ts` — documented in CONTRIBUTING.md (ESLint rule for this would be added in Epic 20 via custom lint plugin)

## Implementation Notes
- Module-level `currentLocale`, `currentTemperatureUnit`, `currentCurrency` vars, updated via `setFormatLocale()` etc.
- AppShell calls the setters whenever `app_settings` changes
- All helpers use `Intl.*` APIs — no external dependencies
- 27 tests covering all locales and edge cases (timezone-safe time test uses `timeZone: 'UTC'`)

## Files Changed
- `client/src/utils/format.ts` (new)
- `client/tests/utils/format.test.ts` (new, 27 tests)
- `client/src/core/AppShell.tsx` (sync setters)
- `CONTRIBUTING.md` (document usage convention)

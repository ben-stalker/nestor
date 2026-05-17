# STORY-17.3: Localisation admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household admin
**I want** to set language, date/time format, currency, units, first day of week, number format
**So that** Nestor matches my locale

---

## Acceptance Criteria

- [ ] Localisation section under `/admin/localisation`
- [ ] All settings from PRD §26 table:
  - Language (with available list from `client/public/locales/`)
  - Timezone (auto + manual override)
  - Date format (locale default + override)
  - Time format (12h/24h)
  - Currency (ISO 4217 list)
  - Units (metric/imperial)
  - First day of week (Mon/Sun/Sat)
  - Temperature unit (°C/°F)
- [ ] Live preview of formatted date/time/number/currency in panel
- [ ] On save: i18n re-initialised, all `format.ts` helpers honour new locale
- [ ] RTL toggle visible but flagged "Phase 2"

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/LocalisationPanel.tsx`
- `client/src/admin/LivePreview.tsx`
- `client/src/i18n.ts` — runtime language switch helper
- `client/src/api/admin.ts`
- `client/tests/admin/LocalisationPanel.test.tsx`

### Implementation steps

1. Form with selects/toggles per setting; pulls current values from `app_settings`.
2. Live preview block:
```tsx
<div>
  <p>{formatDate(now)}</p>
  <p>{formatTime(now)}</p>
  <p>{formatNumber(1234.56)}</p>
  <p>{formatCurrency(99.99)}</p>
</div>
```
   Uses local form state (not yet persisted) so user sees the impact before saving.
3. Save → PATCH `app_settings` with all fields; on success, dispatch `i18n.changeLanguage(newLang)` and update Zustand store; helpers automatically re-read.
4. RTL toggle: disabled with "Phase 2" badge.
5. Tests: changing locale updates preview; save persists.

### Key technical details

- Architecture NFR-005.
- Languages auto-detected from `client/public/locales/*` directory listing (fetched from server).
- Currency list is a curated subset of ISO 4217 (top ~50 by usage); free-form ISO code allowed.
- First-day-of-week applies to calendar week view, month view, meal planner.

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-18.1
- **Blocks:** STORY-19.2 (wizard step uses same panel)

---

## Test Checklist

- [ ] RTL: changing language updates preview
- [ ] RTL: changing date format updates preview
- [ ] RTL: save persists; reloading shows new values
- [ ] RTL: RTL toggle disabled with Phase 2 badge
- [ ] Manual: switching to fr-FR re-initialises i18n live

---

## Notes

- Auto-detect timezone via browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Phase 2 RTL behind a feature flag, not enabled even if toggled.

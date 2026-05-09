# STORY-18.2: Locale-aware formatting helpers

**Epic:** EPIC-18: Internationalisation & Accessibility
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** centralised `formatDate`, `formatTime`, `formatCurrency`, `formatNumber`, `formatTemperature`, `formatDistance`, `formatVolume` helpers
**So that** no module reimplements `toLocaleString`

---

## Acceptance Criteria

- [ ] `client/src/utils/format.ts` exports each helper, reading active locale from `useAppStore` (or directly via i18n)
- [ ] Helpers internally use `Intl.DateTimeFormat`, `Intl.NumberFormat` and `date-fns-tz` for timezone conversion
- [ ] Tests in en-GB, fr-FR, en-US, ar-SA (RTL marker only) cover each helper
- [ ] Lint rule (`no-restricted-syntax`) bans `toLocaleDateString` and `toLocaleString` outside `format.ts`
- [ ] `formatTemperature` and `formatDistance` honour `app_settings.units` (`metric`/`imperial`)
- [ ] `formatCurrency` uses `app_settings.currency` (ISO 4217)
- [ ] Server mirror in `server/src/utils/format.ts` for alert messages and TTS strings

---

## Technical Implementation

### Files to create / modify

- `client/src/utils/format.ts`
- `client/src/utils/format.test.ts`
- `server/src/utils/format.ts` (server-side mirror)
- `.eslintrc.json` — add `no-restricted-syntax` rule
- `client/src/store/appStore.ts` — expose `locale`, `timezone`, `units`, `currency`

### Implementation steps

1. Define helper signatures:
```ts
export function formatDate(d: Date | number, opts?: Intl.DateTimeFormatOptions): string;
export function formatTime(d: Date | number, opts?: Intl.DateTimeFormatOptions): string;
export function formatCurrency(amount: number, currency?: string): string;
export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string;
export function formatTemperature(c: number): string; // -> "12°C" or "54°F"
export function formatDistance(km: number): string;   // -> "12 km" or "7.5 mi"
export function formatVolume(litres: number): string;
```
2. Each helper reads locale from `useAppStore.getState().locale` synchronously (so non-React code works).
3. Use `formatInTimeZone(d, tz, fmt)` from `date-fns-tz` for timezone-aware date/time formatting; fall back to `Intl.DateTimeFormat` with `timeZone` option.
4. `formatTemperature(c)`: if `units==='imperial'`, convert `c*9/5+32` and append `°F`.
5. `formatDistance(km)`: if `units==='imperial'`, convert `km*0.621371` and append `mi`.
6. `formatVolume(l)`: imperial → `gallons` (US) or `pints`; pick gallons US (default for now).
7. Lint rule:
```json
"no-restricted-syntax": ["error", {
  "selector": "CallExpression[callee.property.name=/^(toLocaleDateString|toLocaleTimeString|toLocaleString)$/]",
  "message": "Use format.ts helpers instead"
}]
```
   - Allow inside `format.ts` via override.
8. Tests with multiple locales — assert exact output strings.

### Key technical details

- Architecture NFR-005 (i18n) — single helper module is the contract.
- Tests pin locale data (`Intl` is locale-sensitive); use `'en-GB'`, `'fr-FR'`, `'en-US'`, `'ar-SA'`.
- `formatCurrency` must handle missing currency gracefully (default to GBP from settings).
- The server mirror is a drop-in port — reused for alert messages so emails/SMS/TTS get correct locale.

---

## Dependencies

- **Blocked by:** STORY-18.1
- **Blocks:** every UI story that displays a date/time/number/currency (3.x, 4.x, 5.x, 8.x, 9.x, …)

---

## Test Checklist

- [ ] Unit: `formatDate` in en-GB → "10 May 2026"
- [ ] Unit: `formatDate` in en-US → "May 10, 2026"
- [ ] Unit: `formatTime` in en-GB → "14:30"; en-US → "2:30 PM"
- [ ] Unit: `formatCurrency(12.5, 'GBP')` → "£12.50" in en-GB
- [ ] Unit: `formatCurrency(12.5, 'EUR')` in fr-FR → "12,50 €"
- [ ] Unit: `formatTemperature(20)` metric → "20°C"; imperial → "68°F"
- [ ] Unit: `formatDistance(10)` metric → "10 km"; imperial → "6.2 mi"
- [ ] Unit: lint rule fires on `new Date().toLocaleString()` in non-format file

---

## Notes

- Decision: number formatting locale comes from i18n locale, NOT a separate `numberLocale` setting (PRD §26 keeps these aligned).
- Imperial unit choice (US gallons vs UK gallons) is parked — defaulting to US for now; surface as a setting if community asks.

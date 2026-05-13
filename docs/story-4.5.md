# STORY-4.5: Google Calendar CalDAV Adapter with OAuth2 + QR Pairing

**Epic:** 4 — Calendar Module  
**Status:** ✅ Complete  
**Priority:** P1  
**Estimate:** XL  
**Completed:** 2026-05-13

## Summary

Implements a Google Calendar CalDAV adapter using OAuth2 device-code flow so users can pair their Google account by scanning a QR code on their phone — no URL typing needed on a touchscreen.

## What Was Built

### Server

**`server/src/services/calendar/google/deviceCodeStore.ts`**
- In-memory TTL store for pending OAuth device codes
- Auto-cleanup interval (every 60 s) removes expired entries
- Exports: `storePendingCode`, `getPendingCode`, `removePendingCode`, `clearAll` (test helper)

**`server/src/services/calendar/GoogleCalDAVProvider.ts`**
- Implements `CalendarProvider` interface for Google accounts
- `pull()`: retrieves credentials, auto-refreshes access token if within 60 s of expiry, then uses `tsdav.createDAVClient()` to fetch all calendars and their objects, parses VEVENT components via ical.js into `RawEvent[]`
- `push()`: no-op (read-only CalDAV sync)
- `testCredentials()`: sends a PROPFIND to the CalDAV base URL and checks 200/207

**`server/src/routes/googleCalendar.ts`**
- `POST /api/v1/calendar/accounts/google/start`
  - Reads client ID from `app_settings.google_oauth_client_id` or `GOOGLE_OAUTH_CLIENT_ID` env
  - Calls Google Device Authorization endpoint
  - Generates QR-code PNG (data URL) of the `verification_url`
  - Stores pending code in device code store with expiry TTL
  - Returns `{ deviceCode, verificationUrl, qrPng }`
- `GET /api/v1/calendar/accounts/google/poll/:deviceCode`
  - Returns `{ status: 'pending' }` while authorization pending
  - Returns `{ status: 'pending', retryAfter }` on `slow_down`
  - Returns 410 on `access_denied`, `expired_token`, or unknown/expired device code
  - On success: discovers user email via `userinfo`, builds CalDAV URL, creates `CalendarAccount` with encrypted credentials, fires first sync in background
  - Returns `{ status: 'authorized', accountId }`

**`server/src/db/settings-keys.ts`**
- Added `google_oauth_client_id` and `google_oauth_client_secret` keys with `z.string()` schemas

**`server/src/types/ical.d.ts`**
- Custom ambient module declaration for `ical.js` enabling CJS imports without TypeScript ESM/CJS boundary errors (TS1479/TS1541)
- Also fixes pre-existing typecheck issue in `recurrenceExpander.ts`

**`server/src/app.ts`**
- Instantiates `GoogleCalDAVProvider` and registers it under `'google'` in the provider registry
- Mounts the Google Calendar router

### Packages Added
- `tsdav` — CalDAV client (has CJS build)
- `qrcode` — QR code PNG generation
- `@types/qrcode` — TypeScript types for qrcode

## Acceptance Criteria

- [x] OAuth2 device-code flow; client ID via `app_settings.google_oauth_client_id` (or env)
- [x] `POST /api/v1/calendar/accounts/google/start` returns `{ deviceCode, verificationUrl, qrPng }`
- [x] Wizard polls `GET /api/v1/calendar/accounts/google/poll/:deviceCode`
- [x] On success: tokens stored encrypted; CalDAV URL built from discovered email
- [x] First sync runs immediately (background void)
- [x] Refresh token used to refresh access token before expiry (60 s buffer)
- [x] Unit/integration tests with mocked Google endpoints

## Tests

9 new server tests in `server/tests/routes/googleCalendar.test.ts`:
- start route returns deviceCode, verificationUrl, and PNG QR code
- start returns 502 when Google endpoint fails
- start returns 500 when client ID not configured
- poll returns `pending` on authorization_pending
- poll returns `pending` with retryAfter on slow_down
- poll returns 410 on access_denied
- poll returns 410 on unknown device code
- poll creates account + fires sync on success (with email)
- poll creates account on success when userinfo fails (fallback URL)

**Total:** 336 server tests (327 before)

## Technical Notes

- Used device-code grant (not PKCE) — fits the kiosk use-case where users scan a QR on their phone
- `tsdav` used for CalDAV via dynamic `await import('tsdav')` in pull()
- ical.js ESM/CJS issue resolved by ambient module declaration in `server/src/types/ical.d.ts`
- `recurrenceExpander.ts` updated to import `Recur` type by name (was using `ICAL.Recur` namespace syntax)

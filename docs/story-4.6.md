# STORY-4.6: Apple iCloud + Yahoo CalDAV Adapters

**Epic:** 4 — Calendar Module  
**Status:** ✅ Complete  
**Priority:** P1  
**Estimate:** M  
**Completed:** 2026-05-13

## Summary

Implements Basic-auth CalDAV adapters for Apple iCloud and Yahoo Calendar using `tsdav`. Both adapters use username + app-specific password; credentials are encrypted at rest. Includes a `testCredentials` endpoint that verifies before saving.

## What Was Built

### Server

**`server/src/services/calendar/BasicAuthCalDAVProvider.ts`**
- `BasicAuthCalDAVProvider` class implementing `CalendarProvider`
- `pull()`: loads encrypted credentials, calls `tsdav.createDAVClient()` with Basic auth, fetches all calendars + objects, parses VEVENT components via ical.js
- `push()`: no-op (read-only CalDAV sync)
- `testCredentials()`: instantiates DAV client and fetches calendars; returns true on success, false on error
- Exported helpers `fetchBasicAuthCalDAV` and `testBasicAuthCalDAV` for use in routes/tests
- Constants: `APPLE_CALDAV_URL = 'https://caldav.icloud.com'`, `YAHOO_CALDAV_URL = 'https://caldav.calendar.yahoo.com'`

**`server/src/routes/basicCalendar.ts`**
- `POST /api/v1/calendar/accounts/basic/test` — verifies credentials without persisting; body: `{ provider, username, password, caldav_url? }`; returns `{ ok: boolean }`
- `POST /api/v1/calendar/accounts/basic` — creates account, stores credentials encrypted, triggers first sync in background; body: `{ provider, username, password, caldav_url?, display_name?, sync_interval_mins?, profile_id? }`; returns 201 with account object

**`server/src/app.ts`**
- `BasicAuthCalDAVProvider` instantiated for both `'apple'` and `'yahoo'` provider names and registered in the provider registry
- `createBasicCalendarRouter` mounted

## Acceptance Criteria

- [x] Form: provider, username, app-specific password, optional CalDAV URL override
- [x] `testCredentials` button verifies before saving (`POST /basic/test` → `{ ok: boolean }`)
- [x] Apple defaults to `https://caldav.icloud.com`
- [x] Yahoo defaults to `https://caldav.calendar.yahoo.com`
- [x] Credentials (username + password) encrypted at rest

## Tests

12 new server tests in `server/tests/routes/basicCalendar.test.ts`:
- test endpoint returns `{ ok: true }` for valid Apple credentials
- test endpoint returns `{ ok: false }` for invalid Yahoo credentials
- test endpoint respects custom `caldav_url` override
- test returns 400 on missing fields
- test returns 400 on invalid provider
- create Apple account with default URL → 201
- create Yahoo account with default URL → 201
- create account with custom CalDAV URL
- credentials stored encrypted (not returned in response)
- default display_name generated from provider + username
- first sync triggered after account creation
- returns 400 on missing password

**Total:** 348 server tests (336 before)

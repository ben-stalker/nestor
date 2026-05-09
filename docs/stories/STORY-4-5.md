# STORY-4.5: Google Calendar CalDAV adapter with OAuth2 + QR pairing

**Epic:** EPIC-4: Calendar Module
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** XL (5d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to add my Google Calendar by scanning a QR code on my phone
**So that** I don't have to type a long OAuth URL on a touchscreen

---

## Acceptance Criteria

- [ ] OAuth2 device flow (or PKCE-on-device) implemented; client ID via `app_settings.google_oauth_client_id` (or `NESTOR_GOOGLE_CLIENT_ID` env)
- [ ] `POST /api/v1/calendar/accounts/google/start` returns `{ deviceCode, userCode, verificationUrl, qrPng (data URL), expiresIn, interval }`
- [ ] Client polls `GET /api/v1/calendar/accounts/google/poll/:deviceCode` — returns `{ status: 'pending' | 'authorised' | 'expired' | 'denied', accountId? }`
- [ ] On success: tokens stored encrypted in `calendar_accounts.credentials_encrypted`; CalDAV URL discovered via DAV principal flow
- [ ] First sync runs immediately
- [ ] Refresh token used to refresh access token before expiry (built into adapter `pull()`)
- [ ] Unit/integration tests with mocked Google endpoints (`nock`)
- [ ] Allow-list `https://oauth2.googleapis.com`, `https://www.googleapis.com`, `https://apidata.googleusercontent.com/caldav/v2/` for STORY-20.6

---

## Technical Implementation

### Files to create / modify

- `server/src/services/calendar/GoogleProvider.ts`
- `server/src/routes/calendarAccounts.ts` — start/poll endpoints
- `server/src/services/calendar/oauth/googleDeviceFlow.ts`
- `server/src/utils/qr.ts` — wraps `qrcode` lib to PNG/data URL
- `server/tests/services/calendar/GoogleProvider.test.ts`

### Implementation steps

1. Implement Google OAuth Device Flow:
```ts
// POST https://oauth2.googleapis.com/device/code with client_id, scope=calendar.readonly
// returns device_code, user_code, verification_url, expires_in, interval
```
2. Render QR (using `qrcode` lib) for `verification_url_complete` (URL with prefilled user_code).
3. Poll endpoint POSTs to `https://oauth2.googleapis.com/token` with `grant_type=urn:ietf:params:oauth:grant-type:device_code` and the device code; response is access_token + refresh_token, OR `authorization_pending`/`slow_down`.
4. On success, persist `calendar_accounts` row with encrypted creds:
```json
{ "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_at": 1704067200 }
```
5. Discover CalDAV URL via DAV PROPFIND on `https://apidata.googleusercontent.com/caldav/v2/<email>/user` (use `tsdav`).
6. `GoogleProvider.pull(account)`:
   - Load creds; refresh if expired (`< now + 60s`).
   - Use `tsdav` to fetch events from primary calendar (initial: today − 30 days to today + 365 days; subsequent: incremental via `sync-token`).
   - Map iCal VEVENTs → `RawEvent` (uid, summary, dtstart, dtend, rrule, etag).
7. Token refresh: POST to token endpoint with grant_type=refresh_token; persist new access token, keep refresh token.
8. Tests with `nock`:
   - Device-flow start returns expected payload
   - Polling receives `authorization_pending` then `success`
   - Pull fetches, parses, returns events
   - Refresh flow swaps token

### Key technical details

- Architecture §"External Integrations".
- `tsdav` for CalDAV operations.
- Self-hosters must register their own Google OAuth client (instructions in `docs/google-oauth.md`); installs without a client ID show a setup-required banner.
- The QR encodes the `verification_url_complete` (Google's pre-filled user-code URL) so the phone goes directly to the consent screen.
- Tokens encrypted via `encrypt()` from STORY-1.8; never logged.

---

## Dependencies

- **Blocked by:** STORY-4.4, STORY-1.8
- **Blocks:** STORY-4.6 (Apple/Yahoo follows same pattern), STORY-19.3 (wizard step), STORY-17.4 (admin panel)

---

## Test Checklist

- [ ] Unit: device flow returns QR data URL
- [ ] Unit: polling pending then authorised
- [ ] Unit: polling expired returns expired status
- [ ] Unit: pull returns events with uid/etag
- [ ] Unit: token refresh on expired access token
- [ ] Unit: bad credentials → error logged, account not saved
- [ ] Integration (manual): real Google account end-to-end (one-off; not in CI)

---

## Notes

- Follows the architecture-defined pattern; later providers (4.6) reuse helpers.
- Push (write-back to Google) deferred to Phase 2 — sync is read-only for MVP.

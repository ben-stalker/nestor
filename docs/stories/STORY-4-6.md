# STORY-4.6: Apple iCloud + Yahoo CalDAV adapters

**Epic:** EPIC-4: Calendar Module
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to add my Apple iCloud or Yahoo calendar with an app-specific password
**So that** my non-Google calendar syncs too

---

## Acceptance Criteria

- [ ] `POST /api/v1/calendar/accounts` accepts `{ provider: 'apple'|'yahoo'|'custom', display_name, username, app_password, caldav_url? }`
- [ ] `testCredentials` button verifies before saving (calls adapter `testCredentials`)
- [ ] Apple defaults to `https://caldav.icloud.com`
- [ ] Yahoo defaults to `https://caldav.calendar.yahoo.com`
- [ ] Tokens/passwords encrypted at rest (via STORY-1.8)
- [ ] Custom provider accepts a manual CalDAV URL
- [ ] Unit tests with mocked CalDAV server

---

## Technical Implementation

### Files to create / modify

- `server/src/services/calendar/AppleProvider.ts`
- `server/src/services/calendar/YahooProvider.ts`
- `server/src/services/calendar/CustomProvider.ts`
- `server/src/services/calendar/basicAuthAdapter.ts` — shared base class
- `server/src/routes/calendarAccounts.ts` — extend with manual create/test endpoints
- `server/tests/services/calendar/AppleProvider.test.ts`

### Implementation steps

1. Base class `BasicAuthCalDAVAdapter`:
```ts
abstract class BasicAuthCalDAVAdapter implements CalendarProvider {
  protected abstract defaultUrl: string;
  async testCredentials(account) {
    const { username, password } = await getCreds(account);
    const url = account.caldav_url || this.defaultUrl;
    return tsdav.testCalDAV({ url, username, password });
  }
  async pull(account) {
    const url = account.caldav_url || this.defaultUrl;
    const client = new DAVClient({ serverUrl: url, credentials: { username, password }, authMethod: 'Basic' });
    await client.login();
    const calendars = await client.fetchCalendars();
    // for each, fetch events in range; flatten
  }
  push(/* phase 2 */) { throw new Error('not implemented'); }
}
```
2. `AppleProvider extends BasicAuthCalDAVAdapter` with `defaultUrl='https://caldav.icloud.com'`.
3. `YahooProvider` similarly.
4. `CustomProvider` requires `caldav_url`; no default.
5. Routes:
```ts
router.post('/accounts', requireAdmin, async (req, res) => {
  const input = AccountInput.parse(req.body);
  const provider = getProvider(input.provider);
  const ok = await provider.testCredentials({ caldav_url: input.caldav_url, ...input } as any);
  if (!ok) return res.status(400).json({ error: 'invalid_credentials' });
  const id = await accountRepo.create(input);
  await calendarService.syncAccount(id);
  res.status(201).json({ id });
});
router.post('/accounts/test', requireAdmin, async (req, res) => { /* same but no save */ });
```
6. Register providers at startup.
7. Tests with `nock` simulating CalDAV PROPFIND/REPORT responses.

### Key technical details

- Both providers share the basic auth pattern; only the default URL differs.
- App-specific password requirement for both (Apple ID + 2FA; Yahoo account key) — surface in UI hint text.
- iCloud quirk: principal URL is at `/<userid>/principal`; `tsdav` handles discovery.
- Custom provider for FastMail, Nextcloud, Synology, etc.

---

## Dependencies

- **Blocked by:** STORY-4.5 (registry + base patterns)
- **Blocks:** STORY-19.3 (wizard), STORY-17.4 (admin)

---

## Test Checklist

- [ ] Unit: Apple testCredentials with mocked DAV success
- [ ] Unit: Yahoo testCredentials with mocked failure (401)
- [ ] Unit: Custom provider with explicit URL
- [ ] Unit: account persisted with encrypted password
- [ ] Manual: real iCloud account roundtrip (off-CI)

---

## Notes

- App-specific passwords are required because both Apple and Yahoo enforce 2FA — main account password won't work.
- Add doc note "for Apple, generate at appleid.apple.com → App-Specific Passwords".

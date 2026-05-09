# STORY-4.4: Calendar service module skeleton + sync interface

**Epic:** EPIC-4: Calendar Module
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a `CalendarService` with `syncAccount()` interface and a no-op default provider
**So that** sync can be plugged in per provider without changing the schedule wiring

---

## Acceptance Criteria

- [ ] `CalendarService.syncAccount(accountId)` looks up account, picks provider adapter, runs `pull(account)`, upserts events by `caldav_uid`
- [ ] Provider adapter interface declared:
```ts
interface CalendarProvider {
  pull(account: CalendarAccount): Promise<RawEvent[]>;
  push(account: CalendarAccount, event: CalendarEvent): Promise<void>;
  testCredentials(account: CalendarAccount): Promise<boolean>;
}
```
- [ ] Default `LocalProvider` no-ops (used as fallback for `provider='custom'` accounts not configured)
- [ ] `last_sync_at` updated on success; `last_sync_error` populated on failure
- [ ] Scheduler job triggers `syncAllAccounts` at interval from `app_settings.calendar_sync_interval_mins` (default 15)
- [ ] Emits `calendar:synced` event on success
- [ ] Unit tests with mock provider

---

## Technical Implementation

### Files to create / modify

- `server/src/services/CalendarService.ts`
- `server/src/services/calendar/CalendarProvider.ts` — interface
- `server/src/services/calendar/LocalProvider.ts`
- `server/src/services/calendar/providerRegistry.ts` — `registerProvider(name, provider)`
- `server/src/scheduler/jobs/calendarSync.ts`
- `server/tests/services/CalendarService.test.ts`

### Implementation steps

1. Interface and registry:
```ts
const providers = new Map<string, CalendarProvider>();
export function registerProvider(name: string, p: CalendarProvider) { providers.set(name, p); }
export function getProvider(name: string): CalendarProvider {
  return providers.get(name) ?? new LocalProvider();
}
```
2. `LocalProvider`: methods return empty arrays / true / no-op.
3. `CalendarService.syncAccount(accountId)`:
   - Load account; if `active=0` skip.
   - `provider = getProvider(account.provider)`.
   - `try { events = await provider.pull(account); for each event upsertByCaldavUid; markSynced(); bus.emit('calendar:synced', {accountId}); } catch (e) { markSynced(id, error); }`
4. `syncAllAccounts()`: list active accounts, loop with `Promise.allSettled`.
5. Scheduler job (`*/15 * * * *` initially; reconfigurable on settings change): calls `syncAllAccounts`.
6. Tests: register mock provider returning 2 events, run syncAccount, assert events upserted, last_sync_at set; provider throws → last_sync_error set.

### Key technical details

- Architecture §"Component 3: Calendar Service".
- Providers ship per concrete adapter (Google/Apple/Yahoo in 4.5/4.6).
- `RawEvent` shape: minimal CalDAV fields; mapping to `CalendarEvent` happens in `CalendarService`.
- The `caldav_uid` is unique per account (compound unique index from STORY-4.1) — upsert is INSERT OR REPLACE on `(account_id, caldav_uid)`.
- Sync interval changes hot-reload by restarting the cron job entry on `settings:updated` event.

---

## Dependencies

- **Blocked by:** STORY-4.1, STORY-1.11
- **Blocks:** STORY-4.5 (Google adapter), STORY-4.6 (Apple/Yahoo adapter), STORY-19.3 (wizard calendars)

---

## Test Checklist

- [ ] Unit: registered provider invoked on syncAccount
- [ ] Unit: events upsert by caldav_uid (no duplicates on second sync)
- [ ] Unit: provider throw → markSynced(id, error)
- [ ] Unit: success emits calendar:synced
- [ ] Unit: LocalProvider fallback returns []
- [ ] Unit: syncAllAccounts continues if one account fails (Promise.allSettled)

---

## Notes

- Push (write-back) is included in the interface but is Phase 2 — MVP is read-only sync.
- `testCredentials` is used by the wizard before saving an account.

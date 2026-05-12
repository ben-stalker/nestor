# STORY-4.1: Calendar accounts and events schema

**Epic:** EPIC-4: Calendar Module
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** developer
**I want** the `calendar_accounts` and `calendar_events` tables with indexes
**So that** events can be stored and queried efficiently

---

## Acceptance Criteria

- [x] Migration `server/migrations/005_calendar.sql` creates `calendar_accounts` per Architecture §"Data Model": `id INTEGER PRIMARY KEY`, `provider TEXT NOT NULL CHECK(provider IN ('google','apple','yahoo','custom'))`, `display_name TEXT NOT NULL`, `caldav_url TEXT`, `credentials_encrypted TEXT NOT NULL`, `sync_interval_mins INTEGER NOT NULL DEFAULT 15`, `last_sync_at INTEGER`, `last_sync_error TEXT`, `profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE`, `active INTEGER NOT NULL DEFAULT 1`
- [x] Same migration creates `calendar_events`: `id INTEGER PRIMARY KEY`, `title TEXT NOT NULL`, `start_datetime INTEGER NOT NULL` (epoch ms UTC), `end_datetime INTEGER NOT NULL`, `all_day INTEGER NOT NULL DEFAULT 0`, `profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL`, `source TEXT NOT NULL CHECK(source IN ('local','caldav','plugin'))`, `caldav_uid TEXT`, `caldav_etag TEXT`, `account_id INTEGER REFERENCES calendar_accounts(id) ON DELETE CASCADE`, `type TEXT NOT NULL DEFAULT 'default' CHECK(type IN ('default','wfh','shift','nursery_drop','vehicle_booking','vet','custody','school_term'))`, `recurring_rule TEXT`, `colour_override TEXT`, `notes TEXT`, `created_at INTEGER NOT NULL`
- [x] Indexes: `idx_events_profile_date`, `idx_events_account`, `idx_events_caldav_uid` (unique with account_id where source='caldav')
- [x] `CalendarAccountRepository` and `EventRepository` extend `BaseRepository` with full CRUD + `EventRepository.findInRange(start, end, profileIds[])`
- [x] `findInRange` returns events where `[start_datetime, end_datetime]` intersects the requested range; profile filter optional
- [x] CalDAV credentials encrypted via `encrypt()` from STORY-1.8 on write; decrypted on read
- [x] Unit tests cover all methods and the encryption round-trip

---

## Technical Implementation

### Files to create / modify

- `server/migrations/004_calendar.sql`
- `server/src/repositories/CalendarAccountRepository.ts`
- `server/src/repositories/EventRepository.ts`
- `server/src/types/calendar.ts` — types + Zod schemas
- `server/tests/repositories/CalendarAccountRepository.test.ts`
- `server/tests/repositories/EventRepository.test.ts`

### Implementation steps

1. Author migration SQL exactly per AC, including:
```sql
CREATE INDEX idx_events_profile_date ON calendar_events(profile_id, start_datetime);
CREATE INDEX idx_events_account ON calendar_events(account_id);
CREATE UNIQUE INDEX idx_events_caldav_uid ON calendar_events(account_id, caldav_uid) WHERE caldav_uid IS NOT NULL;
```
2. Define typed `CalendarEvent`, `CalendarAccount`, plus `EventInput` and `AccountInput` with Zod.
3. `CalendarAccountRepository`:
   - `list()` — returns accounts with credentials decrypted (or with `credentials_encrypted` opaque, exposed via separate method `getCredentials(id)`).
   - `create(input)` — validate; encrypt credentials JSON via `encrypt()`; insert.
   - `update(id, patch)` — handle credentials specially (re-encrypt if provided).
   - `delete(id)` — cascade to events via FK.
   - `markSynced(id, error?)` — update `last_sync_at` and `last_sync_error`.
   - `getCredentials(id)` — decrypt and return.
4. `EventRepository`:
   - `create(input)` — auto-set `created_at = Date.now()` and `source='local'` if not provided.
   - `update`, `delete`.
   - `upsertByCaldavUid(accountId, uid, fields)` — INSERT OR REPLACE.
   - `findInRange(start, end, profileIds?)`:
     ```sql
     SELECT * FROM calendar_events
     WHERE start_datetime <= ? AND end_datetime >= ?
       AND (profile_id IS NULL OR profile_id IN (?,?,…))
     ORDER BY start_datetime ASC
     ```
     Skip the IN clause if profileIds empty/undefined.
   - `findRecurring()` — `SELECT * WHERE recurring_rule IS NOT NULL` (used by STORY-4.3 expander).
5. Unit tests using in-memory SQLite, applied migrations, encryption helpers.

### Key technical details

- Architecture §"Data Model" defines the schema verbatim.
- All datetimes stored as integer epoch ms in UTC. Display-side conversion to local timezone is the React layer's concern (date-fns `formatInTimeZone`).
- `recurring_rule` is the iCal RRULE string (e.g. `FREQ=WEEKLY;BYDAY=MO,WE,FR`). Expansion is STORY-4.3.
- CalDAV credentials: always JSON.stringify before `encrypt()` — typically `{ password, refresh_token, access_token, expires_at }`.
- `findInRange` is the workhorse query — must use the `idx_events_profile_date` index. Run `EXPLAIN QUERY PLAN` during development to verify.
- On profile delete, events with that profile_id have it nulled (ON DELETE SET NULL) — events remain visible as "unassigned".

---

## Dependencies

- **Blocked by:** STORY-1.5, STORY-1.8, STORY-2.1
- **Blocks:** STORY-4.2, STORY-4.3, STORY-4.4

---

## Test Checklist

- [ ] Unit: create account, list shows it, credentials encrypted in DB but decryptable via `getCredentials`
- [ ] Unit: tampering with `credentials_encrypted` causes `getCredentials` to throw (GCM auth failure)
- [ ] Unit: create event, `findInRange` returns it within window, excludes outside window
- [ ] Unit: profile-scoped find returns null-profile events too (visible to all)
- [ ] Unit: `upsertByCaldavUid` updates same row on second call (verified via id stability)
- [ ] Unit: deleting account cascades to its events
- [ ] Unit: deleting profile sets `profile_id` to NULL on events

---

## Notes

- The migration file is large; review carefully against Architecture §"Data Model" before merging.
- The `school_term` event type is populated by STORY-4.11; included in the CHECK constraint here so the column is forward-compatible.

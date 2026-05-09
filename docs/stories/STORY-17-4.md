# STORY-17.4: Calendar admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 9 — MVP cut: setup wizard, install, polish, release
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to add/remove CalDAV accounts, set sync frequency, configure WFH/shift schedule per adult
**So that** calendar setup is centralised

---

## Acceptance Criteria

- [ ] Account list with provider/status/last-sync; "Add account" picker (Google QR / Apple / Yahoo / Custom)
- [ ] Sync interval slider (5/15/30/60 min) — persists to `app_settings.calendar_sync_interval_mins`
- [ ] WFH/shift weekly grid per adult profile (per PRD §28); writes recurring `calendar_events` of type `wfh`/`shift`
- [ ] "Force sync now" button per account → calls `/api/v1/calendar/accounts/:id/sync`
- [ ] Last-sync error visible per account
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/CalendarPanel.tsx`
- `client/src/admin/AccountList.tsx`
- `client/src/admin/AddAccountWizard.tsx` — wraps Google QR (STORY-4.5) and Apple/Yahoo (STORY-4.6) flows
- `client/src/admin/WfhShiftGrid.tsx`
- `server/src/routes/calendarAccounts.ts` — extend with `/:id/sync` action
- `server/tests/routes/calendarAccountsAdmin.test.ts`

### Implementation steps

1. Account list: fetch from `/api/v1/calendar/accounts`; show provider icon, name, last-sync timestamp, error chip if any.
2. Add account dropdown opens provider-specific flow (Google QR pairing modal / Apple basic-auth form / Yahoo basic-auth / Custom URL).
3. Sync interval slider PATCHes `app_settings.calendar_sync_interval_mins`; scheduler reschedules.
4. WFH/shift grid: per adult profile, a 7×N grid of slots (morning / afternoon for shift, full-day for WFH); checking creates a recurring event with RRULE BYDAY.
5. "Force sync" calls action endpoint and toasts result.
6. Tests: list renders accounts; force sync triggers service; sync interval persists.

### Key technical details

- WFH/shift events use `type='wfh'` or `type='shift'` (already in event schema).
- Recurring rule for WFH: `FREQ=WEEKLY;BYDAY=MO,WE,FR` etc. — generated from the grid.
- Force sync endpoint reuses `CalendarService.syncAccount`.
- Sync interval change emits `settings:updated` event; scheduler subscribes and reschedules.

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-4.5, STORY-4.6
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: account list renders
- [ ] RTL: add account flow per provider
- [ ] RTL: sync interval slider persists
- [ ] RTL: force sync triggers and toasts
- [ ] RTL: WFH grid creates recurring events
- [ ] Unit: force sync endpoint calls service

---

## Notes

- WFH/shift recurring events show on the calendar with distinct visual treatment.
- A future "remove all events from this account" cleanup is Phase 2.

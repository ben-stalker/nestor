# STORY-4.11: Term dates iCal subscription

**Epic:** EPIC-4: Calendar Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P2
**Status:** complete

---

## User Story

**As a** parent
**I want** to import school/nursery term dates from an iCal URL per child
**So that** inset days appear automatically

---

## Acceptance Criteria

- [ ] Per-child setting: `term_dates_ical_url` column added to profiles via migration
- [ ] Scheduler: nightly fetch; events tagged `type=school_term`
- [ ] Inset day events surface as alerts
- [ ] Failure logs but does not block other modules

---

## Technical Implementation

### Files to create / modify

- `server/migrations/006_term_dates.sql` — adds `term_dates_ical_url TEXT` to profiles
- `server/src/types/profile.ts` — add optional `term_dates_ical_url` field
- `server/src/repositories/ProfileRepository.ts` — include field in PUBLIC_COLUMNS + toProfile
- `server/src/services/TermDatesService.ts` — fetch iCal URL, parse via ical.js, upsert school_term events
- `server/src/scheduler/index.ts` — register nightly term-dates-sync job
- `server/tests/services/termDatesService.test.ts`

### Implementation steps

1. Migration: `ALTER TABLE profiles ADD COLUMN term_dates_ical_url TEXT`
2. ProfileRepository: include `term_dates_ical_url` in SELECT + toProfile
3. TermDatesService:
   - `syncProfile(profile)`: if no term_dates_ical_url, skip
   - Fetch iCal via `fetch(url)`, parse VEVENT components with ical.js
   - Upsert events: `eventRepo.upsertByCaldavUid(...)` with `type='school_term'`
   - Check for inset days (events named with "inset" case-insensitive); create alert via alertRepo
4. Scheduler: register `term-dates-sync` at `0 2 * * *` (2am nightly)
5. Wire in app.ts / scheduler init

### Key technical details

- Use ical.js ICAL.parse + ICAL.Component for full iCal parsing
- caldav_uid = event UID property from iCal
- profile_id set to the child's profile_id
- Failure of one profile fetch does not block others (Promise.allSettled pattern)
- Log warnings on parse errors; do not throw

---

## Dependencies

- **Blocked by:** STORY-4.2, STORY-1.11
- **Blocks:** —

---

## Test Checklist

- [x] Unit: syncProfile skips profiles without term_dates_ical_url
- [x] Unit: parses VEVENT components and creates events with type=school_term
- [x] Unit: inset day event creates an alert
- [x] Unit: fetch failure logs but doesn't throw

---

## Notes

- iCal URLs are typically public (no auth needed); most LEAs and nurseries publish them.
- Future: support private iCal with Basic auth via credentials field.

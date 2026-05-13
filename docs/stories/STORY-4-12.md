# STORY-4.12: Custody schedule entry type

**Epic:** EPIC-4: Calendar Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** S (1d)
**Priority:** P2
**Status:** complete

---

## User Story

**As a** parent in a blended family
**I want** a sensitive "custody" event type for which child is with which household
**So that** the household can plan accordingly

---

## Acceptance Criteria

- [ ] Event type `custody` only visible to admin profiles (server filters from GET /calendar/events for non-admins)
- [ ] Distinct visual style: diagonal stripe pattern on EventBlock and MonthCell dots
- [ ] Configurable label via `app_settings.custody_label` (string, default "Custody")
- [ ] Recurring schedule supported (already available via recurring_rule field)

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/calendar.ts` — filter custody events from non-admin profile responses
- `server/src/db/settings-keys.ts` — add `custody_label` schema
- `client/src/index.css` — `.event-block--custody` diagonal stripe pattern; `.month-cell__dot--custody` hatch
- `client/src/calendar/EventBlock.tsx` — apply `event-block--custody` when `event.type === 'custody'`
- `server/tests/routes/calendarCustody.test.ts`

### Implementation steps

1. Server route: in GET /calendar/events handler, if `req.profile?.type !== 'admin'`, filter out events where `type === 'custody'` from the results
2. Settings key: `custody_label: z.string().min(1).max(50)` 
3. CSS: diagonal stripe using `repeating-linear-gradient` on `.event-block--custody`
4. EventBlock: add `event-block--custody` class when `event.type === 'custody'`
5. Tests: verify non-admin profile does not receive custody events

### Key technical details

- custody type is already in EventTypeSchema (server/src/types/calendar.ts)
- Filter in route handler (not repository) to keep filtering concerns at the API layer
- Stripe pattern: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)`

---

## Dependencies

- **Blocked by:** STORY-4.10
- **Blocks:** —

---

## Test Checklist

- [x] GET /calendar/events as child profile → custody events absent
- [x] GET /calendar/events as admin profile → custody events included
- [x] EventBlock renders custody stripe class

---

## Notes

- Custody events are intentionally hidden from child/teen profiles for privacy.
- The configurable label (e.g., "With Mum" / "With Dad") is set once in settings and applies to all custody events.

# STORY-4.2: Local event CRUD endpoints

**Epic:** EPIC-4: Calendar Module
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** household member
**I want** to add, edit, and delete events that live only in Nestor
**So that** I can capture household items not in any cloud calendar

---

## Acceptance Criteria

- [x] `POST /api/v1/calendar/events` creates a `source='local'` event
- [x] `PATCH /api/v1/calendar/events/:id` updates a local event
- [x] `DELETE /api/v1/calendar/events/:id` deletes a local event
- [x] `GET /api/v1/calendar/events?start=&end=&profileIds=` returns events in range (defers expansion to STORY-4.3)
- [x] All-day toggle persists to `all_day` column
- [x] Recurrence stored as `recurring_rule` (RRULE string per RFC 5545)
- [x] CalDAV-synced events (`source='caldav'`) are read-only — PATCH/DELETE returns 403 unless caller is admin
- [x] Permission middleware: only profiles with `calendar.event.create` allowed (admin/teen by default)
- [x] All inputs validated by Zod (`EventInput` schema)
- [x] Unit tests + Supertest integration tests cover happy path + each permission denial

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/calendar.ts` — Express router for events
- `server/src/services/CalendarService.ts` — thin domain wrapper (skeleton; full sync lands in STORY-4.4)
- `server/src/types/calendar.ts` — extend Zod schema with `EventInput`
- `server/src/index.ts` — mount `/api/v1/calendar/events` router
- `server/tests/routes/calendar.test.ts`

### Implementation steps

1. Define `EventInput` Zod schema:
```ts
export const EventInput = z.object({
  title: z.string().min(1).max(200),
  start_datetime: z.number().int(),
  end_datetime: z.number().int(),
  all_day: z.boolean().default(false),
  profile_id: z.number().int().nullable().optional(),
  type: z.enum(['default','wfh','shift','nursery_drop','vehicle_booking','vet','custody','school_term']).default('default'),
  recurring_rule: z.string().optional(),
  colour_override: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  notes: z.string().max(2000).optional(),
});
```
2. Build `routes/calendar.ts` with `requireProfile` and `requirePermission('calendar.event.create')` (or `.update`/`.delete`) middleware.
3. POST: validate, force `source='local'`, persist via `EventRepository.create`.
4. PATCH/DELETE: load existing; if `source !== 'local'` reject with 403 unless `req.profile.type === 'admin'` and an admin-pin header is supplied.
5. GET: parse `start` and `end` query params (epoch ms), comma-split `profileIds`, call `EventRepository.findInRange` — DO NOT expand recurring here (4.3 handles).
6. Wire route on `app.use('/api/v1/calendar', calendarRouter)`.
7. Tests with Supertest:
   - Create event as admin → 201
   - Create event as child → 403
   - Update CalDAV-source event as non-admin → 403
   - Delete missing event → 404
   - GET range filter returns expected events

### Key technical details

- Architecture §"API Architecture" — REST conventions for `/api/v1/*`.
- Validation errors return `{ error: 'validation', code: 'INVALID_INPUT', details: [...zod issues] }` per error envelope from STORY-1.4.
- Permissions: `calendar.event.create`, `calendar.event.update`, `calendar.event.delete` — declared in `permissions.ts` (STORY-2.3).
- Recurring events: store the RRULE; expansion is deferred to STORY-4.3 — do not attempt expansion here.
- Future-proofing: PATCH supports partial updates; recurring updates use the simple "this event" semantics for MVP (split-from-this-occurrence is Phase 2).

---

## Dependencies

- **Blocked by:** STORY-4.1, STORY-2.3
- **Blocks:** STORY-4.3 (expansion uses `findInRange`), STORY-4.7 (day view), STORY-4.10 (event modal)

---

## Test Checklist

- [ ] Unit: POST event with admin token → 201, returned shape matches `CalendarEvent`
- [ ] Unit: POST event with child token → 403
- [ ] Unit: PATCH local event as admin → 200
- [ ] Unit: PATCH CalDAV event as non-admin → 403
- [ ] Unit: PATCH CalDAV event as admin with admin pin → 200
- [ ] Unit: DELETE non-existent → 404
- [ ] Unit: GET ?start=&end= filters out events outside the range
- [ ] Unit: GET with `profileIds=1,2` returns only events for those profiles + null
- [ ] Unit: invalid colour override → 400 with Zod issue list

---

## Notes

- Recurring expansion is added in STORY-4.3 — until then GET returns the bare RRULE event (one row per series), which is acceptable for the dev-facing route but the carousel/day view will show wrong counts until 4.3 lands.
- Quick-add modal in STORY-4.10 funnels through these endpoints.

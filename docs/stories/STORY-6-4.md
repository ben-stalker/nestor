# STORY-6.4: Vehicle booking UI

**Epic:** EPIC-6: Vehicles & Travel Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** to book a vehicle for a date range
**So that** other family members can see it's taken

---

## Acceptance Criteria

- [ ] Vehicle detail page shows upcoming bookings list (next 30 days)
- [ ] "Book" button → modal: profile picker, start datetime, end datetime, notes
- [ ] Conflict warning shown inline before save (calls `POST` with optimistic disabled save button if conflicts exist)
- [ ] Booking shows on home carousel (per STORY-3.4) and on calendar via vehicle filter
- [ ] Edit / cancel buttons on owner's bookings
- [ ] All times locale-formatted

---

## Technical Implementation

### Files to create / modify

- `client/src/vehicles/VehicleDetail.tsx`
- `client/src/vehicles/BookingModal.tsx`
- `client/src/vehicles/BookingList.tsx`
- `client/src/api/vehicles.ts` — extend with bookings hooks
- `client/tests/vehicles/BookingModal.test.tsx`

### Implementation steps

1. `<VehicleDetail>`: hero card (photo, nickname, type, registration, renewals) + "Upcoming bookings" list + "Book" CTA.
2. `<BookingModal>` form:
   - Profile picker (defaults to active profile).
   - Start & end datetime (date pickers + time, with quick presets "Today 9–17", "Tomorrow all day").
   - Notes.
   - On change of dates, call a `dryRun` mutation:
```ts
const dryRun = useMutation({ mutationFn: (input) => api.post(`/vehicles/${id}/bookings/dry-run`, input) });
```
   Or check conflicts client-side by fetching `/bookings?from=&to=` and intersecting.
3. Show conflict banner with conflicting profile/time if any; disable Save until resolved.
4. On save, POST; on 409 (race), surface conflict and prompt re-pick.
5. Edit/cancel actions visible only to the owner (or admin).
6. Tests: form submits, conflict banner appears when overlapping, save disabled while conflict present.

### Key technical details

- PRD §12.
- "Dry run" can be a separate endpoint, or just a client-side intersection of fetched bookings in the chosen window — pick client-side for MVP simplicity.
- Bookings shown in week/month calendar via the vehicle filter overlay (STORY-2.9 + STORY-6.3).

---

## Dependencies

- **Blocked by:** STORY-6.3
- **Blocks:** STORY-3.4 (day card markers reference vehicle bookings)

---

## Test Checklist

- [ ] RTL: open modal, fill, submit → mutation called
- [ ] RTL: pick conflicting times → conflict banner visible
- [ ] RTL: save disabled while conflict present
- [ ] RTL: 409 from server → re-show conflict
- [ ] RTL: owner can edit own booking; non-owner cannot

---

## Notes

- The booking list fetches next-30-days; older bookings visible via "Show all".
- Future: drag-to-extend on a timeline UI (Phase 2).

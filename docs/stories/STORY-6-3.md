# STORY-6.3: Vehicle booking endpoints

**Epic:** EPIC-6: Vehicles & Travel Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** booking CRUD and conflict-detection endpoints
**So that** the vehicle calendar can prevent double-bookings

---

## Acceptance Criteria

- [ ] `GET /api/v1/vehicles/:id/bookings?from=&to=` returns bookings in range
- [ ] `POST /api/v1/vehicles/:id/bookings` creates booking; 409 with conflict details if overlapping
- [ ] `PATCH /api/v1/vehicles/:id/bookings/:bookingId` updates; conflict check excludes self
- [ ] `DELETE /api/v1/vehicles/:id/bookings/:bookingId` deletes
- [ ] Bookings overlay-render in calendar via vehicle filter (events with `type='vehicle_booking'` and `linked_vehicle_id`)
- [ ] Tests cover overlap edge cases (touching, contained, partial overlap, exclude self)
- [ ] Permission: any profile can book; admin can edit any; non-admin can only edit own bookings

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/vehicles.ts` — extend with bookings sub-router
- `server/src/services/VehicleBookingService.ts`
- `server/tests/routes/vehicleBookings.test.ts`

### Implementation steps

1. Service:
```ts
export class VehicleBookingService {
  async create(vehicleId, input) {
    const conflicts = await bookingRepo.findConflicts(vehicleId, input.start_datetime, input.end_datetime);
    if (conflicts.length) throw new ConflictError({ conflicts });
    return bookingRepo.create({ vehicle_id: vehicleId, ...input, created_at: Date.now() });
  }
  async update(vehicleId, bookingId, patch) {
    const conflicts = await bookingRepo.findConflicts(vehicleId, patch.start_datetime, patch.end_datetime, bookingId);
    if (conflicts.length) throw new ConflictError({ conflicts });
    return bookingRepo.update(bookingId, patch);
  }
}
```
2. Routes: standard REST mapping; map `ConflictError → 409` in error middleware.
3. Optional: also create a corresponding `calendar_events` row (`type='vehicle_booking'`) so the booking appears in the calendar; alternatively render via filter overlay (STORY-2.9 + STORY-6.4).
4. Tests:
   - Create booking → 201
   - Create overlapping booking → 409 with conflicts array
   - Update to overlap another → 409
   - Update to overlap only self → ok (excluded)
   - Permission: non-admin updating another's booking → 403

### Key technical details

- Conflict semantics: half-open intervals (boundary touching is fine).
- Event-overlay vs calendar-event: PRD wants vehicle bookings on the calendar; cleanest is to write a `calendar_events` row alongside the booking with `linked_vehicle_id` (Phase 2: nullable column on events). For MVP, render via filter overlay only — server returns bookings; carousel/calendar pulls them when vehicle filter active.
- 409 response body: `{ error: 'conflict', code: 'BOOKING_CONFLICT', details: [{ id, start_datetime, end_datetime, profile_id }] }`.

---

## Dependencies

- **Blocked by:** STORY-6.1, STORY-2.3
- **Blocks:** STORY-6.4 (UI), STORY-3.4 (day card markers)

---

## Test Checklist

- [ ] Unit: POST creates → 201
- [ ] Unit: POST with overlap → 409 with conflicts array
- [ ] Unit: PATCH non-overlapping → 200
- [ ] Unit: PATCH self-overlap (excluded) → 200
- [ ] Unit: PATCH another profile's booking as non-admin → 403
- [ ] Unit: DELETE as owner → 204
- [ ] Unit: GET range filter

---

## Notes

- A future enhancement is a calendar-events mirror — for MVP, the calendar's vehicle-filter overlay renders bookings via a dedicated query.
- `business` flag set true means it counts toward freelancer mileage report (STORY-6.8 P3).

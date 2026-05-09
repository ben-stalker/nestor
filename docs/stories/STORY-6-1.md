# STORY-6.1: Vehicles + bookings + fuel logs schema

**Epic:** EPIC-6: Vehicles & Travel Module
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** `vehicles`, `vehicle_bookings`, `fuel_logs` tables and repositories
**So that** vehicle features can persist data

---

## Acceptance Criteria

- [ ] Migration creates `vehicles`, `vehicle_bookings`, `fuel_logs` per architecture data model
- [ ] FK with cascading delete from vehicle to bookings + fuel_logs
- [ ] Repositories with full CRUD
- [ ] `VehicleBookingRepository.findConflicts(vehicleId, start, end, excludeBookingId?)` returns overlapping bookings
- [ ] Indexes: `idx_vehicle_bookings_range` on `(vehicle_id, start_datetime, end_datetime)`
- [ ] Unit tests including conflict edge cases (touching boundaries, inclusive/exclusive)

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_vehicles.sql`
- `server/src/repositories/VehicleRepository.ts`
- `server/src/repositories/VehicleBookingRepository.ts`
- `server/src/repositories/FuelLogRepository.ts`
- `server/src/types/vehicles.ts`
- `server/tests/repositories/vehicles/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY,
  nickname TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('car','van','motorcycle','bicycle','ev')),
  make TEXT, model TEXT, year INTEGER, registration TEXT, colour TEXT,
  photo_path TEXT,
  mot_due INTEGER, tax_due INTEGER, insurance_due INTEGER, service_due INTEGER, service_due_mileage INTEGER,
  current_mileage INTEGER,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE vehicle_bookings (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  start_datetime INTEGER NOT NULL,
  end_datetime INTEGER NOT NULL,
  business INTEGER NOT NULL DEFAULT 0,
  miles REAL,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_vehicle_bookings_range ON vehicle_bookings(vehicle_id, start_datetime, end_datetime);
CREATE TABLE fuel_logs (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date INTEGER NOT NULL, litres REAL NOT NULL, cost_minor INTEGER NOT NULL, mileage INTEGER
);
```
2. `VehicleBookingRepository.findConflicts`:
```ts
findConflicts(vehicleId: number, start: number, end: number, exclude?: number) {
  const sql = `SELECT * FROM vehicle_bookings WHERE vehicle_id = ? AND start_datetime < ? AND end_datetime > ?` + (exclude ? ' AND id != ?' : '');
  const params = exclude ? [vehicleId, end, start, exclude] : [vehicleId, end, start];
  return this.db.prepare(sql).all(...params);
}
```
3. Tests: overlapping pairs, touching boundaries (start==prev.end → no conflict if open intervals), excludeBookingId.

### Key technical details

- Architecture data model.
- Money in minor units (pence/cents).
- Type enum includes `bicycle` and `ev` so the UI can hide MOT/tax/fuel for those types.
- Conflict semantics: half-open intervals `[start, end)` — bookings touching at the boundary do NOT conflict.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-6.2 (CRUD UI), STORY-6.3 (booking endpoints), STORY-6.5 (fuel log)

---

## Test Checklist

- [ ] Unit: vehicle CRUD round-trip
- [ ] Unit: booking findConflicts returns overlap
- [ ] Unit: touching boundary returns no conflict
- [ ] Unit: excludeBookingId excludes self (for updates)
- [ ] Unit: cascade delete vehicle → bookings + fuel logs gone

---

## Notes

- `current_mileage` updated when fuel log added (future enhancement).
- `service_due_mileage` allows mileage-based reminders alongside date-based.

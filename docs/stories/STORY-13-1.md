# STORY-13.1: EV charging log schema + repo

**Epic:** EPIC-13: EV & Energy Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** the `ev_charging_log` table and repo
**So that** charging sessions can be persisted

---

## Acceptance Criteria

- [ ] Migration creates `ev_charging_log` per architecture data model
- [ ] Repository with CRUD + monthly aggregation `monthlyTotal(month, vehicleId?)`
- [ ] Indexes on `(vehicle_id, charged_at)`
- [ ] Tests

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_ev.sql`
- `server/src/repositories/EvChargingLogRepository.ts`
- `server/src/types/ev.ts`
- `server/tests/repositories/ev/EvChargingLogRepository.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE ev_charging_log (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  charged_at INTEGER NOT NULL,
  kwh REAL NOT NULL,
  cost_minor INTEGER,
  location TEXT, -- home / public / supercharger
  rate_minor_per_kwh INTEGER, -- snapshot of rate at log time
  notes TEXT
);
CREATE INDEX idx_ev_charging_vehicle_date ON ev_charging_log(vehicle_id, charged_at);
```
2. `monthlyTotal({ month, vehicleId? })`:
```ts
monthlyTotal({ month, vehicleId }) {
  const start = startOfMonth(month).getTime();
  const end = endOfMonth(month).getTime();
  const sql = `SELECT COALESCE(SUM(kwh),0) AS kwh, COALESCE(SUM(cost_minor),0) AS cost FROM ev_charging_log WHERE charged_at BETWEEN ? AND ?` + (vehicleId ? ` AND vehicle_id = ?` : '');
  return this.db.prepare(sql).get(start, end, ...(vehicleId ? [vehicleId] : []));
}
```
3. Tests cover CRUD + aggregation.

### Key technical details

- Only EV-type vehicles (per `vehicles.type='ev'`) should appear in EV-specific UIs; data model itself doesn't enforce.
- `rate_minor_per_kwh` snapshot allows historic accuracy when rates change later.
- `cost_minor` may be null if user hasn't entered cost (e.g. free charge).

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-13.2 (UI), STORY-13.3 (energy overview)

---

## Test Checklist

- [ ] Unit: log CRUD round-trip
- [ ] Unit: monthlyTotal aggregates kwh and cost
- [ ] Unit: vehicleId filter narrows to one vehicle
- [ ] Unit: cascade delete vehicle → logs gone

---

## Notes

- The Tesla plugin (STORY-16.7) writes to this same table when auto-logging.
- Manual log UI in STORY-13.2 is the MVP entry point.

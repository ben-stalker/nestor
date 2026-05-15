# STORY-6.5: Fuel log + MPG tracking

**Epic:** EPIC-6: Vehicles & Travel Module
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P2
**Status:** complete

---

## User Story

**As a** vehicle owner
**I want** to log fuel fill-ups with mileage
**So that** I can see efficiency over time

---

## Acceptance Criteria

- [x] `POST /api/v1/vehicles/:id/fuel-log` with `{ date, litres, cost_minor, mileage }`
- [x] List of fill-ups with computed MPG / L per 100km (locale-aware)
- [x] Hidden for EV (refers user to EV plugin / charging log STORY-13.2)
- [x] Simple line chart (last 12 fill-ups)
- [x] Permission: any profile can log; admin/owner can edit/delete

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/fuelLogs.ts`
- `client/src/vehicles/FuelLog.tsx`
- `client/src/vehicles/FuelLogForm.tsx`
- `client/src/vehicles/MpgChart.tsx`
- `server/tests/routes/fuelLogs.test.ts`

### Implementation steps

1. Routes: standard CRUD against `FuelLogRepository` (STORY-6.1).
2. Compute MPG per fill-up: `(currentMileage - prevMileage) / litres * 4.546` for UK gallons; if `units==='imperial'` use mpg, else use l/100km.
3. UI list: rows sorted descending by date; chart shows efficiency trend.
4. Hide tab/section when vehicle.type === 'ev'; show note pointing to EV plugin / charging log.
5. Tests: log CRUD; MPG calculation; EV vehicle hides UI.

### Key technical details

- PRD §12 fuel log.
- L/100km in metric: `litres * 100 / km`; mpg in imperial: `(km / 1.609) / (litres / 4.546)`.
- Chart via recharts (already used).

---

## Dependencies

- **Blocked by:** STORY-6.2
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: CRUD round-trip
- [ ] Unit: MPG calculation correct
- [ ] Unit: l/100km calculation correct
- [ ] Unit: EV vehicle hides UI
- [ ] RTL: form submit, list updates
- [ ] RTL: chart renders

---

## Notes

- Future: import petrol receipt photo and parse via OCR (plugin scope).
- EVs use STORY-13.2 charging log instead.

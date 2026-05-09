# STORY-13.2: Manual charging log endpoints + UI

**Epic:** EPIC-13: EV & Energy Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** EV owner
**I want** to log home charging sessions with date/kWh/cost
**So that** monthly cost is tracked even without a Tesla plugin

---

## Acceptance Criteria

- [ ] `GET /api/v1/ev/charging-log?vehicleId=&from=&to=` returns logs
- [ ] `POST /api/v1/ev/charging-log` creates entry; auto-fills `rate_minor_per_kwh` from `app_settings.fuel_rates.electricity` if cost not provided
- [ ] Per-vehicle filter UI; defaults to first EV
- [ ] List view + add modal
- [ ] Cumulative cost chart (last 12 months)
- [ ] Permission: any profile can log; admin can edit/delete any

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/ev.ts`
- `client/src/ev/ChargingLog.tsx`
- `client/src/ev/ChargingLogForm.tsx`
- `client/src/ev/ChargingChart.tsx`
- `client/src/api/ev.ts`
- `server/tests/routes/ev.test.ts`

### Implementation steps

1. Routes: standard CRUD; on POST, auto-compute `cost_minor = kwh * rate` if cost not provided.
2. Vehicle filter pulls vehicles with `type='ev'`.
3. List grouped by month; entries show `kWh` + cost.
4. Chart: last 12 months bar chart of cost; line overlay of kWh.
5. Tests: POST without cost auto-fills from rate; with cost preserves user value.

### Key technical details

- `rate_minor_per_kwh` snapshot at log time; rate change later doesn't retroactively shift prior logs.
- Charts via `recharts` (already added in STORY-8.7).
- All money formatted via `formatCurrency`.

---

## Dependencies

- **Blocked by:** STORY-13.1
- **Blocks:** STORY-13.3 (energy overview), STORY-13.4 (rates), STORY-13.5 (P2 plug-in alert)

---

## Test Checklist

- [ ] Unit: POST without cost auto-fills via rate
- [ ] Unit: POST with cost preserves user value
- [ ] Unit: GET filters by vehicleId and range
- [ ] RTL: form submits, list updates
- [ ] RTL: chart displays last 12 months
- [ ] RTL: per-vehicle filter

---

## Notes

- The Tesla plugin auto-logs into the same table once enabled (STORY-16.7).
- For non-EV vehicles users use the fuel log (STORY-6.5).

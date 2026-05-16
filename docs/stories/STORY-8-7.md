# STORY-8.7: Meter readings log + chart

**Epic:** EPIC-8: House Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** household admin
**I want** to log monthly gas/electricity readings
**So that** I can see usage over time and the EV plugin has a rate

---

## Acceptance Criteria

- [ ] CRUD endpoint per `fuel_type` (gas / electricity / oil / water)
- [ ] Chart: cumulative usage over 12 months (line chart per fuel type)
- [ ] Configurable rate per fuel type used by EV plugin (stored in `app_settings.fuel_rates`, separate from STORY-13.4 panel)
- [ ] Monthly reminder on configurable date of month (`app_settings.meter_reading_day`, default 1st)
- [ ] Permission: admin only for write

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/meterReadings.ts`
- `server/src/services/meter/reminders.ts`
- `client/src/house/MeterReadings.tsx`
- `client/src/house/MeterChart.tsx`
- `client/src/api/meter.ts`
- `server/tests/routes/meterReadings.test.ts`

### Implementation steps

1. Routes: CRUD against `MeterReadingRepository`; query `?fuel_type=&from=&to=`.
2. Reminder hook: on day X of month, push alert "Time to read your meters" (severity info). Dedup per month.
3. Client `<MeterReadings>`:
   - Tabs per fuel type.
   - Add reading form (value + reading_date defaults today).
   - Last 12-month line chart via `recharts` or `victory` (kept light).
   - Cumulative consumption derived: `value[i] - value[i-1]`.
4. Cost chart (optional, P2): multiplied by `fuel_rates[fuel_type]`.
5. Tests: CRUD; chart computes consumption deltas; reminder fires once per month.

### Key technical details

- Architecture data model.
- Readings stored as raw cumulative (`value`); monthly consumption derived at display.
- Charts: plain SVG via recharts is lightest dep; reuse for energy overview (STORY-13.3).
- Reminder dedup keyed by `YYYY-MM`.

---

## Dependencies

- **Blocked by:** STORY-8.1
- **Blocks:** STORY-13.3 (energy overview), STORY-13.4 (rates panel)

---

## Test Checklist

- [ ] Unit: CRUD round-trip
- [ ] Unit: chart consumption = current − previous
- [ ] Unit: monthly reminder fires once
- [ ] RTL: tab per fuel_type works
- [ ] RTL: form adds reading
- [ ] Manual: 12-month chart looks reasonable

---

## Notes

- Smart-meter API integration is plugin scope; this is the manual-entry baseline.
- Water and oil are optional — the UI hides tabs for fuel types with zero readings until first entered.

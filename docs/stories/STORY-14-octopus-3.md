# STORY-14.3: Octopus Energy usage dashboard

**Epic:** EPIC-14: Octopus Energy Integration
**Estimate:** M (2d)
**Priority:** medium
**Status:** complete

---

## User Story

**As a** household member
**I want** to see my electricity and gas consumption from Octopus Energy in a chart
**So that** I can understand my usage and costs over time

---

## Acceptance Criteria

- [x] Server: `GET /api/v1/octopus/consumption?fuelType=electricity&period=daily&days=14` returns daily aggregated kWh and estimated cost for the last N days
- [x] Server: `GET /api/v1/octopus/tariff` returns current unit rate (p/kWh) and standing charge (p/day) fetched from Octopus API (cached in app_settings, refreshed daily by the scheduler)
- [x] Server: Standing charge + unit rate added to scheduler daily refresh (extend `octopus-sync` job or add separate job)
- [x] Client: `OctopusConsumptionChart` component in the EV page (new "Octopus" tab or sub-section)
- [x] Client: Bar chart (SVG) showing daily kWh for electricity (and gas if available), toggleable
- [x] Client: Period switcher: 7 days / 14 days / 30 days
- [x] Client: Cost overlay: each day's bar shows estimated cost = kWh × unit rate + (1/2 × standing charge since half-hourly)
- [x] Client: Comparison section showing Octopus consumption vs manual meter reading delta for the same period (if meter readings available)
- [x] Client: "Not connected" placeholder when Octopus not configured — links to the settings tab (STORY-14.1)
- [x] Client: Loading skeleton and error state
- [x] 8+ server tests, 8+ client tests; lint + typecheck + prettier clean

---

## Technical Implementation

### Server endpoints

**GET /api/v1/octopus/consumption**
- Query params: `fuelType` (electricity|gas, default electricity), `period` (daily|weekly, default daily), `days` (7|14|30, default 14)
- Returns: `{ configured: boolean, data: [{ date: string, kwh: number, costMinor: number }][], unitRatePence: number, standingChargePence: number }`
- If not configured: `{ configured: false, data: [] }`
- For weekly: group daily totals into ISO weeks

**GET /api/v1/octopus/tariff**
- Returns cached tariff data: `{ unitRatePence: number, standingChargePence: number, updatedAt: string|null }`
- Reads from `app_settings.octopus_unit_rate` and `app_settings.octopus_standing_charge`

### Files to create / modify

**Server:**
- `server/src/db/settings-keys.ts` — add `octopus_unit_rate`, `octopus_standing_charge`
- `server/src/routes/octopus.ts` — add consumption + tariff endpoints
- `server/src/services/OctopusSyncService.ts` — extend to also refresh tariff rates
- `server/tests/routes/octopus.consumption.test.ts`

**Client:**
- `client/src/ev/OctopusConsumptionChart.tsx` — bar chart component
- `client/src/ev/OctopusTab.tsx` — wrapper with period switcher + fuel type toggle
- `client/src/ev/api.ts` — add consumption + tariff query hooks
- `client/src/ev/EvPage.tsx` — add Octopus tab (only when configured)
- `client/tests/ev/OctopusConsumptionChart.test.tsx`

### Implementation steps

1. Add consumption + tariff endpoints to `octopus.ts` router
2. Extend `OctopusSyncService.run()` to call `OctopusClient.fetchTariff()` and store rates in settings
3. `OctopusConsumptionChart` — SVG bar chart:
   - X axis: dates, Y axis: kWh
   - Each bar has electricity (blue) and gas (amber) segments if both available
   - Hover tooltip showing kWh + estimated cost
   - Responsive width via container measurement
4. `OctopusTab`:
   - Period switcher (7d/14d/30d chips)
   - Fuel type toggle (electricity / gas / both)
   - Chart + summary stats (total kWh, total cost, avg per day)
   - Comparison with meter readings: show delta if available
5. Wire into `EvPage` as a new tab (only shown when Octopus configured)

### Key technical details

- Cost calculation: `costMinor = Math.round((kwh * unitRatePence + standingChargePence / 48) / 100 * 100)` — distribute standing charge evenly across 48 half-hour slots
- For daily aggregation: group `interval_start` by calendar day in local time
- SVG chart: use viewBox for responsive scaling; bars with minimum 2px height
- The "comparison" section: query existing `meter_readings` for the same date range and compute the delta
- Show gas chart only if gas meter is configured (check `octopus_gas_mprn` in settings)

---

## Dependencies

- **Blocked by:** STORY-14.2 (consumption data in DB)
- **Blocks:** none

---

## Test Checklist

- [x] Server: consumption endpoint returns daily data when configured
- [x] Server: consumption endpoint returns `configured: false` when no credentials
- [x] Server: consumption endpoint respects `days` param
- [x] Server: tariff endpoint returns cached rates
- [x] Server: consumption endpoint handles empty data (no rows yet)
- [x] Client: chart renders bars for provided data
- [x] Client: shows placeholder when not configured
- [x] Client: period switcher changes days param
- [x] Client: fuel type toggle hides/shows gas bars
- [x] Client: loading skeleton shown while fetching

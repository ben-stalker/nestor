# STORY-13.3: Energy overview dashboard

**Epic:** EPIC-13: EV & Energy Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** a single page combining EV charging + meter readings + monthly cost
**So that** energy spend is visible

---

## Acceptance Criteria

- [ ] Route `/ev` (or `/energy`) shows cards: this month's electricity (from meter), home EV charging cost, gas/oil cost (if logged), total
- [ ] Cost calculations use rates from `app_settings.fuel_rates`
- [ ] 12-month chart of total energy spend (stacked bars per fuel type)
- [ ] Permission: admin only (energy is sensitive household info)

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/energy.ts` — `GET /api/v1/energy/overview`
- `server/src/services/EnergyOverviewService.ts`
- `client/src/ev/EnergyOverview.tsx`
- `client/src/ev/EnergyChart.tsx`
- `server/tests/services/EnergyOverviewService.test.ts`

### Implementation steps

1. Service:
```ts
export async function overview(month: Date) {
  const rates = await settings.get('fuel_rates') ?? {};
  const meter = await meterRepo.findInRange(startOfMonth(month), endOfMonth(month));
  const elecKwh = computeConsumption(meter, 'electricity');
  const elecCost = elecKwh * (rates.electricity ?? 0);
  const ev = await evRepo.monthlyTotal({ month: startOfMonth(month) });
  const gasUnits = computeConsumption(meter, 'gas');
  const gasCost = gasUnits * (rates.gas ?? 0);
  return { electricity: { kwh: elecKwh, cost: elecCost }, ev: { kwh: ev.kwh, cost: ev.cost }, gas: { units: gasUnits, cost: gasCost }, total: elecCost + ev.cost + gasCost };
}
```
2. UI cards + 12-month stacked bar chart of `electricity / ev / gas / oil`.
3. Tests: with sample meter/EV data, totals match expectations.

### Key technical details

- Rates centralised in `app_settings.fuel_rates` (set by STORY-13.4 panel).
- Money in minor units throughout; client formats.
- Computation re-uses STORY-8.7 logic for meter consumption.

---

## Dependencies

- **Blocked by:** STORY-13.2, STORY-8.7
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: overview totals correct for sample month
- [ ] Unit: 12-month series returned
- [ ] Unit: missing rates default to 0
- [ ] Unit: non-admin → 403
- [ ] RTL: cards render, chart renders

---

## Notes

- The chart is stacked bars by fuel type per month.
- Future: smart-meter API integration is plugin scope.

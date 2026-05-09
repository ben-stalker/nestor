# STORY-13.4: Configurable fuel/electricity rates

**Epic:** EPIC-13: EV & Energy Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to set electricity/gas/oil rates so cost calculations are accurate
**So that** the energy overview is meaningful

---

## Acceptance Criteria

- [ ] Settings panel under Energy & Budget (admin-only) at `/admin/energy`
- [ ] Per-fuel rate (electricity, gas, oil) with effective date for future rate changes (`fuel_rates_history` mini-table OR latest-only stored in `app_settings.fuel_rates`)
- [ ] Used by EV charging cost auto-fill (STORY-13.2) and meter reading consumption (STORY-13.3)
- [ ] Currency from `app_settings.currency`
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/admin.ts` — extend with `GET/PATCH /admin/fuel-rates`
- `client/src/admin/EnergyRatesPanel.tsx`
- `client/src/api/admin.ts`
- `server/tests/routes/adminFuelRates.test.ts`

### Implementation steps

1. Settings storage: `app_settings.fuel_rates = { electricity: { value_minor_per_kwh: 28, effective_from: 0 }, gas: { value_minor_per_kwh: 7, effective_from: 0 }, oil: { value_minor_per_litre: 80, effective_from: 0 } }`.
2. Route:
```ts
router.get('/fuel-rates', requireAdmin, async (_req, res) => res.json(await settings.get('fuel_rates') ?? {}));
router.patch('/fuel-rates', requireAdmin, async (req, res) => {
  const input = z.object({ electricity: ..., gas: ..., oil: ... }).partial().parse(req.body);
  await settings.set('fuel_rates', { ...(await settings.get('fuel_rates') ?? {}), ...input });
  res.status(204).end();
});
```
3. UI: simple form with three inputs (currency-formatted), effective-from date picker per fuel.
4. Tests: PATCH updates; non-admin → 403.

### Key technical details

- For MVP, store latest-only rate; effective_from is informational (allows the user to "lock in" the date even if applied retroactively).
- A future history-aware computation would use date-ranged rates against meter readings; out of scope.
- Rates in minor units (pence per kWh, e.g. 28 = 28p).

---

## Dependencies

- **Blocked by:** STORY-13.2, STORY-17.1 (admin shell)
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: GET returns current rates
- [ ] Unit: PATCH updates and persists
- [ ] Unit: non-admin → 403
- [ ] RTL: form submits, refetch shows new rate
- [ ] RTL: currency formatting in display

---

## Notes

- Smart meter integration is plugin scope; this is the manual baseline.
- A future "import tariff PDF" / Octopus Energy plugin is a clear extension.

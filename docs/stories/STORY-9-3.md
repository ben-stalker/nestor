# STORY-9.3: Monthly commitments summary

**Epic:** EPIC-9: Finance Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** a single summary of monthly committed outgoings (agreements + subscriptions + insurances + commitments)
**So that** I see total committed spend

---

## Acceptance Criteria

- [ ] `GET /api/v1/finance/summary` aggregates from `finance_agreements`, `subscriptions`, vehicle insurance dates, `regular_commitments` (P2)
- [ ] Per-category subtotals with expand/collapse on the client
- [ ] Total committed at bottom
- [ ] Currency via locale (`formatCurrency`)
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/finance.ts` — extend with `/summary`
- `server/src/services/FinanceSummaryService.ts`
- `client/src/finance/MonthlySummary.tsx`
- `client/src/api/finance.ts`
- `server/tests/services/FinanceSummaryService.test.ts`

### Implementation steps

1. Service:
```ts
export async function summary() {
  const agreements = await agreementRepo.list({ active: true });
  const agreementsTotal = agreements.reduce((s, a) => s + a.monthly_payment_minor, 0);
  const subscriptions = await subRepo.list({ active: true });
  const subsTotal = subscriptions.reduce((s, x) => s + (x.cycle === 'yearly' ? x.amount_minor / 12 : x.cycle === 'weekly' ? x.amount_minor * 52 / 12 : x.amount_minor), 0);
  const vehicles = await vehicleRepo.list({ active: true });
  // Vehicle insurance: each vehicle has insurance_due (annual); estimate monthly amount stored in app_settings.vehicle_insurance_monthly_estimate or summed if column present
  return {
    categories: [
      { name: 'agreements', items: agreements, total: agreementsTotal },
      { name: 'subscriptions', items: subscriptions, total: subsTotal },
      // ...
    ],
    total: agreementsTotal + subsTotal /* + others */,
  };
}
```
2. Route: `router.get('/summary', requireAdmin, async (_req, res) => res.json(await financeSummary.summary()));`
3. Client: collapsible `<Accordion>` per category; total banner at bottom.
4. Tests: empty state; each category contributes; yearly subscription contributes /12.

### Key technical details

- PRD §15 monthly outgoings summary.
- Money returned as minor units; client formats.
- Categories: `agreements`, `subscriptions`, `vehicle_insurance`, `regular_commitments`.
- Aggregation can be slow with many rows — for MVP, simple in-memory sum is fine; cache for 60s if needed.

---

## Dependencies

- **Blocked by:** STORY-9.2, STORY-8.5
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: empty summary → total 0, categories all empty
- [ ] Unit: agreement contributes monthly_payment_minor
- [ ] Unit: yearly sub contributes amount/12
- [ ] Unit: total = sum of category totals
- [ ] Unit: non-admin → 403
- [ ] RTL: collapse/expand per category

---

## Notes

- Vehicle insurance estimate is a stretch — for MVP, exclude unless user enters a monthly figure per vehicle.
- Regular commitments (rent, pension) come in STORY-9.6 (P2).

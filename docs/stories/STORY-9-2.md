# STORY-9.2: Finance agreements CRUD

**Epic:** EPIC-9: Finance Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to record finance agreements (PCP, loans, BNPL, mortgage)
**So that** monthly commitments are visible

---

## Acceptance Criteria

- [ ] `GET/POST/PATCH/DELETE /api/v1/finance/agreements` (admin only for write)
- [ ] Type-specific fields: mortgage shows `fixed_rate_end_date`; PCP shows `balloon_payment_minor`
- [ ] Per-agreement alert lead time (`alert_lead_days`)
- [ ] Currency display via `formatCurrency` (locale settings)
- [ ] Permission: admin only for write; admin/teen read

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/finance.ts`
- `client/src/finance/AgreementsList.tsx`
- `client/src/finance/AgreementForm.tsx`
- `client/src/api/finance.ts`
- `server/tests/routes/finance.test.ts`

### Implementation steps

1. Routes: standard CRUD against `FinanceAgreementRepository`.
2. Zod schema:
```ts
const Mortgage = z.object({ type: z.literal('mortgage'), name: z.string(), monthly_payment_minor: z.number(), currency: z.string(), end_date: z.number().optional(), fixed_rate_end_date: z.number().optional(), alert_lead_days: z.number().default(180) });
const PCP = z.object({ type: z.literal('pcp'), name: z.string(), monthly_payment_minor: z.number(), currency: z.string(), end_date: z.number(), balloon_payment_minor: z.number().optional(), alert_lead_days: z.number().default(90) });
// other types
export const AgreementInput = z.discriminatedUnion('type', [Mortgage, PCP, /*…*/]);
```
3. UI list grouped by type with running monthly total.
4. Form: type select switches conditional fields; lead-time slider.
5. Tests: each type validates; admin-only write; lead-time stored.

### Key technical details

- Type-specific fields keep the form sensible.
- Monthly total at the top of the list pre-shadows STORY-9.3 summary.
- Currency from `app_settings.currency`.

---

## Dependencies

- **Blocked by:** STORY-9.1
- **Blocks:** STORY-9.3 (summary aggregates), STORY-9.5 (alerts)

---

## Test Checklist

- [ ] Unit: mortgage validates fixed_rate_end_date
- [ ] Unit: PCP validates balloon_payment_minor
- [ ] Unit: admin POST → 201
- [ ] Unit: non-admin POST → 403
- [ ] RTL: form switches fields by type
- [ ] RTL: list shows running total

---

## Notes

- Default lead-times per type: mortgage 180d, PCP 90d, loan 60d.
- Per-agreement override is what makes alerts feel personal.

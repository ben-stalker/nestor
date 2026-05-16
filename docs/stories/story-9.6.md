# STORY-9.6: Regular commitments + benefits/income reminders

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
Track standing monthly commitments (rent, pension, childcare) and incoming benefits/income (salary, Universal Credit, Child Benefit).

## Tasks
- [x] `server/migrations/013_regular_commitments.sql` — `regular_commitments` table with direction (in/out), day_of_month, category, active
- [x] Types added to `server/src/types/finance.ts` — `RegularCommitment`, `RegularCommitmentInput`, `RegularCommitmentUpdate`
- [x] CRUD methods added to `server/src/repositories/FinanceRepository.ts`
- [x] `GET/POST/PATCH/DELETE /api/v1/finance/regular` endpoints in finance router
- [x] Summary endpoint updated to include active outgoing regular commitments as 'Regular Commitments' category
- [x] `client/src/finance/regular/RegularCommitmentList.tsx` — list with net in/out summary card
- [x] `client/src/finance/regular/RegularCommitmentForm.tsx` — create/edit modal
- [x] `client/src/finance/types.ts` and `api.ts` updated with client types and API functions
- [x] 'Regular' tab added to `FinancePage.tsx`
- [x] Route and repository tests added

## Acceptance Criteria
- [x] Create, read, update, delete regular commitments
- [x] Direction field: 'in' (income/benefit) or 'out' (expense)
- [x] Optional day_of_month (1–31) and category fields
- [x] Active/inactive toggle with `active` flag
- [x] Outgoing commitments included in monthly summary grand total
- [x] UI shows net surplus/deficit when both in and out commitments exist
- [x] All tests passing

## Notes
Monetary values stored in minor units (pence).
Day-of-month reminders deferred to STORY-14.3 (scheduler hook registry).

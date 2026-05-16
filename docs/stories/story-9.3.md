# STORY-9.3: Monthly commitments summary

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
Single endpoint and UI view that aggregates monthly committed outgoings across agreements, subscriptions, and vehicle insurance.

## Tasks
- [x] `GET /api/v1/finance/summary` — aggregates `finance_agreements` + `subscriptions` into per-category subtotals
- [x] Client `client/src/finance/` module — types.ts, api.ts
- [x] `FinancePage.tsx` — tabbed page (Agreements / Savings / Summary)
- [x] `CommitmentsSummary.tsx` — expandable per-category subtotals + total
- [x] Wire `/finance` route in `router.tsx`
- [x] Server + client tests

## Acceptance Criteria
- [x] `GET /api/v1/finance/summary` aggregates from `finance_agreements`, `subscriptions`
- [x] Per-category subtotals with expand/collapse
- [x] Total committed at bottom
- [x] Currency from locale

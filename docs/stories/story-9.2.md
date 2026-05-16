# STORY-9.2: Finance agreements CRUD

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
REST endpoints for finance agreements so admins can record PCP, loans, BNPL, and mortgage commitments.

## Tasks
- [x] `server/src/routes/finance.ts` — createFinanceRouter with GET/POST/PATCH/DELETE `/api/v1/finance/agreements`
- [x] Type-specific field validation (mortgage: `fixed_rate_end_date`; PCP: `balloon_payment_minor`)
- [x] Per-agreement `alert_months_before` field
- [x] Wire router into `server/src/app.ts`
- [x] `server/tests/routes/finance.test.ts` — route integration tests

## Acceptance Criteria
- [x] `GET/POST/PATCH/DELETE /api/v1/finance/agreements`
- [x] Type-specific fields validated
- [x] Per-agreement alert lead time
- [x] Currency display via locale settings

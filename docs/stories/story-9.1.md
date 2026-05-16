# STORY-9.1: Finance schema + repositories

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
Create `finance_agreements` and `savings_goals` tables and repositories so that finance features can persist.

## Tasks
- [x] Migration `012_finance.sql` — `finance_agreements` and `savings_goals` tables with indexes
- [x] `server/src/types/finance.ts` — TypeScript interfaces + Zod schemas for both tables
- [x] `server/src/repositories/FinanceRepository.ts` — CRUD + monthly aggregation for agreements; CRUD for savings goals
- [x] `server/tests/repositories/finance.test.ts` — unit tests for both repos

## Acceptance Criteria
- [x] Migrations per data model
- [x] Repos with CRUD + monthly aggregation query
- [x] Tests passing

## Notes
`finance_agreements` covers mortgage, PCP, loan, BNPL, insurance types.
`savings_goals` tracks name/target/current/currency/target_date.
All monetary values stored as minor units (pence).

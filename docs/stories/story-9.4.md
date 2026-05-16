# STORY-9.4: Savings goals

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
Named savings goals with progress bars so admins can visualise targets.

## Tasks
- [x] `GET/POST/PATCH/DELETE /api/v1/finance/savings` in `routes/finance.ts`
- [x] `SavingsGoalList.tsx` + `SavingsGoalForm.tsx` client components
- [x] Progress bar on goal card; milestone alerts at 25/50/75/100%
- [x] Server + client tests

## Acceptance Criteria
- [x] CRUD `/api/v1/finance/savings`
- [x] Goal: name, target_amount, current_amount, currency, optional target_date
- [x] Progress bar on goal card
- [x] Milestone alerts (25/50/75/100%)

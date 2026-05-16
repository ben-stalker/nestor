# STORY-8.8: Budget tracker

**Epic:** EPIC-8: House Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P2
**Status:** complete

---

## User Story

**As a** household admin
**I want** a monthly budget figure with quick-add expenses by category
**So that** I have basic spend awareness

---

## Acceptance Criteria

- [x] `budget_categories` and `budget_expenses` tables (in migration 011_house.sql)
- [x] Monthly budget figure per category; categories configurable
- [x] Quick-add expense (amount, category, note)
- [x] Spend-vs-budget bar per category + total
- [x] Reset on month boundary (data preserved historically)
- [x] CRUD endpoints under `/api/v1/budget`
- [x] Monthly summary endpoint `/api/v1/budget/summary?year=&month=`

---

## Technical Implementation

### Files created

- `server/src/routes/budget.ts` — categories CRUD + expenses CRUD + summary endpoint
- `server/src/repositories/BudgetRepository.ts` — listCategories, createCategory, updateCategory, deleteCategory, listExpenses, createExpense, deleteExpense, monthlySummary
- `client/src/house/budget/BudgetSummary.tsx` — per-category progress bars
- `client/src/house/budget/ExpenseList.tsx` — expenses for selected category
- `client/src/house/budget/AddExpenseModal.tsx` — quick-add form
- `client/src/house/budget/CategoryForm.tsx` — manage categories
- `server/tests/routes/budget.test.ts`
- `client/tests/house/BudgetSummary.test.tsx`

---

## Dependencies

- **Blocked by:** STORY-8.1
- **Blocks:** —

---

## Test Checklist

- [x] Unit: categories CRUD round-trip
- [x] Unit: expense creation and listing with date filter
- [x] Unit: monthly summary aggregates spend per category
- [x] Unit: delete category cascades expenses
- [x] RTL: budget bars render with correct proportions
- [x] RTL: quick-add expense modal

---

## Completion Notes

Completed 2026-05-16. Budget categories and expenses in migration 011_house.sql. BudgetRepository with
monthlySummary joining categories + SUM of expenses for given year/month. Routes under /api/v1/budget.
Client BudgetSummary shows Tailwind progress bars (spent/budget ratio clamped 0–100%). Money stored as
integer minor units (pence). 8 server tests, 3 client tests.

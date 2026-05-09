# STORY-9.1: Finance schema + repositories

**Epic:** EPIC-9: Finance Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** `finance_agreements` and `savings_goals` tables and repositories
**So that** finance features can persist

---

## Acceptance Criteria

- [ ] Migrations create `finance_agreements` and `savings_goals` per architecture data model
- [ ] Indexes for end-date alert queries
- [ ] Repositories with CRUD + monthly aggregation `monthlyTotal()` summing agreements' monthly_payment
- [ ] Tests

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_finance.sql`
- `server/src/repositories/FinanceAgreementRepository.ts`
- `server/src/repositories/SavingsGoalRepository.ts`
- `server/src/types/finance.ts`
- `server/tests/repositories/finance/*.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE finance_agreements (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('mortgage','loan','pcp','bnpl','credit_card','other')),
  name TEXT NOT NULL,
  lender TEXT,
  monthly_payment_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  start_date INTEGER, end_date INTEGER,
  fixed_rate_end_date INTEGER, balloon_payment_minor INTEGER,
  remaining_balance_minor INTEGER,
  alert_lead_days INTEGER NOT NULL DEFAULT 30,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);
CREATE INDEX idx_agreements_end ON finance_agreements(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX idx_agreements_fixed ON finance_agreements(fixed_rate_end_date) WHERE fixed_rate_end_date IS NOT NULL;
CREATE TABLE savings_goals (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount_minor INTEGER NOT NULL, current_amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  linked_countdown_id INTEGER REFERENCES countdown_timers(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
```
2. `FinanceAgreementRepository.monthlyTotal()`:
```ts
monthlyTotal() {
  return this.db.prepare(`SELECT COALESCE(SUM(monthly_payment_minor),0) AS total FROM finance_agreements WHERE active=1`).get().total;
}
```
3. Tests cover CRUD + monthlyTotal.

### Key technical details

- All money in minor units.
- Finance types mirror PRD §15.
- Linked countdown for goals (e.g. holiday savings); FK to STORY-11.4 countdown_timers.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-9.2 (CRUD), STORY-9.3 (summary), STORY-9.4 (goals), STORY-9.5 (alerts)

---

## Test Checklist

- [ ] Unit: agreement CRUD
- [ ] Unit: savings goal CRUD
- [ ] Unit: monthlyTotal sums active agreements
- [ ] Unit: countdown link nullified on countdown delete

---

## Notes

- A future "rate change" field log (history of fixed-rate periods) is Phase 2.
- Linked countdown is optional and adds emotional context (countdown to "buy a house").

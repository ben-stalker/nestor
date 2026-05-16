# STORY-9.5: Finance end-date alerts

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
Push advance alerts when finance agreement end dates or fixed-rate periods are approaching.

## Tasks
- [x] `server/src/services/finance/reminders.ts` — evaluates active agreements for upcoming `end_date` and `fixed_rate_end_date`
- [x] Extend `reminder-eval` scheduler job to call finance evaluator alongside vehicles
- [x] `POST /api/v1/admin/run-reminder-eval` — manual trigger added to admin router
- [x] `server/tests/services/finance.reminders.test.ts` — unit tests for both alert paths

## Acceptance Criteria
- [x] Alert pushed when agreement `end_date` is within trigger window (primary: alert_months_before × 30 days, plus 30/14/7/1 milestones)
- [x] Alert pushed when `fixed_rate_end_date` within windows [180, 90, 30, 14, 7, 1] days
- [x] Severity: error ≤1 day, warning ≤14 days, info otherwise
- [x] Deduplication: no duplicate alerts for the same type key
- [x] Inactive agreements skipped
- [x] Manual admin trigger via `POST /api/v1/admin/run-reminder-eval`
- [x] All tests passing

## Notes
STORY-14.3 dependency handled by extending existing `reminder-eval` scheduler job rather than building a full hook registry.
Alert type keys: `finance_end_{id}_{days}d` and `finance_fixed_rate_{id}_{days}d`.

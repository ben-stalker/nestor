# STORY-9.7: Debt paydown visualiser

**Epic:** 9 — Finance Module
**Status:** completed

## Goal
Visualise how a finance agreement balance reduces over time based on monthly payments and interest rate.

## Tasks
- [x] `getPaydownSchedule(id, now?)` added to `FinanceRepository` — calculates month-by-month balance using amortisation formula
- [x] `GET /api/v1/finance/agreements/:id/paydown` endpoint returning `{ months: [{label, balance_minor}] }`
- [x] `client/src/finance/agreements/PaydownChart.tsx` — SVG bar chart showing balance declining over time
- [x] 'Paydown' toggle button on AgreementList cards (visible when balance_minor is set)
- [x] Client API function `getPaydownSchedule(agreementId)` added
- [x] Route tests covering 404, empty months, and valid schedule

## Acceptance Criteria
- [x] Per-agreement paydown schedule calculated from balance_minor, monthly_payment_minor, interest_rate
- [x] Stops when balance reaches 0 or end_date is reached (whichever first), max 360 months
- [x] Returns empty months array when balance or monthly payment not set
- [x] SVG chart rendered client-side with balance labels
- [x] All tests passing

## Notes
Interest computed as: monthly_rate = annual_rate / 100 / 12; principal = payment - interest.
No charting library required — uses inline SVG with tooltips.

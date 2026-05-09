# STORY-9.4: Savings goals

**Epic:** EPIC-9: Finance Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** named savings goals with progress bars
**So that** I can visualise targets

---

## Acceptance Criteria

- [ ] CRUD `/api/v1/finance/savings`
- [ ] Goal: name, target_amount, current_amount, currency, optional linked_countdown_id
- [ ] Progress bar on the goal card; milestone alerts at 25/50/75/100%
- [ ] Endpoint `POST /api/v1/finance/savings/:id/contribute` with `{ amount }` increments current_amount
- [ ] Permission: admin write; admin/teen read

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/finance.ts` — extend with `/savings`
- `server/src/services/SavingsGoalService.ts`
- `client/src/finance/SavingsGoals.tsx`
- `client/src/finance/SavingsGoalForm.tsx`
- `client/src/finance/api.ts`
- `server/tests/services/SavingsGoalService.test.ts`

### Implementation steps

1. Routes: standard CRUD + `/contribute` action.
2. `SavingsGoalService.contribute(id, amount)`:
   - Loads goal, increments `current_amount_minor`, persists.
   - Computes new percent.
   - For each milestone (25, 50, 75, 100), if old percent < milestone <= new percent, push an alert via `AlertEngine` with `severity: milestone === 100 ? 'success' : 'info'`.
3. Client `<SavingsGoals>` grid of cards with progress bars; "+ Add" CTA.
4. Linked countdown shows "X days to target date" chip on the card.
5. Tests: contribution crossing 50% → milestone alert pushed; 100% → success alert.

### Key technical details

- Money in minor units; percent computed `current_amount_minor / target_amount_minor * 100`.
- Milestone dedup: store last-pushed milestone in `goal.last_milestone` column (add to migration if not present) or check against alerts table.
- Linked countdown enables emotional context.

---

## Dependencies

- **Blocked by:** STORY-9.1
- **Blocks:** STORY-11.4 (countdowns linked from here)

---

## Test Checklist

- [ ] Unit: contribute increments current_amount
- [ ] Unit: crossing 25% → milestone alert
- [ ] Unit: crossing 100% → success alert
- [ ] Unit: contribution that doesn't cross → no alert
- [ ] RTL: progress bar reflects percent
- [ ] RTL: linked countdown chip displays

---

## Notes

- Negative contributions allowed (corrections) but no milestone alerts on decrease.
- A future "auto contribution" via standing order is plugin scope.

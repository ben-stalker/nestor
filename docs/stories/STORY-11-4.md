# STORY-11.4: Countdown timers

**Epic:** EPIC-11: Board Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

file content## User Story

**As a** household member
**I want** named countdowns with days remaining
**So that** holidays/birthdays/Christmas are visible

---

## Acceptance Criteria

- [ ] CRUD endpoints `/api/v1/countdowns`
- [ ] List view with day-count chips ("12 days")
- [ ] Optional "show on home screen" flag → renders in home Coming Up widget (STORY-3.9 P2)
- [ ] Linkable from savings goals (STORY-9.4 `linked_countdown_id`)
- [ ] Permission: any profile can create their own; admin can edit any

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/countdowns.ts`
- `client/src/board/Countdowns.tsx`
- `client/src/board/CountdownForm.tsx`
- `client/src/api/countdowns.ts`
- `server/tests/routes/countdowns.test.ts`

### Implementation steps

1. Routes: standard CRUD against `CountdownTimerRepository`.
2. UI list with cards showing name + day count + optional flag.
3. Form: name, target_date picker, show_on_home toggle.
4. Server endpoint `GET /api/v1/countdowns?showOnHome=true` for the Coming Up widget.
5. Tests: CRUD, query filter.

### Key technical details

- Day count computed at display: `Math.ceil((target - now) / 86_400_000)`.
- Past countdowns can be auto-archived (Phase 2) or kept visible with negative days; pick "auto-archived" for cleanliness — set `archived=1` when target passes.
- `linked_countdown_id` referenced by savings goals (STORY-9.4).

---

## Dependencies

- **Blocked by:** STORY-11.1
- **Blocks:** STORY-3.9 (Coming Up widget P2), STORY-9.4 (linked countdown)

---

## Test Checklist

- [ ] Unit: CRUD round-trip
- [ ] Unit: showOnHome filter
- [ ] Unit: past countdown auto-archived
- [ ] RTL: form submits, list updates
- [ ] RTL: day count visible

---

## Notes

- Linking from a savings goal pulls the same countdown; deletion of the countdown sets the link null on the goal.
- A future "recurring annual" countdown (e.g. anniversary) is a small extension — not in MVP.

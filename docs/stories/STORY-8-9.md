# STORY-8.9: Household chores rota (adults)

**Epic:** EPIC-8: House Module
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to assign recurring tasks to adults with due dates
**So that** the rota is visible

---

## Acceptance Criteria

- [ ] Reuses chores tables (filter by adult profile types)
- [ ] Frequency picker (daily, weekly, fortnightly, monthly, custom RRULE)
- [ ] Overdue indicator for chores past due
- [ ] Marked done by any adult (not just assignee)
- [ ] Separate visual section in House page (not mixed with kid chores)

---

## Technical Implementation

### Files to create / modify

- `client/src/house/AdultChores.tsx`
- `client/src/house/AdultChoreForm.tsx`
- `server/src/routes/chores.ts` — extend to support adult-target listing
- `client/src/api/chores.ts` (already exists from STORY-7.2)

### Implementation steps

1. Endpoint extension: `GET /api/v1/chores?profileType=adult` returns chores assigned to adult profiles.
2. UI in House page (separate section "Adult chores"):
   - List of recurring chores with due indicator.
   - "Mark done" button (calls existing complete endpoint).
   - "Add" CTA opens admin-only form.
3. Form fields: name, assignee (dropdown of adult profiles or "Any adult"), frequency, RRULE option, due_at.
4. Overdue indicator: if `next_due < now`, show red dot.
5. Tests: filter returns adult chores; complete by any adult; overdue indicator.

### Key technical details

- Reuses existing `chores` and `chore_completions` tables; just a UI segregation.
- "Any adult" stored as `assigned_profile_id = null`; complete works for any adult.
- Adult chores don't award visual reward stars (no kid-grid).

---

## Dependencies

- **Blocked by:** STORY-7.2
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: GET ?profileType=adult filters correctly
- [ ] Unit: complete by non-assignee adult → 200
- [ ] RTL: form creates adult chore
- [ ] RTL: overdue indicator visible
- [ ] RTL: complete button updates state

---

## Notes

- Chores assigned to "Any adult" rotate via display ordering — first-come, first-completed.
- A future "auto-rotate" assignment is Phase 2.

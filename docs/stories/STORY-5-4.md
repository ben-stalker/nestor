# STORY-5.4: Meal planner 7-day grid

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a 7-day grid of meal slots I can fill from recipes or free text
**So that** the week's food is planned

---

## Acceptance Criteria

- [ ] `<MealPlanner>` route at `/food/plan` renders Mon–Sun (or locale first-day) columns with configurable slots (default Breakfast, Lunch, Dinner)
- [ ] Slot count and names from `app_settings.meal_slots`
- [ ] Tap empty slot → opens recipe browse modal OR free-text input toggle
- [ ] Tap filled slot → opens full recipe view modal with ingredient checklist
- [ ] Today column visually highlighted (matches `food.png`)
- [ ] Mark-as-cooked toggle on each filled slot (persists `cooked` flag)
- [ ] Week navigation arrows
- [ ] Drag-and-drop between slots flagged Phase 2 (no-op for MVP)

---

## Technical Implementation

### Files to create / modify

- `client/src/food/MealPlanner.tsx`
- `client/src/food/MealSlot.tsx`
- `client/src/food/RecipeBrowseModal.tsx`
- `server/src/routes/mealPlan.ts` — `GET/POST/PATCH/DELETE /api/v1/meal-plan`
- `client/src/api/food.ts`
- `client/tests/food/MealPlanner.test.tsx`

### Implementation steps

1. Server endpoints:
   - `GET /meal-plan?from=&to=` returns rows hydrated with recipe summaries.
   - `POST /meal-plan` `{ plan_date, slot, recipe_id?, free_text? }` upserts (one row per `(plan_date, slot)`).
   - `PATCH /meal-plan/:id` updates (e.g. mark cooked).
   - `DELETE /meal-plan/:id`.
2. Client `<MealPlanner>`:
   - Reads `app_settings.meal_slots` (default `['Breakfast','Lunch','Dinner']`).
   - Builds 7-column × N-slot grid.
   - Each cell is `<MealSlot>` reading the appropriate row.
3. `<MealSlot>`:
   - Empty: ghost button "+" opening browse/free-text picker.
   - Filled with recipe: shows recipe title + thumbnail; tap → recipe view modal.
   - Filled with free_text: shows text; tap → edit.
   - Toggle "✓ cooked" pill.
4. `<RecipeBrowseModal>`: search box + tag filters + grid; selecting a recipe POSTs the slot.
5. Today column: locale-aware "today" detection.
6. Tests: render grid, fill empty slot, mark cooked, navigate week.

### Key technical details

- Design ref: `food.png`.
- Drag-and-drop: keep slots stable for MVP; Phase 2 adds `react-dnd` or HTML5 DnD.
- Slot keys are string IDs; if admin renames `Dinner → Tea`, existing rows stay valid (slot is a free string).
- Mark-as-cooked feeds STORY-5.10 "Cooked recently" indicator (P3) and STORY-5.4 history.

---

## Dependencies

- **Blocked by:** STORY-5.2
- **Blocks:** STORY-5.6 (add ingredients to shopping), STORY-5.10 (history)

---

## Test Checklist

- [ ] RTL: 7 columns × 3 default slots
- [ ] RTL: empty slot tap opens browse modal
- [ ] RTL: filled slot tap opens recipe view
- [ ] RTL: mark cooked toggles persisted state
- [ ] RTL: arrow → next week
- [ ] RTL: today column has accent class
- [ ] Manual: locale fr-FR with first-day=Mon

---

## Notes

- Free-text slots are useful for "leftovers" or "takeaway".
- The recipe view modal is reused from STORY-5.5 detail view.

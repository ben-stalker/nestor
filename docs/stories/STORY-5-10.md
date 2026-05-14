# STORY-5.10: Meal plan history and rotation suggestions

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 8
**Estimate:** S
**Priority:** P3
**Status:** complete

---

## User Story

**As a** household admin
**I want** to see what I cooked recently
**So that** I don't repeat too often

---

## Acceptance Criteria

- [x] Meal plan stores history (no auto-purge)
- [x] "Cooked recently" indicator on recipe cards if cooked in last 14 days
- [x] No suggestion engine in MVP — just visibility

---

## Implementation

The `meal_plan` table has no TTL — history is preserved indefinitely.

`RecipeList.tsx` fetches the last 14 days of meal plan entries alongside the recipe list. It builds a `Set<number>` of recipe IDs that appear in those entries and passes `recentlyCooked: boolean` to each `RecipeCard`.

`RecipeCard.tsx` renders a small "Recent" badge (accent-coloured pill, top-right overlay) when `recentlyCooked=true`.

### Files modified

- `client/src/food/RecipeList.tsx` — fetch last 14 days of meal plan; compute recently-cooked set; pass prop to cards
- `client/src/food/RecipeCard.tsx` — added `recentlyCooked` prop and "Recent" badge overlay

---

## Notes

No suggestion engine in MVP. A future sprint could add "haven't cooked this in 3+ weeks" rotation prompts.

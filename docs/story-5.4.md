# STORY-5.4: Meal planner 7-day grid

## Status: complete

## Goal
A 7-day grid of meal slots that household members can fill from recipes or free text.

## Tasks
### Server
- [x] `server/src/routes/mealPlan.ts` — factory `createMealPlanRouter(mealPlanRepo, recipeRepo)`
- [x] `GET /api/v1/meal-plan?start=YYYY-MM-DD&end=YYYY-MM-DD` — returns entries with recipe inline
- [x] `POST /api/v1/meal-plan` — create/replace entry `{plan_date, slot_name, recipe_id?, free_text?, servings_override?}`
- [x] `DELETE /api/v1/meal-plan/:id` — delete entry
- [x] Mount router in `server/src/app.ts`
- [x] Server tests for endpoints

### Client
- [x] `client/src/food/` directory
- [x] `client/src/food/api.ts` — `getMealPlan(start, end)`, `setMealPlanEntry(input)`, `deleteMealPlanEntry(id)`
- [x] `client/src/food/types.ts` — Recipe, Ingredient, MealPlanEntry interfaces
- [x] `client/src/food/useMealPlan.ts` — TanStack Query hook
- [x] `client/src/food/MealPlanner.tsx` — 7-day grid Mon-Sun columns (locale first-day), slots from app_settings.meal_slots (default: Breakfast/Lunch/Dinner), today highlighted, tap empty → RecipePickerModal or free text
- [x] `client/src/food/RecipePickerModal.tsx` — search and select recipe to assign to slot
- [x] `client/src/food/index.tsx` — FoodPage with tabs: Planner / Recipes (placeholder for 5.5)
- [x] Update `client/src/router.tsx` — replace `/food` placeholder with `<FoodPage />`
- [x] Client tests for MealPlanner

## Acceptance Criteria
- MealPlanner renders Mon–Sun with configurable slots
- Slot count and names from `app_settings.meal_slots`
- Tap empty slot → recipe browse modal or free-text input
- Today column visually highlighted
- Drag-and-drop flagged as Phase 2

## Dependencies
- STORY-5.2

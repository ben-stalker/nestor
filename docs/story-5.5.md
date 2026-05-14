# STORY-5.5: Recipe library list and detail views

## Status: complete

## Goal
Browse, search, and filter the recipe library with a detail view including servings scaler.

## Tasks
### Client
- [x] `client/src/food/RecipeList.tsx` — search by name (debounced), filter by tag pill strip, sort by recently added; card grid layout
- [x] `client/src/food/RecipeCard.tsx` — photo thumbnail (fallback placeholder), title, prep+cook time, servings
- [x] `client/src/food/RecipeDetail.tsx` — hero photo, title, prep/cook/servings/calories chips, ingredient checklist (check-off while cooking), method steps numbered, tags, "Add to meal plan" button, edit/delete (admin-permitted)
- [x] `client/src/food/ServingsScaler.tsx` — numeric stepper that scales ingredient quantities (original servings stored, scale = current/original)
- [x] `client/src/food/useRecipes.ts` — TanStack Query hooks: useRecipes(search, tags), useRecipe(id)
- [x] `client/src/food/RecipeFormModal.tsx` — create/edit form: title, description, prep_mins, cook_mins, servings, tags (comma-separated), ingredients (dynamic list), method (textarea), photo upload
- [x] Two-column landscape layout (recipe list left, detail right on wide screens)
- [x] Update `client/src/food/index.tsx` — wire Recipes tab to RecipeList + RecipeDetail
- [x] Client tests for RecipeList, RecipeDetail, ServingsScaler

## Acceptance Criteria
- List view: search by name, filter by tag, sort by recently added
- Detail view: hero photo, title, chips, ingredient checklist, method steps, tags
- Servings scaler recalculates ingredient quantities
- Edit/delete (admin-permitted)
- Two-column landscape layout per PRD §7

## Dependencies
- STORY-5.2

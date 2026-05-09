# STORY-5.5: Recipe library list and detail views

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** to browse, search, and filter my recipe library
**So that** I can find and reuse recipes

---

## Acceptance Criteria

- [ ] List view at `/food/recipes`: search by name, filter by tag, sort by recently added / alphabetical
- [ ] Detail view: hero photo, title, prep/cook/servings/calories chips, ingredient checklist, method steps, tags, "Add to meal plan" + "Add ingredients to shopping list" CTAs
- [ ] Servings scaler: changing servings recalculates ingredient quantities live
- [ ] Edit/delete (admin-permitted) — admin sees pencil/trash icons
- [ ] Two-column landscape layout per PRD §7 (image/info left, ingredients/method right)
- [ ] Free-text "Import from URL" CTA opens modal that calls STORY-5.3 endpoint

---

## Technical Implementation

### Files to create / modify

- `client/src/food/RecipeList.tsx`
- `client/src/food/RecipeDetail.tsx`
- `client/src/food/RecipeForm.tsx` (used for create/edit)
- `client/src/food/UrlImportModal.tsx`
- `client/src/food/api.ts`
- `client/tests/food/RecipeDetail.test.tsx`

### Implementation steps

1. List page:
   - Search input + tag chips (multi-select).
   - Grid of recipe cards (photo, title, prep+cook total, tags).
   - "Import from URL" CTA + "New recipe" CTA.
2. Detail view:
   - Hero photo (from `photo_path`).
   - Chips row: prep/cook/servings/calories.
   - Ingredient list with checkboxes (toggling does not persist; just visual aid for cooking).
   - Servings input: when changed, multiplier `= newServings / recipe.servings` applied to displayed quantities.
   - Method steps as numbered list.
   - Tags as pills (link to filter).
   - CTAs: "Add to meal plan" (date+slot picker), "Add ingredients to shopping list" (STORY-5.6).
3. `<RecipeForm>` (used for new/edit):
   - Title, description.
   - Photo upload.
   - Ingredients editor (rows: quantity / unit / ingredient).
   - Method steps (sortable rows).
   - Prep/cook/servings/calories.
   - Tags (free-form + autocomplete from existing).
   - Save → POST/PATCH.
4. `<UrlImportModal>`:
   - URL input → calls `/recipes/import-url` → preview form pre-filled → user confirms → POST as new recipe.
5. Two-column landscape layout via Tailwind responsive (`lg:grid-cols-2`).
6. Tests: render detail with sample recipe, change servings → quantities scale, "add to plan" CTA opens slot picker.

### Key technical details

- Design ref: `food.png` recipe detail.
- Servings scaler: keep raw quantities in state; render `(qty * multiplier).toFixed(2)`.
- Ingredient checklist toggles are local state only — useful while cooking.
- Tags shown as clickable pills filter the list view.

---

## Dependencies

- **Blocked by:** STORY-5.2
- **Blocks:** STORY-5.6 (shopping list integration), STORY-5.9 (servings calc deepens)

---

## Test Checklist

- [ ] RTL: list renders cards, search filters
- [ ] RTL: tag click filters
- [ ] RTL: detail renders all fields
- [ ] RTL: change servings → quantities scale
- [ ] RTL: edit form submits PATCH
- [ ] RTL: URL import modal pre-fills form
- [ ] Manual: landscape two-column layout

---

## Notes

- The recipe detail modal is reused inside the meal planner (STORY-5.4) when tapping a filled slot.
- "Cooked recently" indicator on cards (last 14 days) is STORY-5.10 (P3).

# STORY-5.6: Add recipe ingredients to shopping list

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** household member
**I want** to add some/all of a recipe's ingredients to the shopping list with one tap
**So that** meal planning leads naturally to shopping

---

## Acceptance Criteria

- [ ] Recipe detail: per-ingredient checkbox + "Add N items" button
- [ ] On add: deduplicates against existing shopping items by `(name, unit)` — quantities combined
- [ ] Categorisation via built-in mapping (configurable in admin from STORY-5.7's `app_settings.shopping_categories`)
- [ ] Pending-approval flag set true if added by Teen profile
- [ ] Endpoint `POST /api/v1/shopping-items/from-recipe` accepts `{ recipe_id, ingredient_ids[], scale }` to add multiple at once
- [ ] Response: `{ added: [...], merged: [...] }` so UI can show feedback

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/shoppingItems.ts`
- `server/src/services/ShoppingItemService.ts`
- `client/src/food/RecipeDetail.tsx` — extend with checkboxes + CTA
- `client/src/api/shopping.ts`
- `server/src/data/ingredientCategories.ts` — built-in `name → category` mapping (~100 common ingredients)
- `server/tests/services/ShoppingItemService.test.ts`

### Implementation steps

1. Service:
```ts
export class ShoppingItemService {
  async addFromRecipe(recipeId: number, ingredientIds: number[], scale: number, profile: Profile) {
    const ingredients = await ingredientRepo.getByIds(ingredientIds);
    const added: any[] = []; const merged: any[] = [];
    for (const ing of ingredients) {
      const existing = await shoppingItemRepo.findOne({ name: ing.ingredient, unit: ing.unit, ticked: 0 });
      const qty = (ing.quantity ?? 0) * scale;
      if (existing) {
        await shoppingItemRepo.update(existing.id, { quantity: (existing.quantity ?? 0) + qty });
        merged.push({ ...existing, mergedQuantity: qty });
      } else {
        const cat = categoriseIngredient(ing.ingredient);
        const id = await shoppingItemRepo.create({ name: ing.ingredient, quantity: qty, unit: ing.unit, category: cat,
          pending_approval: profile.type === 'teen' ? 1 : 0, added_by_profile_id: profile.id, recipe_id: recipeId, added_at: Date.now() });
        added.push({ id });
      }
    }
    return { added, merged };
  }
}
```
2. Route:
```ts
router.post('/from-recipe', requireProfile, requirePermission('shopping.add'), async (req, res) => {
  const result = await shoppingService.addFromRecipe(req.body.recipe_id, req.body.ingredient_ids, req.body.scale ?? 1, req.profile);
  res.status(201).json(result);
});
```
3. UI: in `<RecipeDetail>` add a checkbox column per ingredient row + "Add N items" button (counts checked).
4. After success, toast: "Added X items, merged Y existing".
5. Tests: merging by (name, unit), pending approval for teen, scale applied.

### Key technical details

- PRD §11 deduplication.
- Categorisation: simple mapping (e.g. `flour → Baking`, `chicken → Meat`); fallback to "Other".
- Teen pending-approval: items show in admin's "Awaiting approval" panel (STORY-5.7).
- The service is reused by future "Add all" CTA on meal plan slots.

---

## Dependencies

- **Blocked by:** STORY-5.5, STORY-5.7
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: adding non-existing item creates row
- [ ] Unit: adding existing same name+unit merges quantity
- [ ] Unit: scale 2 doubles quantities
- [ ] Unit: teen profile sets pending_approval=1
- [ ] Unit: admin profile sets pending_approval=0
- [ ] RTL: checkbox + Add CTA flow

---

## Notes

- Free-form ingredients ("salt to taste") with quantity null still merge if both null and same name.
- Categories editable in admin (STORY-5.7); built-in mapping provides defaults.

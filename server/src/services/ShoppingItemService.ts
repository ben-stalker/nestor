import type ShoppingItemRepository from '../repositories/ShoppingItemRepository';
import type RecipeRepository from '../repositories/RecipeRepository';
import type { ShoppingItem } from '../types/food';
import categoriseIngredient from '../data/ingredientCategories';
import eventBus from '../core/eventBus';

export interface AddFromRecipeResult {
  added: ShoppingItem[];
  merged: ShoppingItem[];
}

export class ShoppingItemService {
  constructor(
    private shoppingRepo: ShoppingItemRepository,
    private recipeRepo: RecipeRepository,
  ) {}

  /**
   * Add ingredients from a recipe to the shopping list, merging quantities where
   * an identical name+unit item already exists and is not ticked.
   *
   * @param recipeId     - The recipe to pull ingredients from.
   * @param ingredientIds - Subset of ingredient IDs to add; pass [] to add all.
   * @param scale        - Multiplier applied to ingredient quantities (e.g. 2 = double).
   * @param profileId    - ID of the profile performing the action.
   * @param profileType  - Type string of the profile; teens get pending_approval = 1.
   */
  addFromRecipe(
    recipeId: number,
    ingredientIds: number[],
    scale: number,
    profileId: number,
    profileType: string,
  ): Promise<AddFromRecipeResult> {
    const recipe = this.recipeRepo.get(recipeId);
    if (!recipe) {
      return Promise.reject(new Error(`Recipe ${recipeId} not found`));
    }

    // Filter to requested ingredients (or all if none specified)
    const ingredients =
      ingredientIds.length > 0
        ? recipe.ingredients.filter((ing) => ingredientIds.includes(ing.id))
        : recipe.ingredients;

    // Load current non-ticked shopping items once for merge checks
    const existingItems = this.shoppingRepo.list().filter((item) => item.ticked === 0);

    const added: ShoppingItem[] = [];
    const merged: ShoppingItem[] = [];
    const pendingApproval = profileType === 'teen' ? 1 : 0;

    ingredients.forEach((ing) => {
      const scaledQuantity = ing.quantity != null ? ing.quantity * scale : null;

      // Find a non-ticked item with matching name (case-insensitive) and unit
      const match = existingItems.find((item) => {
        const nameMatch = item.name.toLowerCase() === ing.ingredient.toLowerCase();
        const unitMatch =
          item.unit == null && ing.unit == null
            ? true
            : item.unit?.toLowerCase() === ing.unit?.toLowerCase();
        return nameMatch && unitMatch;
      });

      if (match) {
        // Merge: add scaled quantity to existing quantity
        const newQuantity =
          match.quantity != null && scaledQuantity != null
            ? match.quantity + scaledQuantity
            : (match.quantity ?? scaledQuantity);

        const updated = this.shoppingRepo.update(match.id, { quantity: newQuantity });
        if (updated) {
          // Keep the existingItems cache entry up to date so later iterations
          // in the same call see the new quantity.
          const idx = existingItems.findIndex((i) => i.id === match.id);
          if (idx !== -1) existingItems[idx] = updated;
          merged.push(updated);
        }
      } else {
        // Create: new shopping list item
        const category = categoriseIngredient(ing.ingredient);
        const created = this.shoppingRepo.create({
          name: ing.ingredient,
          quantity: scaledQuantity,
          unit: ing.unit ?? undefined,
          category,
          ticked: 0,
          added_by_profile_id: profileId,
          pending_approval: pendingApproval,
        });
        // Add to cache so duplicate ingredients in the same recipe batch merge
        existingItems.push(created);
        added.push(created);
      }
    });

    eventBus.emit('shopping:updated', {});

    return Promise.resolve({ added, merged });
  }
}

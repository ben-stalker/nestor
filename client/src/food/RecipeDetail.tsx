import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import ServingsScaler from './ServingsScaler';
import type { Recipe } from './types';
import { useActiveProfile } from '../core/hooks/useActiveProfile';
import { addIngredientsFromRecipe } from './api';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose?: () => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  onAddToMealPlan?: (recipe: Recipe) => void;
}

export default function RecipeDetail({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onAddToMealPlan,
}: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.servings);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [addToast, setAddToast] = useState<string | null>(null);
  const activeProfile = useActiveProfile();
  const isAdmin = activeProfile?.type === 'admin';
  const qc = useQueryClient();

  const addToShoppingMutation = useMutation({
    mutationFn: () => {
      const scale = recipe.servings > 0 ? servings / recipe.servings : 1;
      const ids =
        checkedIngredients.size > 0 ? [...checkedIngredients] : recipe.ingredients.map((i) => i.id);
      return addIngredientsFromRecipe(recipe.id, ids, scale);
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['shopping'] });
      const total = result.added.length + result.merged.length;
      setAddToast(
        result.merged.length > 0
          ? `Added ${result.added.length}, merged ${result.merged.length} (${total} total)`
          : `Added ${total} item${total !== 1 ? 's' : ''} to shopping list`,
      );
      setTimeout(() => setAddToast(null), 3000);
    },
  });

  const scaleFactor = recipe.servings > 0 ? servings / recipe.servings : 1;

  function toggleIngredient(id: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function scaleQuantity(qty: number | null): string {
    if (qty === null) return '';
    const scaled = qty * scaleFactor;
    // Display as integer if whole, else 1 decimal place
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  }

  const methodSteps = recipe.description
    ? recipe.description.split('\n').filter((s) => s.trim().length > 0)
    : [];

  let addShoppingLabel = 'Add all to shopping list';
  if (addToShoppingMutation.isPending) {
    addShoppingLabel = 'Adding…';
  } else if (checkedIngredients.size > 0) {
    addShoppingLabel = `Add ${checkedIngredients.size} item${checkedIngredients.size !== 1 ? 's' : ''} to shopping`;
  }

  return (
    <article className="flex flex-col gap-0 bg-surface overflow-y-auto" data-testid="recipe-detail">
      {/* Hero photo / placeholder */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-accent/20 to-surface-elev flex items-center justify-center overflow-hidden">
        {recipe.photo_path ? (
          <img
            src={`/api/v1/recipes/${recipe.id}/photo`}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl" aria-hidden="true">
            🍽️
          </span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recipe"
            className="absolute top-3 right-3 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Title */}
        <h1 className="text-h1 font-bold text-primary leading-tight">{recipe.title}</h1>

        {/* Chips row */}
        <div className="flex flex-wrap items-center gap-2">
          {recipe.prep_mins > 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-elev px-3 py-1 text-caption text-secondary">
              {recipe.prep_mins}m prep
            </span>
          )}
          {recipe.cook_mins > 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-elev px-3 py-1 text-caption text-secondary">
              {recipe.cook_mins}m cook
            </span>
          )}
          {recipe.calories && (
            <span className="inline-flex items-center rounded-full bg-surface-elev px-3 py-1 text-caption text-secondary">
              {recipe.calories} kcal
            </span>
          )}
          <ServingsScaler baseServings={recipe.servings} value={servings} onChange={setServings} />
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-accent/10 text-accent px-3 py-1 text-caption"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section aria-label="Ingredients">
            <h2 className="text-h2 font-semibold text-primary mb-3">Ingredients</h2>
            <ul className="flex flex-col gap-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleIngredient(ing.id)}
                    aria-label={`${checkedIngredients.has(ing.id) ? 'Uncheck' : 'Check'} ${ing.ingredient}`}
                    className={`mt-0.5 size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checkedIngredients.has(ing.id)
                        ? 'border-accent bg-accent text-white'
                        : 'border-surface-elev bg-surface'
                    }`}
                  >
                    {checkedIngredients.has(ing.id) && (
                      <svg className="size-3" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`text-body ${checkedIngredients.has(ing.id) ? 'line-through text-secondary' : 'text-primary'}`}
                  >
                    {scaleQuantity(ing.quantity)
                      ? `${scaleQuantity(ing.quantity)}${ing.unit ? ` ${ing.unit}` : ''} `
                      : ''}
                    {ing.ingredient}
                    {ing.notes ? <span className="text-secondary"> ({ing.notes})</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Method */}
        {methodSteps.length > 0 && (
          <section aria-label="Method">
            <h2 className="text-h2 font-semibold text-primary mb-3">Method</h2>
            <ol className="flex flex-col gap-3 list-none">
              {methodSteps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 size-6 rounded-full bg-accent/10 text-accent text-caption font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-body text-primary leading-snug">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onAddToMealPlan && (
            <button
              type="button"
              onClick={() => onAddToMealPlan(recipe)}
              className="rounded-card bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Add to meal plan
            </button>
          )}
          <button
            type="button"
            onClick={() => addToShoppingMutation.mutate()}
            disabled={addToShoppingMutation.isPending}
            data-testid="add-to-shopping-btn"
            className="rounded-card border border-accent px-4 py-2 text-body font-medium text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors"
          >
            {addShoppingLabel}
          </button>
          {addToast && (
            <span className="self-center text-caption text-accent" role="status">
              {addToast}
            </span>
          )}
          {isAdmin && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(recipe)}
              className="rounded-card border border-surface-elev px-4 py-2 text-body text-primary hover:bg-surface-elev transition-colors"
              data-testid="edit-btn"
            >
              Edit
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(recipe)}
              className="rounded-card border border-red-300 px-4 py-2 text-body text-red-600 hover:bg-red-50 transition-colors"
              data-testid="delete-btn"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

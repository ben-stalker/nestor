import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MealPlanner from './MealPlanner';
import RecipeList from './RecipeList';
import RecipeDetail from './RecipeDetail';
import RecipeFormModal from './RecipeFormModal';
import ShoppingList from './ShoppingList';
import { deleteRecipe } from './api';
import type { Recipe } from './types';
import { useActiveProfile } from '../core/hooks/useActiveProfile';

type FoodTab = 'planner' | 'recipes' | 'shopping' | 'pantry';

export default function FoodPage() {
  const [tab, setTab] = useState<FoodTab>('planner');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null);
  const qc = useQueryClient();
  const activeProfile = useActiveProfile();
  const isAdmin = activeProfile?.type === 'admin';

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRecipe(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recipes'] });
      setSelectedRecipe(null);
      setPendingDelete(null);
    },
  });

  function handleDeleteRecipe(recipe: Recipe) {
    setPendingDelete(recipe);
  }

  function confirmDelete() {
    if (pendingDelete) {
      deleteMutation.mutate(pendingDelete.id);
    }
  }

  return (
    <main className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex border-b border-surface-elev px-4"
        role="tablist"
        aria-label="Food section"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'planner'}
          onClick={() => setTab('planner')}
          className={`px-4 py-3 text-body font-medium transition-colors border-b-2 -mb-px ${
            tab === 'planner'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Planner
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'recipes'}
          onClick={() => setTab('recipes')}
          className={`px-4 py-3 text-body font-medium transition-colors border-b-2 -mb-px ${
            tab === 'recipes'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Recipes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'shopping'}
          onClick={() => setTab('shopping')}
          className={`px-4 py-3 text-body font-medium transition-colors border-b-2 -mb-px ${
            tab === 'shopping'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Shopping
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pantry'}
          onClick={() => setTab('pantry')}
          className={`px-4 py-3 text-body font-medium transition-colors border-b-2 -mb-px ${
            tab === 'pantry'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Pantry
        </button>
      </div>

      {/* Content */}
      {tab === 'planner' && (
        <div className="flex-1 overflow-y-auto p-4">
          <MealPlanner />
        </div>
      )}

      {tab === 'recipes' && (
        <div className="flex-1 overflow-hidden flex">
          {/* List panel */}
          <div
            className={`overflow-y-auto p-4 ${
              selectedRecipe
                ? 'hidden landscape:block landscape:w-[40%] landscape:border-r landscape:border-surface-elev'
                : 'w-full'
            }`}
          >
            <RecipeList onSelect={setSelectedRecipe} />
          </div>

          {/* Detail panel */}
          {selectedRecipe && (
            <div className="flex-1 overflow-y-auto portrait:w-full landscape:w-[60%]">
              <RecipeDetail
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
                onEdit={isAdmin ? (r) => setEditingRecipe(r) : undefined}
                onDelete={isAdmin ? handleDeleteRecipe : undefined}
              />
            </div>
          )}
        </div>
      )}

      {tab === 'shopping' && (
        <div className="flex-1 overflow-y-auto p-4">
          <ShoppingList />
        </div>
      )}

      {tab === 'pantry' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-4">
          <span className="text-5xl" aria-hidden="true">
            🥫
          </span>
          <p className="text-body text-secondary">Pantry tracking coming soon</p>
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDelete !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative z-10 rounded-card bg-surface p-6 shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-h2 font-semibold text-primary mb-2">Delete recipe?</h2>
            <p className="text-body text-secondary mb-4">
              &ldquo;{pendingDelete.title}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-card border border-surface-elev px-4 py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-card bg-red-500 px-4 py-2 text-body font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <RecipeFormModal
        open={editingRecipe !== null}
        onClose={() => setEditingRecipe(null)}
        recipe={editingRecipe}
      />
    </main>
  );
}

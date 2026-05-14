import { useState } from 'react';
import Modal from '../shared/ui/Modal';
import { useRecipes } from './useRecipes';
import type { Recipe } from './types';

interface RecipePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recipe: Recipe) => void;
}

export default function RecipePickerModal({ open, onClose, onSelect }: RecipePickerModalProps) {
  const [search, setSearch] = useState('');
  const { data: recipes = [] } = useRecipes(search || undefined);

  function handleSelect(recipe: Recipe) {
    onSelect(recipe);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Choose a Recipe">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          className="w-full rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes"
        />

        <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
          {recipes.length === 0 && (
            <p className="py-4 text-center text-body text-secondary">No recipes found</p>
          )}
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              className="flex w-full items-center justify-between rounded-card px-3 py-3 text-left hover:bg-surface-elev active:bg-surface-elev transition-colors"
              onClick={() => handleSelect(recipe)}
            >
              <span className="font-medium text-body text-primary">{recipe.title}</span>
              <span className="flex gap-2 text-caption text-secondary shrink-0 ml-2">
                {recipe.prep_mins > 0 && <span>{recipe.prep_mins}m prep</span>}
                {recipe.cook_mins > 0 && <span>{recipe.cook_mins}m cook</span>}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-card border border-surface-elev py-2 text-body text-secondary hover:bg-surface-elev transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import RecipeCard from './RecipeCard';
import RecipeFormModal from './RecipeFormModal';
import { useRecipes } from './useRecipes';
import { getMealPlan } from './api';
import type { Recipe } from './types';

interface RecipeListProps {
  onSelect?: (recipe: Recipe) => void;
}

export default function RecipeList({ onSelect }: RecipeListProps) {
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(rawSearch);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawSearch]);

  const { data: recipes = [] } = useRecipes(
    search || undefined,
    selectedTags.length > 0 ? selectedTags : undefined,
  );

  // Fetch meal plan for last 14 days to determine recently cooked recipes
  const today = new Date();
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const startStr = fourteenDaysAgo.toISOString().slice(0, 10);
  const endStr = today.toISOString().slice(0, 10);

  const { data: recentMealPlan = [] } = useQuery({
    queryKey: ['meal-plan-recent', startStr, endStr],
    queryFn: () => getMealPlan(startStr, endStr),
    staleTime: 5 * 60_000,
  });

  const recentlyCooked = new Set(
    recentMealPlan.filter((e) => e.recipe_id != null).map((e) => e.recipe_id as number),
  );

  // Collect unique tags from current recipe list
  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags))).sort();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="recipe-list">
      {/* Search + Add */}
      <div className="flex gap-2 items-center">
        <input
          type="search"
          className="flex-1 rounded-card border border-surface-elev bg-surface px-3 py-2 text-body text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Search recipes..."
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          aria-label="Search recipes"
          data-testid="recipe-search"
        />
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          aria-label="Add recipe"
          className="flex items-center gap-1 rounded-card bg-accent px-3 py-2 text-body font-medium text-white hover:bg-accent/90 transition-colors"
          data-testid="add-recipe-btn"
        >
          <Plus className="size-4" />
          <span className="hidden landscape:inline">Add recipe</span>
        </button>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-medium transition-colors ${
              selectedTags.length === 0
                ? 'bg-accent text-white'
                : 'bg-surface-elev text-secondary hover:bg-surface-elev/80'
            }`}
            aria-pressed={selectedTags.length === 0}
            data-testid="tag-all"
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-accent text-white'
                  : 'bg-surface-elev text-secondary hover:bg-surface-elev/80'
              }`}
              aria-pressed={selectedTags.includes(tag)}
              data-testid={`tag-${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Recipe grid */}
      {recipes.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          data-testid="empty-state"
        >
          <span className="text-5xl" aria-hidden="true">
            🍽️
          </span>
          <p className="text-body text-secondary">
            {rawSearch || selectedTags.length > 0
              ? 'No recipes match your search.'
              : 'No recipes yet. Add your first recipe!'}
          </p>
          {!rawSearch && selectedTags.length === 0 && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-card bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Add recipe
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 grid-cols-2 landscape:grid-cols-3 xl:grid-cols-4"
          data-testid="recipe-grid"
        >
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelect}
              recentlyCooked={recentlyCooked.has(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Add/edit modal */}
      <RecipeFormModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}

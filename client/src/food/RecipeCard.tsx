import type { Recipe } from './types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect?: (recipe: Recipe) => void;
  recentlyCooked?: boolean;
}

export default function RecipeCard({ recipe, onSelect, recentlyCooked = false }: RecipeCardProps) {
  const totalTime = recipe.prep_mins + recipe.cook_mins;
  const visibleTags = recipe.tags.slice(0, 2);
  const extraTagCount = recipe.tags.length - visibleTags.length;

  return (
    <button
      type="button"
      className="flex flex-col rounded-card bg-surface border border-surface-elev overflow-hidden text-left hover:shadow-md transition-shadow w-full"
      onClick={() => onSelect?.(recipe)}
      aria-label={recipe.title}
      data-testid={`recipe-card-${recipe.id}`}
    >
      {/* Photo / placeholder */}
      <div className="relative w-full aspect-video bg-surface-elev flex items-center justify-center overflow-hidden">
        {recipe.photo_path ? (
          <img
            src={`/api/v1/recipes/${recipe.id}/photo`}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl" aria-hidden="true">
            🍽️
          </span>
        )}
        {recentlyCooked && (
          <span
            className="absolute top-2 right-2 inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-caption font-medium text-white"
            data-testid="recently-cooked-badge"
          >
            Recent
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="text-body font-semibold text-primary leading-snug line-clamp-2">
          {recipe.title}
        </h3>

        {/* Time + servings chips */}
        <div className="flex flex-wrap gap-1">
          {recipe.prep_mins > 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-elev px-2 py-0.5 text-caption text-secondary">
              {recipe.prep_mins}m prep
            </span>
          )}
          {recipe.cook_mins > 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-elev px-2 py-0.5 text-caption text-secondary">
              {recipe.cook_mins}m cook
            </span>
          )}
          {totalTime === 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-elev px-2 py-0.5 text-caption text-secondary">
              No time set
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-surface-elev px-2 py-0.5 text-caption text-secondary">
            {recipe.servings} servings
          </span>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-accent/10 text-accent px-2 py-0.5 text-caption"
              >
                {tag}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-surface-elev px-2 py-0.5 text-caption text-secondary">
                +{extraTagCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

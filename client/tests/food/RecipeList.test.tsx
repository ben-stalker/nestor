import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Recipe } from '../../src/food/types';

vi.mock('../../src/food/api', () => ({
  getRecipes: vi.fn().mockResolvedValue([]),
  createRecipe: vi.fn().mockResolvedValue({}),
  updateRecipe: vi.fn().mockResolvedValue({}),
  deleteRecipe: vi.fn().mockResolvedValue(undefined),
  getMealPlan: vi.fn().mockResolvedValue([]),
  setMealPlanEntry: vi.fn().mockResolvedValue({}),
  deleteMealPlanEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const RecipeList = (await import('../../src/food/RecipeList')).default;

const RECIPE_1: Recipe = {
  id: 1,
  title: 'Pasta Carbonara',
  description: null,
  prep_mins: 10,
  cook_mins: 20,
  servings: 4,
  calories: null,
  tags: ['italian', 'pasta'],
  photo_path: null,
  source_url: null,
  created_at: 1000,
  ingredients: [],
};

const RECIPE_2: Recipe = {
  id: 2,
  title: 'Green Salad',
  description: null,
  prep_mins: 5,
  cook_mins: 0,
  servings: 2,
  calories: 150,
  tags: ['vegetarian', 'quick'],
  photo_path: null,
  source_url: null,
  created_at: 2000,
  ingredients: [],
};

function renderList(recipes: Recipe[] = [], onSelect?: (r: Recipe) => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['recipes', undefined, undefined], recipes);
  // Pre-populate filtered queries for each recipe's tags
  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags)));
  allTags.forEach((tag) => {
    const filtered = recipes.filter((r) => r.tags.includes(tag));
    qc.setQueryData(['recipes', undefined, [tag]], filtered);
  });
  return render(
    <QueryClientProvider client={qc}>
      <RecipeList onSelect={onSelect} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecipeList', () => {
  it('renders recipe cards for each recipe', () => {
    renderList([RECIPE_1, RECIPE_2]);
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Green Salad')).toBeInTheDocument();
  });

  it('shows empty state when no recipes', () => {
    renderList([]);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText(/No recipes yet/)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderList([RECIPE_1]);
    expect(screen.getByTestId('recipe-search')).toBeInTheDocument();
  });

  it('renders tag filter pills when recipes have tags', () => {
    renderList([RECIPE_1, RECIPE_2]);
    expect(screen.getByTestId('tag-all')).toBeInTheDocument();
    expect(screen.getByTestId('tag-italian')).toBeInTheDocument();
    expect(screen.getByTestId('tag-pasta')).toBeInTheDocument();
    expect(screen.getByTestId('tag-vegetarian')).toBeInTheDocument();
  });

  it('calls onSelect when recipe card is clicked', () => {
    const onSelect = vi.fn();
    renderList([RECIPE_1], onSelect);
    fireEvent.click(screen.getByLabelText('Pasta Carbonara'));
    expect(onSelect).toHaveBeenCalledWith(RECIPE_1);
  });

  it('"All" tag pill is active by default', () => {
    renderList([RECIPE_1]);
    const allPill = screen.getByTestId('tag-all');
    expect(allPill).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a tag pill marks it as pressed', () => {
    renderList([RECIPE_1]);
    const italianPill = screen.getByTestId('tag-italian');
    fireEvent.click(italianPill);
    expect(italianPill).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows add recipe button', () => {
    renderList([]);
    expect(screen.getByTestId('add-recipe-btn')).toBeInTheDocument();
  });

  it('renders recipe grid when recipes exist', () => {
    renderList([RECIPE_1, RECIPE_2]);
    expect(screen.getByTestId('recipe-grid')).toBeInTheDocument();
  });
});

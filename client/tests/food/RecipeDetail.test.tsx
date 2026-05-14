import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Recipe } from '../../src/food/types';

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

// Mock active profile hook
vi.mock('../../src/core/hooks/useActiveProfile', () => ({
  useActiveProfile: vi.fn().mockReturnValue({
    id: 1,
    name: 'Admin',
    type: 'admin',
    colour: '#000',
    avatar_path: null,
    pinSet: false,
    text_size: 'default',
    simplified_nav: 0,
    created_at: 1000,
  }),
}));

const RecipeDetail = (await import('../../src/food/RecipeDetail')).default;

const RECIPE: Recipe = {
  id: 1,
  title: 'Pasta Carbonara',
  description: 'Boil pasta\nMix eggs and cheese\nCombine and serve',
  prep_mins: 10,
  cook_mins: 20,
  servings: 4,
  calories: 600,
  tags: ['italian', 'pasta'],
  photo_path: null,
  source_url: null,
  created_at: 1000,
  ingredients: [
    {
      id: 1,
      recipe_id: 1,
      quantity: 400,
      unit: 'g',
      ingredient: 'spaghetti',
      notes: null,
      sort_order: 0,
    },
    {
      id: 2,
      recipe_id: 1,
      quantity: 2,
      unit: null,
      ingredient: 'eggs',
      notes: 'large',
      sort_order: 1,
    },
    {
      id: 3,
      recipe_id: 1,
      quantity: null,
      unit: null,
      ingredient: 'parmesan',
      notes: null,
      sort_order: 2,
    },
  ],
};

function renderDetail(recipe = RECIPE, overrides: object = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <RecipeDetail recipe={recipe} {...overrides} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecipeDetail', () => {
  it('renders recipe title', () => {
    renderDetail();
    expect(screen.getByRole('heading', { level: 1, name: 'Pasta Carbonara' })).toBeInTheDocument();
  });

  it('renders prep and cook time chips', () => {
    renderDetail();
    expect(screen.getByText('10m prep')).toBeInTheDocument();
    expect(screen.getByText('20m cook')).toBeInTheDocument();
  });

  it('renders calories chip', () => {
    renderDetail();
    expect(screen.getByText('600 kcal')).toBeInTheDocument();
  });

  it('renders tag pills', () => {
    renderDetail();
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('pasta')).toBeInTheDocument();
  });

  it('renders all ingredients', () => {
    renderDetail();
    expect(screen.getAllByText(/spaghetti/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/eggs/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/parmesan/).length).toBeGreaterThan(0);
  });

  it('renders method steps', () => {
    renderDetail();
    expect(screen.getByText('Boil pasta')).toBeInTheDocument();
    expect(screen.getByText('Mix eggs and cheese')).toBeInTheDocument();
    expect(screen.getByText('Combine and serve')).toBeInTheDocument();
  });

  it('ingredient quantities scale with ServingsScaler', () => {
    renderDetail();
    // Default servings = 4, spaghetti = 400g
    expect(screen.getByText(/400/)).toBeInTheDocument();

    // Increase servings to 8
    fireEvent.click(screen.getByLabelText('Increase servings'));
    fireEvent.click(screen.getByLabelText('Increase servings'));
    fireEvent.click(screen.getByLabelText('Increase servings'));
    fireEvent.click(screen.getByLabelText('Increase servings'));
    // Now servings = 8, spaghetti = 800g
    expect(screen.getByText(/800/)).toBeInTheDocument();
  });

  it('shows edit and delete buttons for admin', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderDetail(RECIPE, { onEdit, onDelete });
    expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('hides edit/delete buttons when callbacks are not provided', () => {
    renderDetail();
    expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    renderDetail(RECIPE, { onClose });
    fireEvent.click(screen.getByLabelText('Close recipe'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders servings scaler', () => {
    renderDetail();
    expect(screen.getByTestId('servings-value')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrease servings')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase servings')).toBeInTheDocument();
  });

  it('checking an ingredient marks it as done', () => {
    renderDetail();
    const checkBtn = screen.getByLabelText('Check spaghetti');
    fireEvent.click(checkBtn);
    expect(screen.getByLabelText('Uncheck spaghetti')).toBeInTheDocument();
  });
});

describe('RecipeDetail — non-admin profile', () => {
  beforeEach(async () => {
    const mod = await import('../../src/core/hooks/useActiveProfile');
    vi.mocked(mod.useActiveProfile).mockReturnValue({
      id: 2,
      name: 'Child',
      type: 'child',
      colour: '#FF0000',
      avatar_path: null,
      pinSet: false,
      text_size: 'default',
      simplified_nav: 0,
      created_at: 1000,
    });
  });

  it('does not show edit/delete for child profile when callbacks provided', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderDetail(RECIPE, { onEdit, onDelete });
    expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument();
  });
});

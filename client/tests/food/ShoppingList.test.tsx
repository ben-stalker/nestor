import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ShoppingItem } from '../../src/food/types';

vi.mock('../../src/food/api', () => ({
  getShoppingItems: vi.fn().mockResolvedValue([]),
  createShoppingItem: vi.fn().mockResolvedValue({}),
  updateShoppingItem: vi.fn().mockResolvedValue({}),
  deleteShoppingItem: vi.fn().mockResolvedValue(undefined),
  clearTickedItems: vi.fn().mockResolvedValue({ cleared: 0 }),
  addIngredientsFromRecipe: vi.fn().mockResolvedValue({ added: [], merged: [] }),
  getRecipes: vi.fn().mockResolvedValue([]),
  getMealPlan: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn().mockReturnValue({
    lastMessage: null,
    readyState: 1,
    send: vi.fn(),
  }),
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

const ShoppingList = (await import('../../src/food/ShoppingList')).default;
const api = await import('../../src/food/api');

const ITEM_PRODUCE: ShoppingItem = {
  id: 1,
  name: 'Apples',
  quantity: 6,
  unit: null,
  category: 'Produce',
  ticked: 0,
  added_by_profile_id: 1,
  pending_approval: 0,
  created_at: 1000,
};

const ITEM_DAIRY: ShoppingItem = {
  id: 2,
  name: 'Milk',
  quantity: 2,
  unit: 'L',
  category: 'Dairy',
  ticked: 0,
  added_by_profile_id: 1,
  pending_approval: 0,
  created_at: 2000,
};

const ITEM_TICKED: ShoppingItem = {
  id: 3,
  name: 'Bread',
  quantity: 1,
  unit: null,
  category: 'Bakery',
  ticked: 1,
  added_by_profile_id: 1,
  pending_approval: 0,
  created_at: 3000,
};

function renderList(items: ShoppingItem[] = []) {
  vi.mocked(api.getShoppingItems).mockResolvedValue(items);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ShoppingList />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default implementations after clearAllMocks
  vi.mocked(api.getShoppingItems).mockResolvedValue([]);
  vi.mocked(api.createShoppingItem).mockResolvedValue({} as ShoppingItem);
  vi.mocked(api.updateShoppingItem).mockResolvedValue({} as ShoppingItem);
  vi.mocked(api.deleteShoppingItem).mockResolvedValue(undefined);
  vi.mocked(api.clearTickedItems).mockResolvedValue({ cleared: 0 });
});

describe('ShoppingList', () => {
  it('shows empty state when no items', async () => {
    renderList([]);
    await waitFor(() => {
      expect(screen.getByTestId('shopping-empty')).toBeInTheDocument();
    });
    expect(screen.getByText(/Your shopping list is empty/)).toBeInTheDocument();
  });

  it('renders items grouped by category', async () => {
    renderList([ITEM_PRODUCE, ITEM_DAIRY]);
    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument();
    });
    expect(screen.getByText('Milk')).toBeInTheDocument();
    // Category headings
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('renders item rows with data-testid', async () => {
    renderList([ITEM_PRODUCE]);
    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument();
    });
    const rows = screen.getAllByTestId('shopping-item-row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('tapping checkbox calls updateShoppingItem', async () => {
    vi.mocked(api.updateShoppingItem).mockResolvedValue({ ...ITEM_PRODUCE, ticked: 1 });
    renderList([ITEM_PRODUCE]);
    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument();
    });
    const tickBtn = screen.getByLabelText('Tick Apples');
    fireEvent.click(tickBtn);
    await waitFor(() => {
      expect(api.updateShoppingItem).toHaveBeenCalledWith(ITEM_PRODUCE.id, { ticked: 1 });
    });
  });

  it('quick-add input submits on Enter', async () => {
    vi.mocked(api.createShoppingItem).mockResolvedValue({
      ...ITEM_PRODUCE,
      id: 99,
      name: 'Oranges',
    });
    renderList([]);
    await waitFor(() => {
      expect(screen.getByTestId('shopping-add-input')).toBeInTheDocument();
    });
    const input = screen.getByTestId('shopping-add-input');
    fireEvent.change(input, { target: { value: 'Oranges' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(api.createShoppingItem).toHaveBeenCalledWith({ name: 'Oranges' });
    });
  });

  it('quick-add also submits via Add button click', async () => {
    vi.mocked(api.createShoppingItem).mockResolvedValue({
      ...ITEM_PRODUCE,
      id: 99,
      name: 'Oranges',
    });
    renderList([]);
    await waitFor(() => {
      expect(screen.getByTestId('shopping-add-input')).toBeInTheDocument();
    });
    const input = screen.getByTestId('shopping-add-input');
    fireEvent.change(input, { target: { value: 'Oranges' } });
    fireEvent.click(screen.getByTestId('shopping-add-submit'));
    await waitFor(() => {
      expect(api.createShoppingItem).toHaveBeenCalledWith({ name: 'Oranges' });
    });
  });

  it('shows "Clear ticked" button when items are ticked', async () => {
    vi.mocked(api.clearTickedItems).mockResolvedValue({ cleared: 1 });
    renderList([ITEM_PRODUCE, ITEM_TICKED]);
    await waitFor(() => {
      expect(screen.getByTestId('clear-ticked-btn')).toBeInTheDocument();
    });
    expect(screen.getByText('Clear ticked')).toBeInTheDocument();
  });

  it('clicking "Clear ticked" calls clearTickedItems', async () => {
    vi.mocked(api.clearTickedItems).mockResolvedValue({ cleared: 1 });
    renderList([ITEM_TICKED]);
    await waitFor(() => {
      expect(screen.getByTestId('clear-ticked-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('clear-ticked-btn'));
    await waitFor(() => {
      expect(api.clearTickedItems).toHaveBeenCalled();
    });
  });

  it('ticked items appear in Ticked section with strikethrough', async () => {
    renderList([ITEM_TICKED]);
    await waitFor(() => {
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });
    expect(screen.getByText('Ticked')).toBeInTheDocument();
    const nameEl = screen.getByText('Bread');
    expect(nameEl.className).toContain('line-through');
  });

  it('renders the root element with data-testid="shopping-list"', async () => {
    renderList([]);
    await waitFor(() => {
      expect(screen.getByTestId('shopping-list')).toBeInTheDocument();
    });
  });
});

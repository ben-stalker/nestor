import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/house/api', () => ({
  getBudgetSummary: vi.fn().mockResolvedValue([]),
  getBudgetCategories: vi.fn().mockResolvedValue([]),
  getBudgetExpenses: vi.fn().mockResolvedValue([]),
  createBudgetCategory: vi.fn(),
  updateBudgetCategory: vi.fn(),
  deleteBudgetCategory: vi.fn(),
  createBudgetExpense: vi.fn(),
  deleteBudgetExpense: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const BudgetSummary = (await import('../../src/house/budget/BudgetSummary')).default;

describe('BudgetSummary', () => {
  it('renders empty state when no categories', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <BudgetSummary />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No budget categories/i)).toBeInTheDocument();
    });
  });

  it('renders progress bars and total when data is present', async () => {
    const { getBudgetSummary } = await import('../../src/house/api');
    vi.mocked(getBudgetSummary).mockResolvedValueOnce([
      {
        category: { id: 1, name: 'Groceries', monthly_budget_minor: 30000, colour: '#3B82F6' },
        spent_minor: 12500,
        budget_minor: 30000,
      },
      {
        category: { id: 2, name: 'Utilities', monthly_budget_minor: 15000, colour: '#10B981' },
        spent_minor: 8000,
        budget_minor: 15000,
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <BudgetSummary />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
      expect(screen.getByTestId('total-spent')).toHaveTextContent('£205.00');
    });
  });

  it('renders Add Expense and Categories buttons', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <BudgetSummary />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Expense/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Categories/i })).toBeInTheDocument();
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SavingsGoal } from '../../src/finance/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/finance/api', () => ({
  getSavingsGoals: vi.fn().mockResolvedValue([]),
  createSavingsGoal: vi.fn(),
  updateSavingsGoal: vi.fn(),
  deleteSavingsGoal: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const SavingsGoalList = (await import('../../src/finance/savings/SavingsGoalList')).default;

const MOCK_GOAL: SavingsGoal = {
  id: 1,
  name: 'Holiday Fund',
  target_amount_minor: 300000,
  current_amount_minor: 75000,
  currency: 'GBP',
  target_date: new Date('2026-12-01').getTime(),
  created_at: Date.now(),
};

describe('SavingsGoalList', () => {
  it('renders empty state when no goals', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <SavingsGoalList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No savings goals/i)).toBeInTheDocument();
    });
  });

  it('renders goal cards when data is present', async () => {
    const { getSavingsGoals } = await import('../../src/finance/api');
    vi.mocked(getSavingsGoals).mockResolvedValueOnce([MOCK_GOAL]);

    render(
      <QueryClientProvider client={makeQC()}>
        <SavingsGoalList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Holiday Fund')).toBeInTheDocument();
    });
  });

  it('renders progress bar with correct percentage', async () => {
    const { getSavingsGoals } = await import('../../src/finance/api');
    vi.mocked(getSavingsGoals).mockResolvedValueOnce([MOCK_GOAL]);

    render(
      <QueryClientProvider client={makeQC()}>
        <SavingsGoalList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // 75000 / 300000 = 25%
      const progressBar = screen.getByRole('progressbar', { name: /Holiday Fund/i });
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    });
  });

  it('shows "Goal reached!" when fully funded', async () => {
    const { getSavingsGoals } = await import('../../src/finance/api');
    const completedGoal: SavingsGoal = {
      ...MOCK_GOAL,
      current_amount_minor: 300000,
    };
    vi.mocked(getSavingsGoals).mockResolvedValueOnce([completedGoal]);

    render(
      <QueryClientProvider client={makeQC()}>
        <SavingsGoalList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Goal reached!/i)).toBeInTheDocument();
    });
  });

  it('renders target date when set', async () => {
    const { getSavingsGoals } = await import('../../src/finance/api');
    vi.mocked(getSavingsGoals).mockResolvedValueOnce([MOCK_GOAL]);

    render(
      <QueryClientProvider client={makeQC()}>
        <SavingsGoalList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Target:/i)).toBeInTheDocument();
    });
  });
});

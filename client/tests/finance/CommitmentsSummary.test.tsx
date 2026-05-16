import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FinanceSummary } from '../../src/finance/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/finance/api', () => ({
  getFinanceSummary: vi.fn().mockResolvedValue({ categories: [], grand_total_minor: 0 }),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const CommitmentsSummary = (await import('../../src/finance/summary/CommitmentsSummary')).default;

const MOCK_SUMMARY: FinanceSummary = {
  categories: [
    {
      label: 'Mortgage',
      monthly_total_minor: 120000,
      items: [{ id: 1, name: 'Home Mortgage', monthly_minor: 120000, source: 'agreement' }],
    },
    {
      label: 'Subscriptions',
      monthly_total_minor: 1799,
      items: [{ id: 1, name: 'Netflix', monthly_minor: 1799, source: 'subscription' }],
    },
  ],
  grand_total_minor: 121799,
};

describe('CommitmentsSummary', () => {
  it('renders empty state when no commitments', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <CommitmentsSummary />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No commitments/i)).toBeInTheDocument();
    });
  });

  it('renders categories and grand total', async () => {
    const { getFinanceSummary } = await import('../../src/finance/api');
    vi.mocked(getFinanceSummary).mockResolvedValueOnce(MOCK_SUMMARY);

    render(
      <QueryClientProvider client={makeQC()}>
        <CommitmentsSummary />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Mortgage')).toBeInTheDocument();
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
      expect(screen.getByTestId('grand-total')).toBeInTheDocument();
    });
  });

  it('expands a category to show items', async () => {
    const user = userEvent.setup();
    const { getFinanceSummary } = await import('../../src/finance/api');
    vi.mocked(getFinanceSummary).mockResolvedValueOnce(MOCK_SUMMARY);

    render(
      <QueryClientProvider client={makeQC()}>
        <CommitmentsSummary />
      </QueryClientProvider>,
    );

    await waitFor(() => screen.getByText('Mortgage'));
    await user.click(screen.getByText('Mortgage'));

    await waitFor(() => {
      expect(screen.getByText('Home Mortgage')).toBeInTheDocument();
    });
  });
});

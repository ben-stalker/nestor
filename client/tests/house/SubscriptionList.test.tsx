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
  getSubscriptions: vi.fn().mockResolvedValue({ subscriptions: [], totalMonthlyCost: 0 }),
  deleteSubscription: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const SubscriptionList = (await import('../../src/house/subscriptions/SubscriptionList')).default;

describe('SubscriptionList', () => {
  it('renders empty state when no subscriptions', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <SubscriptionList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No subscriptions/i)).toBeInTheDocument();
    });
  });

  it('renders subscriptions list and total', async () => {
    const { getSubscriptions } = await import('../../src/house/api');
    vi.mocked(getSubscriptions).mockResolvedValueOnce({
      subscriptions: [
        {
          id: 1,
          name: 'Netflix',
          category: 'streaming',
          monthly_cost: 1499,
          renewal_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
          trial_end_date: null,
          alert_days_before: 7,
          active: true,
        },
        {
          id: 2,
          name: 'Spotify',
          category: 'streaming',
          monthly_cost: 999,
          renewal_date: Date.now() + 15 * 24 * 60 * 60 * 1000,
          trial_end_date: null,
          alert_days_before: 7,
          active: true,
        },
      ],
      totalMonthlyCost: 2498,
    });

    render(
      <QueryClientProvider client={makeQC()}>
        <SubscriptionList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Spotify')).toBeInTheDocument();
      expect(screen.getByTestId('total-cost')).toHaveTextContent('£24.98');
    });
  });

  it('renders Add button', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <SubscriptionList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FinanceAgreement } from '../../src/finance/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/finance/api', () => ({
  getAgreements: vi.fn().mockResolvedValue([]),
  createAgreement: vi.fn(),
  updateAgreement: vi.fn(),
  deleteAgreement: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const AgreementList = (await import('../../src/finance/agreements/AgreementList')).default;

const MOCK_MORTGAGE: FinanceAgreement = {
  id: 1,
  name: 'Home Mortgage',
  type: 'mortgage',
  lender: 'Halifax',
  monthly_payment_minor: 120000,
  start_date: new Date('2020-01-01').getTime(),
  end_date: new Date('2045-01-01').getTime(),
  balance_minor: 20000000,
  interest_rate: 4.5,
  fixed_rate_end_date: new Date('2027-01-01').getTime(),
  balloon_payment_minor: null,
  alert_months_before: 6,
  currency: 'GBP',
  notes: null,
  active: true,
};

describe('AgreementList', () => {
  it('renders empty state when no agreements', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <AgreementList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No agreements/i)).toBeInTheDocument();
    });
  });

  it('renders agreement cards when data is present', async () => {
    const { getAgreements } = await import('../../src/finance/api');
    vi.mocked(getAgreements).mockResolvedValueOnce([MOCK_MORTGAGE]);

    render(
      <QueryClientProvider client={makeQC()}>
        <AgreementList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Home Mortgage')).toBeInTheDocument();
      expect(screen.getByText('Halifax')).toBeInTheDocument();
    });
  });

  it('renders monthly total for active agreements', async () => {
    const { getAgreements } = await import('../../src/finance/api');
    vi.mocked(getAgreements).mockResolvedValueOnce([MOCK_MORTGAGE]);

    render(
      <QueryClientProvider client={makeQC()}>
        <AgreementList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('total-monthly')).toBeInTheDocument();
    });
  });

  it('renders mortgage type pill', async () => {
    const { getAgreements } = await import('../../src/finance/api');
    vi.mocked(getAgreements).mockResolvedValueOnce([MOCK_MORTGAGE]);

    render(
      <QueryClientProvider client={makeQC()}>
        <AgreementList />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Mortgage')).toBeInTheDocument();
    });
  });
});

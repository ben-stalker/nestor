import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  getSavingsGoals: vi.fn().mockResolvedValue([]),
  createSavingsGoal: vi.fn(),
  updateSavingsGoal: vi.fn(),
  deleteSavingsGoal: vi.fn(),
  getFinanceSummary: vi.fn().mockResolvedValue({ categories: [], grand_total_minor: 0 }),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const FinancePage = (await import('../../src/finance/FinancePage')).default;

describe('FinancePage', () => {
  it('renders tab list', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <FinancePage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Agreements' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Savings Goals' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Summary' })).toBeInTheDocument();
  });

  it('shows agreements empty state by default', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <FinancePage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No agreements/i)).toBeInTheDocument();
    });
  });

  it('switches to savings tab', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={makeQC()}>
        <FinancePage />
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole('tab', { name: 'Savings Goals' }));
    await waitFor(() => {
      expect(screen.getByText(/No savings goals/i)).toBeInTheDocument();
    });
  });

  it('switches to summary tab and shows empty state', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={makeQC()}>
        <FinancePage />
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole('tab', { name: 'Summary' }));
    await waitFor(() => {
      expect(screen.getByText(/No commitments/i)).toBeInTheDocument();
    });
  });
});

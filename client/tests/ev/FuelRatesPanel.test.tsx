import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/ev/api', () => ({
  getFuelRates: vi.fn().mockResolvedValue({
    current: { electricity: 0.28, gas: 0.1 },
    history: [{ fuel: 'electricity', rate: 0.24, effective_date: '2025-01-01' }],
  }),
  updateFuelRates: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ adminPin: '1234' })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const FuelRatesPanel = (await import('../../src/ev/FuelRatesPanel')).default;

describe('FuelRatesPanel', () => {
  it('shows electricity rate', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <FuelRatesPanel />
      </QueryClientProvider>,
    );
    await screen.findByText(/0.28p/);
  });

  it('shows edit button for admin', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <FuelRatesPanel />
      </QueryClientProvider>,
    );
    await screen.findByText(/edit rates/i);
  });

  it('shows rate history', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <FuelRatesPanel />
      </QueryClientProvider>,
    );
    await screen.findByText(/rate history/i);
    await screen.findByText(/0.24p/);
  });
});

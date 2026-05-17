import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { EnergySummary } from '../../src/ev/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const mockSummary: EnergySummary = {
  this_month: {
    ev_kwh: 45.2,
    ev_cost_minor: 1127,
    electricity_units: 230,
    electricity_cost_minor: 6440,
    gas_cost_minor: 3200,
    oil_cost_minor: 0,
    total_cost_minor: 10767,
  },
  monthly_ev_history: [
    { year: 2026, month: 5, total_kwh: 45.2, total_cost_minor: 1127, session_count: 8 },
    { year: 2026, month: 4, total_kwh: 30, total_cost_minor: 800, session_count: 5 },
  ],
};

vi.mock('../../src/ev/api', () => ({
  getEnergySummary: vi.fn().mockResolvedValue(mockSummary),
  getFuelRates: vi.fn().mockResolvedValue({ current: {}, history: [] }),
  updateFuelRates: vi.fn(),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const EnergyOverview = (await import('../../src/ev/EnergyOverview')).default;

describe('EnergyOverview', () => {
  it('renders this month section', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EnergyOverview />
      </QueryClientProvider>,
    );
    await screen.findByText(/this month/i);
  });

  it('renders EV charging cost card', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EnergyOverview />
      </QueryClientProvider>,
    );
    await screen.findByText(/EV Charging/i);
    await screen.findByText('£11.27');
  });

  it('renders monthly history section', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EnergyOverview />
      </QueryClientProvider>,
    );
    await screen.findByText(/last 12 months/i);
  });

  it('shows electricity card', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EnergyOverview />
      </QueryClientProvider>,
    );
    await screen.findByText('Electricity');
  });
});

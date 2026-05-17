import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/vehicles/api', () => ({
  getVehicles: vi.fn().mockResolvedValue([{ id: 1, nickname: 'Leaf', type: 'ev' }]),
}));

vi.mock('../../src/ev/api', () => ({
  listChargingLogs: vi.fn().mockResolvedValue([]),
  getMonthlyTotals: vi.fn().mockResolvedValue([]),
  getEnergySummary: vi.fn().mockResolvedValue({
    this_month: {
      ev_kwh: 0,
      ev_cost_minor: 0,
      electricity_units: 0,
      electricity_cost_minor: 0,
      gas_cost_minor: 0,
      oil_cost_minor: 0,
      total_cost_minor: 0,
    },
    monthly_ev_history: [],
  }),
  getFuelRates: vi.fn().mockResolvedValue({ current: {}, history: [] }),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const EvPage = (await import('../../src/ev/EvPage')).default;

describe('EvPage', () => {
  it('renders EV & Energy heading', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EvPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/EV & Energy/i)).toBeTruthy();
  });

  it('shows tabs', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EvPage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('tab', { name: /charging/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /energy/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /rates/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /reminders/i })).toBeTruthy();
  });

  it('switches to Energy tab on click', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <EvPage />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /energy/i }));
    expect(screen.getByRole('tab', { name: /energy/i }).getAttribute('aria-selected')).toBe('true');
  });
});

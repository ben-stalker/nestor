import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/ev/api', () => ({
  listChargingLogs: vi.fn().mockResolvedValue([]),
  createChargingLog: vi.fn(),
  updateChargingLog: vi.fn(),
  deleteChargingLog: vi.fn(),
  getMonthlyTotals: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const ChargingLogList = (await import('../../src/ev/ChargingLogList')).default;

const evVehicles = [{ id: 1, nickname: 'Leaf', type: 'ev' }];

describe('ChargingLogList', () => {
  it('renders log session button', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ChargingLogList vehicles={evVehicles} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/log session/i)).toBeTruthy();
  });

  it('renders empty state when no logs', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ChargingLogList vehicles={evVehicles} />
      </QueryClientProvider>,
    );
    await screen.findByText(/no charging sessions/i);
  });

  it('shows vehicle dropdown when multiple EVs', () => {
    const vehicles = [
      { id: 1, nickname: 'Leaf', type: 'ev' },
      { id: 2, nickname: 'Tesla', type: 'ev' },
    ];
    render(
      <QueryClientProvider client={makeQC()}>
        <ChargingLogList vehicles={vehicles} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('combobox')).toBeTruthy();
  });
});

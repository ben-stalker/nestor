import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/vehicles/api', () => ({
  getVehicles: vi.fn().mockResolvedValue([]),
  createVehicle: vi.fn().mockResolvedValue({}),
  updateVehicle: vi.fn().mockResolvedValue({}),
  deleteVehicle: vi.fn().mockResolvedValue(undefined),
  getBookings: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn().mockResolvedValue({}),
  updateBooking: vi.fn().mockResolvedValue({}),
  deleteBooking: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../src/core/hooks/useActiveProfile', () => ({
  useActiveProfile: vi.fn().mockReturnValue({ id: 1, type: 'admin', name: 'Admin' }),
}));

const VehicleList = (await import('../../src/vehicles/VehicleList')).default;

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('VehicleList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state with no vehicles', async () => {
    wrap(<VehicleList onSelect={vi.fn()} />);
    expect(await screen.findByText('No vehicles yet')).toBeInTheDocument();
  });

  it('renders Add vehicle button for admin', async () => {
    wrap(<VehicleList onSelect={vi.fn()} />);
    expect(
      await screen.findByRole('button', { name: 'Add your first vehicle' }),
    ).toBeInTheDocument();
  });
});

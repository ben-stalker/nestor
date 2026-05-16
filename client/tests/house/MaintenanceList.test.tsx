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
  getMaintenanceItems: vi.fn().mockResolvedValue([]),
  deleteMaintenanceItem: vi.fn(),
  createMaintenanceItem: vi.fn(),
  updateMaintenanceItem: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const MaintenanceList = (await import('../../src/house/maintenance/MaintenanceList')).default;

describe('MaintenanceList', () => {
  it('renders empty state when no items', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <MaintenanceList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No items/i)).toBeInTheDocument();
    });
  });

  it('renders maintenance items', async () => {
    const { getMaintenanceItems } = await import('../../src/house/api');
    vi.mocked(getMaintenanceItems).mockResolvedValueOnce([
      {
        id: 1,
        title: 'Fix boiler',
        type: 'job',
        completed_date: null,
        next_due_date: null,
        cost: null,
        contact_id: null,
        landlord_report: false,
        renter_mode: false,
        notes: null,
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <MaintenanceList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Fix boiler')).toBeInTheDocument();
    });
  });

  it('renders type filter buttons', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <MaintenanceList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Job')).toBeInTheDocument();
      expect(screen.getByText('Warranty')).toBeInTheDocument();
      expect(screen.getByText('Reminder')).toBeInTheDocument();
    });
  });
});

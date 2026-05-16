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
  getBinSchedules: vi.fn().mockResolvedValue([]),
  getBinUpcoming: vi.fn().mockResolvedValue({ bins: [] }),
  createBinSchedule: vi.fn(),
  updateBinSchedule: vi.fn(),
  deleteBinSchedule: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const BinScheduleList = (await import('../../src/house/bins/BinScheduleList')).default;

describe('BinScheduleList', () => {
  it('renders empty state when no bins', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <BinScheduleList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No bin schedules/i)).toBeInTheDocument();
    });
  });

  it('renders bins when data is present', async () => {
    const { getBinSchedules } = await import('../../src/house/api');
    vi.mocked(getBinSchedules).mockResolvedValueOnce([
      {
        id: 1,
        name: 'General Waste',
        colour: '#333',
        icon: 'trash',
        day_of_week: 1,
        frequency_weeks: 1,
        anchor_date: Date.now(),
        bank_holiday_shift: false,
        reminder_evening_before: true,
        reminder_morning_of: false,
        audio_chime: false,
        active: true,
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <BinScheduleList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('General Waste')).toBeInTheDocument();
    });
  });

  it('renders Add Bin button', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <BinScheduleList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add bin/i })).toBeInTheDocument();
    });
  });

  it('shows frequency label for fortnightly bin', async () => {
    const { getBinSchedules } = await import('../../src/house/api');
    vi.mocked(getBinSchedules).mockResolvedValueOnce([
      {
        id: 2,
        name: 'Recycling',
        colour: '#00f',
        icon: 'recycle',
        day_of_week: 3,
        frequency_weeks: 2,
        anchor_date: Date.now(),
        bank_holiday_shift: true,
        reminder_evening_before: true,
        reminder_morning_of: false,
        audio_chime: false,
        active: true,
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <BinScheduleList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Fortnightly/i)).toBeInTheDocument();
    });
  });
});

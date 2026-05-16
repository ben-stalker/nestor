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
  getMeterReadings: vi.fn().mockResolvedValue([]),
  deleteMeterReading: vi.fn(),
  createMeterReading: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const MeterReadingList = (await import('../../src/house/meter/MeterReadingList')).default;

describe('MeterReadingList', () => {
  it('renders empty state when no readings', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <MeterReadingList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/No readings/i)).toBeInTheDocument();
    });
  });

  it('renders fuel type tab buttons', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <MeterReadingList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Gas')).toBeInTheDocument();
      expect(screen.getByText('Oil')).toBeInTheDocument();
      expect(screen.getByText('Water')).toBeInTheDocument();
    });
  });

  it('renders readings and chart bars when data is present', async () => {
    const { getMeterReadings } = await import('../../src/house/api');
    vi.mocked(getMeterReadings).mockResolvedValueOnce([
      {
        id: 1,
        fuel_type: 'electricity',
        reading_date: new Date('2026-05-01').getTime(),
        value: 12345.6,
        unit: 'kWh',
        cost_per_unit: null,
        notes: null,
      },
      {
        id: 2,
        fuel_type: 'electricity',
        reading_date: new Date('2026-04-01').getTime(),
        value: 12100.0,
        unit: 'kWh',
        cost_per_unit: null,
        notes: null,
      },
    ]);

    render(
      <QueryClientProvider client={makeQC()}>
        <MeterReadingList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/12345.6/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Meter readings bar chart/i)).toBeInTheDocument();
    });
  });
});

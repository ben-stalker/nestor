import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationsPanel from '../../src/admin/NotificationsPanel';

vi.mock('../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  ApiError: class extends Error {
    status = 0;
  },
}));

// Stable reference prevents useEffect infinite loop
const SETTINGS_DATA = {
  reminder_windows: [{ id: 'vehicle_mot', minutesBefore: 43200 }],
};

vi.mock('../../src/core/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ data: SETTINGS_DATA, isLoading: false }),
  APP_SETTINGS_KEY: ['app-settings'],
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('NotificationsPanel', () => {
  it('renders all reminder type rows', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NotificationsPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Vehicle MOT')).toBeInTheDocument();
    expect(screen.getByText('Vehicle service')).toBeInTheDocument();
    expect(screen.getByText('Subscription renewal')).toBeInTheDocument();
    expect(screen.getByText('Pet health log (upcoming care)')).toBeInTheDocument();
  });

  it('renders day inputs', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NotificationsPanel />
      </QueryClientProvider>,
    );
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThan(5);
  });

  it('renders Save button', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NotificationsPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('updates day value on change', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NotificationsPanel />
      </QueryClientProvider>,
    );
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '14' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('14');
  });
});

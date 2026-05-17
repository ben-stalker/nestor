import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DisplayPanel from '../../src/admin/DisplayPanel';

vi.mock('../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  ApiError: class extends Error {
    status = 0;
  },
}));

// Stable reference prevents useEffect infinite loop
const SETTINGS_DATA = {
  orientation: 'auto',
  idle_dim_seconds: 120,
  idle_sleep_seconds: 600,
  idle_dim_level: 0.3,
  night_mode_enabled: false,
  night_mode_start: '22:00',
  night_mode_end: '07:00',
  night_mode_dim_level: 0.1,
  screensaver_folder: '',
  screensaver_interval_seconds: 30,
};

vi.mock('../../src/core/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ data: SETTINGS_DATA, isLoading: false }),
  APP_SETTINGS_KEY: ['app-settings'],
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('DisplayPanel', () => {
  it('renders orientation buttons', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DisplayPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Portrait' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Landscape' })).toBeInTheDocument();
  });

  it('renders idle dim timeout input', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DisplayPanel />
      </QueryClientProvider>,
    );
    // Number inputs for dim and sleep timeouts
    const spinbuttons = screen.getAllByRole('spinbutton');
    expect(spinbuttons.length).toBeGreaterThanOrEqual(2);
    expect(spinbuttons[0]).toBeInTheDocument();
  });

  it('shows night mode section heading', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DisplayPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Night mode')).toBeInTheDocument();
    // Night mode toggle checkbox is present (sr-only)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Save button', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DisplayPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavigationPanel from '../../src/admin/NavigationPanel';

vi.mock('../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  ApiError: class extends Error {
    status = 0;
  },
}));

// Stable reference prevents useEffect infinite loop
const SETTINGS_DATA = {
  nav_mode_order: [],
  nav_mode_hidden: [],
  nav_mode_labels: {},
  nav_layout: 'default',
};

vi.mock('../../src/core/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ data: SETTINGS_DATA, isLoading: false }),
  APP_SETTINGS_KEY: ['app-settings'],
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('NavigationPanel', () => {
  it('renders layout selector buttons', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NavigationPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compact' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expanded' })).toBeInTheDocument();
  });

  it('renders all default nav mode items', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NavigationPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <NavigationPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccessibilityPanel from '../../src/admin/AccessibilityPanel';

vi.mock('../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  ApiError: class extends Error {
    status = 0;
  },
}));

// Use stable object reference to avoid infinite useEffect loop
const SETTINGS_DATA = {
  text_size_global: 'normal',
  high_contrast: false,
  colour_blind_palette: 'none',
  reduced_motion_global: false,
  simplified_nav_global: false,
};

vi.mock('../../src/core/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ data: SETTINGS_DATA, isLoading: false }),
  APP_SETTINGS_KEY: ['app-settings'],
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('AccessibilityPanel', () => {
  it('renders text size buttons', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <AccessibilityPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /^Normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Large/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^X-Large/i })).toBeInTheDocument();
  });

  it('renders colour-blind palette selector', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <AccessibilityPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/default/i)).toBeInTheDocument();
    expect(screen.getByText(/deuteranopia/i)).toBeInTheDocument();
  });

  it('renders preview area', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <AccessibilityPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/preview/i)).toBeInTheDocument();
    expect(screen.getByText(/quick brown fox/i)).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <AccessibilityPanel />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});

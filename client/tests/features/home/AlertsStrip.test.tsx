import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AlertsStrip from '../../../src/features/home/AlertsStrip';
import type { Alert } from '../../../src/api/alerts';

vi.mock('../../../src/api/alerts', () => ({
  getAlerts: vi.fn(),
  dismissAlert: vi.fn(),
}));

vi.mock('../../../src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ lastMessage: null, readyState: 1, send: vi.fn() }),
}));

const { getAlerts, dismissAlert } = await import('../../../src/api/alerts');

const MOCK_ALERTS: Alert[] = [
  {
    id: 1,
    type: 'weather_down',
    severity: 'warning',
    message: 'Weather data unavailable',
    deep_link: null,
    profile_id: null,
    dismissed: false,
    dismissed_at: null,
    created_at: 1_700_000_000_000,
  },
  {
    id: 2,
    type: 'test_error',
    severity: 'error',
    message: 'Something broke',
    deep_link: '/house',
    profile_id: null,
    dismissed: false,
    dismissed_at: null,
    created_at: 1_700_000_000_001,
  },
];

function renderStrip(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <AlertsStrip />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dismissAlert).mockResolvedValue(undefined);
});

describe('AlertsStrip', () => {
  it('renders nothing when no alerts', () => {
    vi.mocked(getAlerts).mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['alerts'], []);

    renderStrip(qc);
    expect(screen.queryByTestId('alerts-strip')).toBeNull();
  });

  it('renders alert items', () => {
    vi.mocked(getAlerts).mockResolvedValue(MOCK_ALERTS);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['alerts'], MOCK_ALERTS);

    renderStrip(qc);
    expect(screen.getByTestId('alerts-strip')).toBeInTheDocument();
    expect(screen.getByTestId('alert-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('alert-item-2')).toBeInTheDocument();
  });

  it('shows alert messages', () => {
    vi.mocked(getAlerts).mockResolvedValue(MOCK_ALERTS);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['alerts'], MOCK_ALERTS);

    renderStrip(qc);
    expect(screen.getByText('Weather data unavailable')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders deep link as anchor', () => {
    vi.mocked(getAlerts).mockResolvedValue(MOCK_ALERTS);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['alerts'], MOCK_ALERTS);

    renderStrip(qc);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/house');
  });

  it('optimistically removes alert on dismiss click', async () => {
    const user = userEvent.setup();
    vi.mocked(getAlerts).mockResolvedValue(MOCK_ALERTS);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['alerts'], MOCK_ALERTS);

    renderStrip(qc);
    const dismissBtn = screen.getByRole('button', {
      name: /dismiss alert: weather data unavailable/i,
    });
    await user.click(dismissBtn);
    expect(dismissAlert).toHaveBeenCalledWith(1);
  });
});

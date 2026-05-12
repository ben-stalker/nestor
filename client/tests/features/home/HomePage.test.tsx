import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../../src/features/home';
import type { Alert } from '../../../src/api/alerts';

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    button: ({ children, layout: _l, transition: _t, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LayoutGroup: ({ children }: any) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../src/api/client', () => ({
  default: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/lines-between-class-members
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../../src/api/profiles', () => ({ getProfiles: vi.fn() }));
vi.mock('../../../src/api/weather', () => ({ getWeather: vi.fn() }));
vi.mock('../../../src/api/alerts', () => ({ getAlerts: vi.fn(), dismissAlert: vi.fn() }));
vi.mock('../../../src/api/journeys', () => ({ getJourneyEtas: vi.fn(), getJourneys: vi.fn() }));
vi.mock('../../../src/core/applyProfileSettings', () => ({ applyProfileSettings: vi.fn() }));
vi.mock('../../../src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ lastMessage: null, readyState: 1, send: vi.fn() }),
}));

const { getAlerts } = await import('../../../src/api/alerts');
const { getJourneyEtas } = await import('../../../src/api/journeys');

function renderPage(alerts: Alert[] = []) {
  vi.mocked(getAlerts).mockResolvedValue(alerts);
  vi.mocked(getJourneyEtas).mockResolvedValue([]);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['alerts'], alerts);
  qc.setQueryData(['journey-etas-none'], []);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('renders the main home page element', () => {
    renderPage();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders the home header', () => {
    renderPage();
    expect(screen.getByTestId('home-header')).toBeInTheDocument();
  });

  it('renders day carousel and journey widget', () => {
    renderPage();
    expect(screen.getByTestId('day-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('journey-widget')).toBeInTheDocument();
    // PluginWidgetStrip hides itself when no plugins registered — that is the normal state in tests
  });

  it('shows alerts strip when there are active alerts', async () => {
    const alert: Alert = {
      id: 1,
      type: 'test',
      severity: 'info',
      message: 'Test alert',
      deep_link: null,
      profile_id: null,
      dismissed: false,
      dismissed_at: null,
      created_at: Date.now(),
    };
    renderPage([alert]);
    expect(await screen.findByTestId('alerts-strip')).toBeInTheDocument();
  });

  it('hides alerts strip when no alerts', () => {
    renderPage([]);
    expect(screen.queryByTestId('alerts-strip')).toBeNull();
  });
});

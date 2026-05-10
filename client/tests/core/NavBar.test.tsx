import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavBar from '../../src/core/NavBar';
import useAppStore from '../../src/store/appStore';
import { useOrientation } from '../../src/core/hooks/useOrientation';

vi.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ lastMessage: null, readyState: 1, send: vi.fn() })),
}));

vi.mock('../../src/core/hooks/useOrientation', () => ({
  useOrientation: vi.fn(() => 'portrait'),
}));

vi.mock('../../src/api/client', () => ({
  default: vi.fn(() => Promise.resolve(null)),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderNavBar(initialEntry = '/', qc = makeQC()) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <NavBar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppStore.setState({ badgeCounts: {} });
  vi.mocked(useOrientation).mockReturnValue('portrait');
});

describe('NavBar — default modes', () => {
  it('renders all 10 default mode buttons', () => {
    renderNavBar();
    [
      'Home',
      'Calendar',
      'Food',
      'Travel',
      'Family',
      'House',
      'Finance',
      'Pets',
      'EV',
      'Board',
    ].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it('renders a nav landmark with accessible label', () => {
    renderNavBar();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('each button is a link with correct href', () => {
    renderNavBar();
    expect(screen.getByRole('link', { name: /calendar/i })).toHaveAttribute('href', '/calendar');
    expect(screen.getByRole('link', { name: /food/i })).toHaveAttribute('href', '/food');
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });

  it('active link has aria-current="page"', () => {
    renderNavBar('/calendar');
    const calendarLink = screen.getByRole('link', { name: /calendar/i });
    expect(calendarLink).toHaveAttribute('aria-current', 'page');
  });

  it('inactive links do not have aria-current', () => {
    renderNavBar('/calendar');
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).not.toHaveAttribute('aria-current', 'page');
  });
});

describe('NavBar — enabled_nav_modes filtering', () => {
  it('only renders modes listed in enabled_nav_modes', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], {
      enabled_nav_modes: ['home', 'calendar', 'food'],
      nav_layout: 'scrollable',
    });

    renderNavBar('/', qc);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.queryByText('Travel')).not.toBeInTheDocument();
    expect(screen.queryByText('Family')).not.toBeInTheDocument();
  });

  it('renders modes in the order specified by enabled_nav_modes', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], {
      enabled_nav_modes: ['calendar', 'home', 'pets'],
    });

    renderNavBar('/', qc);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/calendar');
    expect(links[1]).toHaveAttribute('href', '/');
    expect(links[2]).toHaveAttribute('href', '/pets');
  });

  it('ignores unknown mode IDs gracefully', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], {
      enabled_nav_modes: ['home', 'unknown-mode', 'calendar'],
    });

    renderNavBar('/', qc);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});

describe('NavBar — badge counts', () => {
  it('does not show badge when count is 0', () => {
    renderNavBar();
    expect(screen.queryByLabelText(/unread/i)).not.toBeInTheDocument();
  });

  it('shows badge when badgeCounts has a positive value', () => {
    useAppStore.setState({ badgeCounts: { calendar: 3 } });
    renderNavBar();
    expect(screen.getByLabelText('3 unread')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps badge display at 99+', () => {
    useAppStore.setState({ badgeCounts: { home: 150 } });
    renderNavBar();
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('shows badges for multiple modes independently', () => {
    useAppStore.setState({ badgeCounts: { home: 1, food: 5 } });
    renderNavBar();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('NavBar — portrait hamburger layout', () => {
  it('shows 4 visible modes and a More button', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], { nav_layout: 'hamburger' });

    renderNavBar('/', qc);

    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /more navigation options/i })).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('opens sheet with overflow modes when More is clicked', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], { nav_layout: 'hamburger' });

    renderNavBar('/', qc);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /more navigation options/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Overflow modes (5–10): Family, House, Finance, Pets, EV, Board
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Pets')).toBeInTheDocument();
    expect(screen.getByText('EV')).toBeInTheDocument();
    expect(screen.getByText('Board')).toBeInTheDocument();
  });

  it('closes sheet when an overflow mode is clicked', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], { nav_layout: 'hamburger' });

    renderNavBar('/', qc);

    fireEvent.click(screen.getByRole('button', { name: /more navigation options/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Family'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show More button when modes fit in 4 or fewer', () => {
    const qc = makeQC();
    qc.setQueryData(['app-settings'], {
      nav_layout: 'hamburger',
      enabled_nav_modes: ['home', 'calendar', 'food'],
    });

    renderNavBar('/', qc);

    expect(
      screen.queryByRole('button', { name: /more navigation options/i }),
    ).not.toBeInTheDocument();
  });
});

describe('NavBar — landscape rail', () => {
  beforeEach(() => {
    vi.mocked(useOrientation).mockReturnValue('landscape');
  });

  it('renders a nav with rail class in landscape', () => {
    renderNavBar();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toHaveClass('rail');
  });

  it('does not have navbar class in landscape', () => {
    renderNavBar();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).not.toHaveClass('navbar');
  });

  it('renders all default modes in landscape rail', () => {
    renderNavBar();
    expect(screen.getAllByRole('link')).toHaveLength(10);
  });
});

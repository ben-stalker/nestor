import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterPanel from '../../src/core/FilterPanel';
import useAppStore from '../../src/store/appStore';
import useFiltersStore from '../../src/store/filtersStore';
import { useOrientation } from '../../src/core/hooks/useOrientation';
import type { Profile } from '../../src/api/profiles';

vi.mock('../../src/core/hooks/useOrientation', () => ({
  useOrientation: vi.fn(() => 'portrait'),
}));

vi.mock('../../src/api/client', () => ({
  default: vi.fn(() => Promise.resolve([])),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../src/api/profiles', async () => {
  const { ApiError } = await import('../../src/api/client');
  return { getProfiles: vi.fn(), verifyPin: vi.fn(), ApiError };
});

const { getProfiles } = await import('../../src/api/profiles');

const ALICE: Profile = {
  id: 1,
  name: 'Alice',
  type: 'admin',
  colour: '#ff6b6b',
  avatar_path: null,
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 1000,
};

const BOB: Profile = {
  id: 2,
  name: 'Bob',
  type: 'child',
  colour: '#45b7b8',
  avatar_path: null,
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 2000,
};

function makeQC(profiles: Profile[] = [ALICE, BOB]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['profiles'], profiles);
  vi.mocked(getProfiles).mockResolvedValue(profiles);
  return qc;
}

function renderPanel(qc = makeQC()) {
  return render(
    <QueryClientProvider client={qc}>
      <FilterPanel />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppStore.setState({ activeProfileId: '1', adminPin: null });
  useFiltersStore.setState({ filtersByProfile: {}, pluginFilterDefs: [] });
  vi.mocked(useOrientation).mockReturnValue('portrait');
  vi.clearAllMocks();
});

describe('FilterPanel — rendering', () => {
  it('renders the Filters landmark', () => {
    renderPanel();
    expect(screen.getByRole('complementary', { name: 'Filters' })).toBeInTheDocument();
  });

  it('renders "All" button', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('applies portrait class in portrait orientation', () => {
    renderPanel();
    const panel = screen.getByRole('complementary', { name: 'Filters' });
    expect(panel).toHaveClass('filter-panel--portrait');
  });

  it('applies landscape class in landscape orientation', () => {
    vi.mocked(useOrientation).mockReturnValue('landscape');
    renderPanel();
    const panel = screen.getByRole('complementary', { name: 'Filters' });
    expect(panel).toHaveClass('filter-panel--landscape');
  });
});

describe('FilterPanel — All toggle', () => {
  it('"All" is active (aria-pressed=true) when no filters selected', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"All" becomes inactive when a profile filter is toggled', () => {
    renderPanel();
    // Toggle Alice (portrait: aria-label = profile name)
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking "All" resets all filters', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('FilterPanel — profile pills', () => {
  it('renders a button for each profile', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bob' })).toBeInTheDocument();
  });

  it('profile pills start inactive', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggling a profile pill sets it active', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggling an active profile pill deselects it', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('multiple profiles can be selected simultaneously', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bob' }));
    expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('landscape mode shows profile names as pill text', () => {
    vi.mocked(useOrientation).mockReturnValue('landscape');
    renderPanel();
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument();
  });
});

describe('FilterPanel — plugin filters', () => {
  it('does not render a plugin section when no plugins registered', () => {
    renderPanel();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('renders plugin filter items when registered', () => {
    useFiltersStore.setState({
      filtersByProfile: {},
      pluginFilterDefs: [
        {
          id: 'pets',
          label: 'Pets',
          items: [{ id: 'dog-1', label: 'Buddy', colour: '#8b4513' }],
        },
      ],
    });
    renderPanel();
    expect(screen.getByRole('group', { name: 'Pets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buddy' })).toBeInTheDocument();
  });

  it('does not render plugin section when plugin has no items', () => {
    useFiltersStore.setState({
      filtersByProfile: {},
      pluginFilterDefs: [{ id: 'pets', label: 'Pets', items: [] }],
    });
    renderPanel();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('toggling a plugin filter updates aria-pressed', () => {
    useFiltersStore.setState({
      filtersByProfile: {},
      pluginFilterDefs: [{ id: 'pets', label: 'Pets', items: [{ id: 'dog-1', label: 'Buddy' }] }],
    });
    renderPanel();
    const btn = screen.getByRole('button', { name: 'Buddy' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Buddy' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('FilterPanel — filter state is per active profile', () => {
  it('filter state is independent per active profile', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    // Switch to profile 2
    useAppStore.setState({ activeProfileId: '2' });
    renderPanel();
    // Profile 2 should have fresh state
    expect(useFiltersStore.getState().getProfileFilters('2').selectedProfiles).toEqual([]);
  });
});

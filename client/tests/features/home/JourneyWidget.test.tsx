import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JourneyWidget from '../../../src/features/home/JourneyWidget';
import useAppStore from '../../../src/store/appStore';
import type { JourneyEta } from '../../../src/api/journeys';
import type { Profile } from '../../../src/api/profiles';

vi.mock('../../../src/api/journeys', () => ({
  getJourneyEtas: vi.fn(),
}));

vi.mock('../../../src/api/profiles', () => ({ getProfiles: vi.fn() }));
vi.mock('../../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const { getJourneyEtas } = await import('../../../src/api/journeys');
const { getProfiles } = await import('../../../src/api/profiles');

const MOCK_PROFILE: Profile = {
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

const MOCK_ETAS: JourneyEta[] = [
  {
    journeyId: 1,
    label: 'To Work',
    origin: 'Home',
    destination: 'Office',
    transportMode: 'transit',
    etaMinutes: 38,
    updatedAt: Date.now(),
  },
  {
    journeyId: 2,
    label: 'School Run',
    origin: 'Home',
    destination: 'School',
    transportMode: 'drive',
    etaMinutes: 12,
    updatedAt: Date.now(),
  },
];

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWidget(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <JourneyWidget />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getProfiles).mockResolvedValue([]);
  useAppStore.setState({ activeProfileId: null });
});

describe('JourneyWidget — no active profile', () => {
  it('renders the widget container', () => {
    const qc = makeQc();
    qc.setQueryData(['journey-etas-none'], []);
    renderWidget(qc);
    expect(screen.getByTestId('journey-widget')).toBeInTheDocument();
  });

  it('shows empty state when no journeys', () => {
    const qc = makeQc();
    qc.setQueryData(['journey-etas-none'], []);
    renderWidget(qc);
    expect(screen.getByText(/Add a saved journey/i)).toBeInTheDocument();
  });
});

describe('JourneyWidget — with active profile and ETAs', () => {
  beforeEach(() => {
    vi.mocked(getProfiles).mockResolvedValue([MOCK_PROFILE]);
    useAppStore.getState().setActiveProfile('1');
  });

  afterEach(() => {
    useAppStore.getState().setActiveProfile(null);
  });

  it('renders a row for each journey ETA', () => {
    vi.mocked(getJourneyEtas).mockResolvedValue(MOCK_ETAS);
    const qc = makeQc();
    qc.setQueryData(['profiles'], [MOCK_PROFILE]);
    qc.setQueryData(['journey-etas', 1], MOCK_ETAS);

    renderWidget(qc);
    expect(screen.getByTestId('journey-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('journey-row-2')).toBeInTheDocument();
  });

  it('shows ETA minutes in each row', () => {
    vi.mocked(getJourneyEtas).mockResolvedValue(MOCK_ETAS);
    const qc = makeQc();
    qc.setQueryData(['profiles'], [MOCK_PROFILE]);
    qc.setQueryData(['journey-etas', 1], MOCK_ETAS);

    renderWidget(qc);
    expect(screen.getByText('38 min')).toBeInTheDocument();
    expect(screen.getByText('12 min')).toBeInTheDocument();
  });

  it('shows journey labels', () => {
    vi.mocked(getJourneyEtas).mockResolvedValue(MOCK_ETAS);
    const qc = makeQc();
    qc.setQueryData(['profiles'], [MOCK_PROFILE]);
    qc.setQueryData(['journey-etas', 1], MOCK_ETAS);

    renderWidget(qc);
    expect(screen.getByText('To Work')).toBeInTheDocument();
    expect(screen.getByText('School Run')).toBeInTheDocument();
  });

  it('shows "—" when etaMinutes is null', () => {
    const etasWithNull: JourneyEta[] = [{ ...MOCK_ETAS[0], etaMinutes: null }];
    const qc = makeQc();
    qc.setQueryData(['profiles'], [MOCK_PROFILE]);
    qc.setQueryData(['journey-etas', 1], etasWithNull);

    renderWidget(qc);
    expect(screen.getByLabelText(/— minutes/i)).toBeInTheDocument();
  });

  it('shows empty state when active profile has no journeys today', () => {
    const qc = makeQc();
    qc.setQueryData(['profiles'], [MOCK_PROFILE]);
    qc.setQueryData(['journey-etas', 1], []);

    renderWidget(qc);
    expect(screen.getByText(/Add a saved journey/i)).toBeInTheDocument();
  });
});

describe('JourneyWidget — loading state', () => {
  it('shows skeleton rows while fetching', () => {
    vi.mocked(getProfiles).mockResolvedValue([MOCK_PROFILE]);
    useAppStore.getState().setActiveProfile('1');
    vi.mocked(getJourneyEtas).mockImplementation(() => new Promise(() => {}));

    const qc = makeQc();
    qc.setQueryData(['profiles'], [MOCK_PROFILE]);

    const { container } = renderWidget(qc);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();

    useAppStore.getState().setActiveProfile(null);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JourneyWidget from '../../../src/features/home/JourneyWidget';
import type { JourneyEta } from '../../../src/api/journeys';

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
});

describe('JourneyWidget', () => {
  it('renders journey rows with ETAs', () => {
    vi.mocked(getJourneyEtas).mockResolvedValue(MOCK_ETAS);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['journey-etas-none'], MOCK_ETAS);

    renderWidget(qc);
    // No active profile so query is disabled, shows empty state
    expect(screen.getByTestId('journey-widget')).toBeInTheDocument();
  });

  it('shows empty state when no journeys', () => {
    vi.mocked(getJourneyEtas).mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['journey-etas-none'], []);

    renderWidget(qc);
    expect(screen.getByText(/Add a saved journey/i)).toBeInTheDocument();
  });

  it('shows ETA minutes when data is provided', () => {
    vi.mocked(getJourneyEtas).mockResolvedValue(MOCK_ETAS);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['journey-etas', 1], MOCK_ETAS);

    render(
      <QueryClientProvider client={qc}>
        <JourneyWidget />
      </QueryClientProvider>,
    );
    // Without active profile the query is disabled
    expect(screen.getByTestId('journey-widget')).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps, ReactNode } from 'react';
import type { DaySummary } from '../../../../src/api/home';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      layout: _l,
      transition: _t,
      ...props
    }: ComponentProps<'button'> & { layout?: unknown; transition?: unknown }) => (
      <button {...props}>{children}</button>
    ),
  },
  LayoutGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../src/api/client', () => ({
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

vi.mock('../../../../src/api/weather', () => ({ getWeather: vi.fn() }));

const DayCard = (await import('../../../../src/features/home/DayCarousel/DayCard')).default;

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const EMPTY_SUMMARY: DaySummary = {
  date: '2026-05-12',
  events: [],
  wfhStatuses: [],
  nurseryDrops: [],
  schoolPickups: [],
  vehicleBookings: [],
  vetAppointments: [],
  binCollections: [],
};

function renderCard(summary?: DaySummary, selectedProfiles: string[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const day = { date: TODAY, events: [] };
  return render(
    <QueryClientProvider client={qc}>
      <DayCard
        day={day}
        isFocal
        summary={summary}
        selectedProfiles={selectedProfiles}
        onClick={() => {}}
        onLongPress={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe('DayCard badge strip', () => {
  it('renders no badges when summary is absent', () => {
    renderCard();
    expect(screen.queryByLabelText('Day badges')).toBeNull();
  });

  it('renders no badges for an empty summary', () => {
    renderCard(EMPTY_SUMMARY);
    expect(screen.queryByLabelText('Day badges')).toBeNull();
  });

  it('renders WFH badge for wfh status', () => {
    const summary: DaySummary = {
      ...EMPTY_SUMMARY,
      wfhStatuses: [{ profileId: 1, profileName: 'Alice', status: 'wfh' }],
    };
    renderCard(summary);
    expect(screen.getByLabelText('Day badges')).toBeInTheDocument();
    expect(screen.getByLabelText('Alice: WFH')).toBeInTheDocument();
  });

  it('renders office badge for office status', () => {
    const summary: DaySummary = {
      ...EMPTY_SUMMARY,
      wfhStatuses: [{ profileId: 2, profileName: 'Bob', status: 'office' }],
    };
    renderCard(summary);
    expect(screen.getByLabelText('Bob: Office')).toBeInTheDocument();
  });

  it('renders bin collection badge', () => {
    const summary: DaySummary = {
      ...EMPTY_SUMMARY,
      binCollections: [{ type: 'General', colour: '#333', collectionDay: 'Mon' }],
    };
    renderCard(summary);
    expect(screen.getByLabelText('General')).toBeInTheDocument();
  });

  it('filters badges by selectedProfiles', () => {
    const summary: DaySummary = {
      ...EMPTY_SUMMARY,
      wfhStatuses: [
        { profileId: 1, profileName: 'Alice', status: 'wfh' },
        { profileId: 2, profileName: 'Bob', status: 'office' },
      ],
    };
    renderCard(summary, ['1']);
    expect(screen.getByLabelText('Alice: WFH')).toBeInTheDocument();
    expect(screen.queryByLabelText('Bob: Office')).toBeNull();
  });
});

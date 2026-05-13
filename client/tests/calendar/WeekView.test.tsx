import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CalendarEventRaw } from '../../src/api/calendar';
import type { Profile } from '../../src/api/profiles';

vi.mock('../../src/api/client', () => ({
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

const WeekView = (await import('../../src/calendar/WeekView')).default;

function getMonday(d: Date): Date {
  const monday = new Date(d);
  const dow = monday.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  monday.setDate(monday.getDate() + delta);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekStart(d: Date): number {
  const monday = getMonday(d);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

function weekEnd(d: Date): number {
  const monday = getMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday.getTime();
}

const TEST_DATE = new Date(2026, 4, 13); // May 13 2026 (Wednesday)

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

function makeEvent(overrides: Partial<CalendarEventRaw> & { id: number }): CalendarEventRaw {
  const base = new Date(TEST_DATE);
  base.setHours(9, 0, 0, 0);
  return {
    id: overrides.id,
    title: 'Test Event',
    start_datetime: base.getTime(),
    end_datetime: base.getTime() + 3_600_000,
    all_day: 0,
    profile_id: null,
    colour_override: null,
    notes: null,
    source: 'local',
    type: 'default',
    ...overrides,
  };
}

function renderWeek(events: CalendarEventRaw[], profiles: Profile[] = [], date = TEST_DATE) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['events', weekStart(date), weekEnd(date)], events);
  qc.setQueryData(['profiles'], profiles);
  return render(
    <QueryClientProvider client={qc}>
      <WeekView date={date} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WeekView — header', () => {
  it('renders 7 day column headers', () => {
    renderWeek([]);
    const cells = document.querySelectorAll('.week-header__cell');
    expect(cells).toHaveLength(7);
  });

  it('today column has aria-current="date"', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    renderWeek([], [], today);
    const todayCell = document.querySelector('.week-header__cell--today');
    expect(todayCell).toBeInTheDocument();
    expect(todayCell).toHaveAttribute('aria-current', 'date');
  });

  it('non-today columns do not have aria-current', () => {
    const pastDate = new Date(2020, 0, 6); // Jan 6 2020 (Monday, far past)
    renderWeek([], [], pastDate);
    const cells = document.querySelectorAll('[aria-current="date"]');
    expect(cells).toHaveLength(0);
  });
});

describe('WeekView — events', () => {
  it('renders an event button', () => {
    const event = makeEvent({ id: 1, title: 'Week Event' });
    renderWeek([event]);
    expect(screen.getByRole('button', { name: 'Week Event' })).toBeInTheDocument();
  });

  it('clicking an event opens the detail modal', () => {
    const event = makeEvent({ id: 1, title: 'Clickable' });
    renderWeek([event]);
    fireEvent.click(screen.getByRole('button', { name: 'Clickable' }));
    expect(screen.getByRole('dialog', { name: 'Clickable' })).toBeInTheDocument();
  });

  it('closing the detail modal removes it', () => {
    const event = makeEvent({ id: 1, title: 'Closeable' });
    renderWeek([event]);
    fireEvent.click(screen.getByRole('button', { name: 'Closeable' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close event' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses profile colour for events with profile_id', () => {
    const event = makeEvent({ id: 1, title: 'Alice Event', profile_id: 1 });
    renderWeek([event], [ALICE]);
    expect(screen.getByRole('button', { name: 'Alice Event' })).toHaveStyle({
      backgroundColor: '#ff6b6b',
    });
  });
});

describe('WeekView — quick-add', () => {
  it('clicking a day column directly opens quick-add sheet', () => {
    renderWeek([]);
    const columns = document.querySelectorAll('.week-column');
    fireEvent.click(columns[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toMatch(/Add event at/);
  });

  it('quick-add sheet can be closed', () => {
    renderWeek([]);
    fireEvent.click(document.querySelectorAll('.week-column')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

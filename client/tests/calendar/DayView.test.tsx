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

const DayView = (await import('../../src/calendar/DayView')).default;

const TEST_DATE = new Date(2026, 4, 13); // May 13, 2026 local time

function dayStart(d: Date): number {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s.getTime();
}

function dayEnd(d: Date): number {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e.getTime();
}

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
  const baseEnd = new Date(TEST_DATE);
  baseEnd.setHours(10, 0, 0, 0);
  return {
    id: overrides.id,
    title: 'Test Event',
    start_datetime: base.getTime(),
    end_datetime: baseEnd.getTime(),
    all_day: 0,
    profile_id: null,
    colour_override: null,
    notes: null,
    source: 'local',
    type: 'default',
    ...overrides,
  };
}

function renderWithQC(events: CalendarEventRaw[], profiles: Profile[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const start = dayStart(TEST_DATE);
  const end = dayEnd(TEST_DATE);
  qc.setQueryData(['events', start, end], events);
  qc.setQueryData(['profiles'], profiles);
  return render(
    <QueryClientProvider client={qc}>
      <DayView date={TEST_DATE} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DayView — timed events', () => {
  it('renders a timed event as an accessible button', () => {
    const event = makeEvent({ id: 1, title: 'Morning Stand-up' });
    renderWithQC([event]);
    expect(screen.getByRole('button', { name: 'Morning Stand-up' })).toBeInTheDocument();
  });

  it('renders multiple timed events', () => {
    const ev1 = makeEvent({ id: 1, title: 'Meeting A' });
    const ev2 = makeEvent({
      id: 2,
      title: 'Meeting B',
      start_datetime: ev1.start_datetime + 2 * 3_600_000,
      end_datetime: ev1.end_datetime + 2 * 3_600_000,
    });
    renderWithQC([ev1, ev2]);
    expect(screen.getByRole('button', { name: 'Meeting A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Meeting B' })).toBeInTheDocument();
  });

  it('two overlapping events both render', () => {
    const start = new Date(TEST_DATE);
    start.setHours(9, 0, 0, 0);
    const ev1 = makeEvent({
      id: 1,
      title: 'Overlap A',
      start_datetime: start.getTime(),
      end_datetime: start.getTime() + 2 * 3_600_000,
    });
    const ev2 = makeEvent({
      id: 2,
      title: 'Overlap B',
      start_datetime: start.getTime() + 3_600_000,
      end_datetime: start.getTime() + 3 * 3_600_000,
    });
    renderWithQC([ev1, ev2]);
    expect(screen.getByRole('button', { name: 'Overlap A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overlap B' })).toBeInTheDocument();
  });

  it('clicking an event opens the detail modal', () => {
    const event = makeEvent({ id: 1, title: 'Click Me', notes: 'Some notes' });
    renderWithQC([event]);
    fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
    expect(screen.getByRole('dialog', { name: 'Click Me' })).toBeInTheDocument();
    expect(screen.getByText('Some notes')).toBeInTheDocument();
  });

  it('closing the detail modal removes it', () => {
    const event = makeEvent({ id: 1, title: 'Closeable' });
    renderWithQC([event]);
    fireEvent.click(screen.getByRole('button', { name: 'Closeable' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses profile colour for events with a profile_id', () => {
    const event = makeEvent({ id: 1, title: 'Alice Event', profile_id: 1 });
    renderWithQC([event], [ALICE]);
    const btn = screen.getByRole('button', { name: 'Alice Event' });
    expect(btn).toHaveStyle({ backgroundColor: '#ff6b6b' });
  });

  it('uses colour_override when set', () => {
    const event = makeEvent({ id: 1, title: 'Custom Colour', colour_override: '#123456' });
    renderWithQC([event]);
    const btn = screen.getByRole('button', { name: 'Custom Colour' });
    expect(btn).toHaveStyle({ backgroundColor: '#123456' });
  });
});

describe('DayView — all-day events', () => {
  it('renders all-day event in the all-day strip', () => {
    const event = makeEvent({ id: 1, title: 'Bank Holiday', all_day: 1 });
    renderWithQC([event]);
    const strip = screen.getByLabelText('All-day events');
    expect(strip).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bank Holiday' })).toBeInTheDocument();
  });

  it('does not render all-day strip when no all-day events', () => {
    const event = makeEvent({ id: 1, title: 'Timed Event' });
    renderWithQC([event]);
    expect(screen.queryByLabelText('All-day events')).not.toBeInTheDocument();
  });
});

describe('DayView — slot click quick-add', () => {
  it('clicking the event grid directly opens quick-add modal', () => {
    renderWithQC([]);
    const grid = screen.getByTestId('event-grid');
    fireEvent.click(grid);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('New event');
  });

  it('quick-add sheet can be closed', () => {
    renderWithQC([]);
    fireEvent.click(screen.getByTestId('event-grid'));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

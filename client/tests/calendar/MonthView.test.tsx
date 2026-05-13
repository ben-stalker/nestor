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

const MonthView = (await import('../../src/calendar/MonthView')).default;

const MAY_2026 = new Date(2026, 4, 13); // May 13, 2026

function buildRange(initialDate: Date) {
  // Replicate MonthView's grid range calculation (Mon-first)
  const year = initialDate.getFullYear();
  const month = initialDate.getMonth();
  const first = new Date(year, month, 1);
  let offset = first.getDay() - 1;
  if (offset < 0) offset += 7;
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - offset);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41);
  gridEnd.setHours(23, 59, 59, 999);
  return { start: gridStart.getTime(), end: gridEnd.getTime() };
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
  // Place events on May 13, 2026 by default
  const base = new Date(2026, 4, 13, 9, 0, 0, 0);
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
    recurring_rule: null,
    ...overrides,
  };
}

function renderMonth(
  events: CalendarEventRaw[],
  profiles: Profile[] = [],
  initialDate = MAY_2026,
  onDayClick = vi.fn(),
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { start, end } = buildRange(initialDate);
  qc.setQueryData(['events', start, end], events);
  qc.setQueryData(['profiles'], profiles);
  return render(
    <QueryClientProvider client={qc}>
      <MonthView initialDate={initialDate} onDayClick={onDayClick} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MonthView — grid structure', () => {
  it('renders 42 grid cells', () => {
    renderMonth([]);
    const cells = document.querySelectorAll('.month-cell');
    expect(cells).toHaveLength(42);
  });

  it('renders 7 weekday header labels', () => {
    renderMonth([]);
    const headers = document.querySelectorAll('.month-view__weekday');
    expect(headers).toHaveLength(7);
  });

  it('today cell has aria-current="date"', () => {
    const today = new Date();
    // Build a month containing today
    renderMonth([], [], today);
    const todayCell = document.querySelector('[aria-current="date"]');
    expect(todayCell).toBeInTheDocument();
  });

  it('cells outside current month have reduced opacity class', () => {
    renderMonth([]);
    const outsideCells = document.querySelectorAll('.month-cell--outside');
    expect(outsideCells.length).toBeGreaterThan(0);
  });
});

describe('MonthView — event dots', () => {
  it('renders a dot for an event on a day', () => {
    const event = makeEvent({ id: 1 });
    renderMonth([event]);
    const dots = document.querySelectorAll('.month-cell__dot');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('caps dots at 3 and shows +N overflow', () => {
    const base = new Date(2026, 4, 13, 9, 0, 0, 0);
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: i + 1,
        title: `Event ${i + 1}`,
        start_datetime: base.getTime() + i * 3_600_000,
        end_datetime: base.getTime() + (i + 1) * 3_600_000,
      }),
    );
    renderMonth(events);
    const dots = document.querySelectorAll('.month-cell__dot');
    expect(dots).toHaveLength(3);
    const overflow = document.querySelector('.month-cell__overflow');
    expect(overflow).toBeInTheDocument();
    expect(overflow?.textContent).toBe('+2');
  });

  it('uses profile colour for event dot when profile_id set', () => {
    const event = makeEvent({ id: 1, profile_id: 1 });
    renderMonth([event], [ALICE]);
    const dot = document.querySelector('.month-cell__dot') as HTMLElement;
    expect(dot).toHaveStyle({ backgroundColor: '#ff6b6b' });
  });
});

describe('MonthView — navigation', () => {
  it('clicking a day cell calls onDayClick', () => {
    const onDayClick = vi.fn();
    renderMonth([], [], MAY_2026, onDayClick);
    const cells = document.querySelectorAll('.month-cell');
    fireEvent.click(cells[10]);
    expect(onDayClick).toHaveBeenCalledTimes(1);
    expect(onDayClick).toHaveBeenCalledWith(expect.any(Date));
  });

  it('clicking Previous month changes the title', () => {
    renderMonth([]);
    const title = document.querySelector('.month-view__title');
    expect(title?.textContent).toContain('2026');
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    const newTitle = document.querySelector('.month-view__title');
    // After going back from May 2026, title should show April 2026
    expect(newTitle?.textContent).toMatch(/April.*2026/i);
  });

  it('clicking Next month changes the title', () => {
    renderMonth([]);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    const title = document.querySelector('.month-view__title');
    expect(title?.textContent).toMatch(/June.*2026/i);
  });
});

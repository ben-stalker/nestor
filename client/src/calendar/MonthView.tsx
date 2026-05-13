import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getEvents, type CalendarEventRaw } from '../api/calendar';
import { useProfiles } from '../core/hooks/useProfiles';
import MonthCell from './MonthCell';

const FALLBACK_COLOUR = '#4a90d9';
// Mon-first matches most locales; future: read from app_settings.first_day_of_week
const FIRST_DAY_OF_WEEK: 0 | 1 = 1;
const DAY_NAMES: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildMonthGrid(year: number, month: number, firstDay: 0 | 1): Date[] {
  const first = new Date(year, month, 1);
  let offset = first.getDay() - firstDay;
  if (offset < 0) offset += 7;

  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - offset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function cellKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface MonthViewProps {
  initialDate: Date;
  onDayClick: (date: Date) => void;
}

export default function MonthView({ initialDate, onDayClick }: MonthViewProps) {
  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());

  const grid = buildMonthGrid(viewYear, viewMonth, FIRST_DAY_OF_WEEK);
  const rangeStart = grid[0].getTime();
  const rangeEnd = new Date(grid[41]).setHours(23, 59, 59, 999);

  const { data: events = [] } = useQuery<CalendarEventRaw[]>({
    queryKey: ['events', rangeStart, rangeEnd],
    queryFn: () => getEvents(rangeStart, rangeEnd),
    staleTime: 5 * 60_000,
  });

  const { data: profiles = [] } = useProfiles();
  const profileColors = new Map<number, string>(profiles.map((p) => [p.id, p.colour]));

  const eventsByDay = events.reduce((map, ev) => {
    const d = new Date(ev.start_datetime);
    const key = cellKey(d);
    map.set(key, [...(map.get(key) ?? []), ev]);
    return map;
  }, new Map<string, CalendarEventRaw[]>());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const monthLabel = new Intl.DateTimeFormat(navigator.language, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(viewYear, viewMonth, 1));

  return (
    <div className="month-view" data-testid="month-view">
      <div className="month-view__nav">
        <button
          type="button"
          className="calendar-page__nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="month-view__title">{monthLabel}</h2>
        <button
          type="button"
          className="calendar-page__nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="month-view__weekdays" aria-hidden="true">
        {DAY_NAMES.map((name) => (
          <span key={name} className="month-view__weekday">
            {name}
          </span>
        ))}
      </div>

      <div className="month-view__grid" role="grid" aria-label={monthLabel}>
        {grid.map((cellDate) => (
          <MonthCell
            key={cellDate.toISOString()}
            date={cellDate}
            isCurrentMonth={cellDate.getMonth() === viewMonth}
            isToday={cellDate.toDateString() === today.toDateString()}
            events={eventsByDay.get(cellKey(cellDate)) ?? []}
            profileColors={profileColors}
            fallbackColour={FALLBACK_COLOUR}
            onClick={() => onDayClick(cellDate)}
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

type ViewMode = 'day' | 'week' | 'month';

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(() => startOfDay(new Date()));
  const [view, setView] = useState<ViewMode>('day');

  function prevDay() {
    setDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - (view === 'week' ? 7 : 1));
      return next;
    });
  }

  function nextDay() {
    setDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + (view === 'week' ? 7 : 1));
      return next;
    });
  }

  function handleMonthDayClick(d: Date) {
    setDate(d);
    setView('day');
  }

  function goToday() {
    setDate(startOfDay(new Date()));
  }

  const headerDate = new Intl.DateTimeFormat(navigator.language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  const isToday = date.toDateString() === startOfDay(new Date()).toDateString();

  return (
    <main className="calendar-page">
      {view !== 'month' && (
        <div className="calendar-page__header">
          <button
            type="button"
            className="calendar-page__nav-btn"
            onClick={prevDay}
            aria-label={view === 'week' ? 'Previous week' : 'Previous day'}
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="calendar-page__date-wrap">
            <h1 className="calendar-page__date">{headerDate}</h1>
            {!isToday && (
              <button
                type="button"
                className="calendar-page__today-btn"
                onClick={goToday}
                aria-label="Go to today"
              >
                Today
              </button>
            )}
          </div>
          <button
            type="button"
            className="calendar-page__nav-btn"
            onClick={nextDay}
            aria-label={view === 'week' ? 'Next week' : 'Next day'}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      <div className="calendar-page__view-tabs" role="tablist" aria-label="Calendar view">
        <button
          type="button"
          role="tab"
          className={`calendar-page__view-tab${view === 'day' ? ' calendar-page__view-tab--active' : ''}`}
          aria-selected={view === 'day'}
          onClick={() => setView('day')}
        >
          Day
        </button>
        <button
          type="button"
          role="tab"
          className={`calendar-page__view-tab${view === 'week' ? ' calendar-page__view-tab--active' : ''}`}
          aria-selected={view === 'week'}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button
          type="button"
          role="tab"
          className={`calendar-page__view-tab${view === 'month' ? ' calendar-page__view-tab--active' : ''}`}
          aria-selected={view === 'month'}
          onClick={() => setView('month')}
        >
          Month
        </button>
      </div>

      {view === 'day' && <DayView date={date} />}
      {view === 'week' && <WeekView date={date} />}
      {view === 'month' && <MonthView initialDate={date} onDayClick={handleMonthDayClick} />}
    </main>
  );
}

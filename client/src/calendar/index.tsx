import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DayView from './DayView';

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(() => startOfDay(new Date()));

  function prevDay() {
    setDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function nextDay() {
    setDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
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
      <div className="calendar-page__header">
        <button
          type="button"
          className="calendar-page__nav-btn"
          onClick={prevDay}
          aria-label="Previous day"
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
          aria-label="Next day"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <DayView date={date} />
    </main>
  );
}

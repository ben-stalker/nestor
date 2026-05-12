import { useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useWeather } from '../../../hooks/useWeather';
import { useDaySummary } from '../../../hooks/useDaySummary';
import useFiltersStore from '../../../store/filtersStore';
import useAppStore from '../../../store/appStore';
import type { DayData } from './types';
import DayCard from './DayCard';
import DayViewModal from './DayViewModal';
import QuickAddModal from './QuickAddModal';

function buildDays(start: Date, end: Date): DayData[] {
  const days: DayData[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endMs = new Date(end).setHours(23, 59, 59, 999);
  while (cur.getTime() <= endMs) {
    days.push({ date: new Date(cur), events: [] });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

interface DayCarouselProps {
  start: Date;
  end: Date;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DayCarousel({ start, end }: DayCarouselProps) {
  const { data: weather } = useWeather();
  const today = todayDate();
  const [focalDate, setFocalDate] = useState<Date>(today);
  const [dayViewDay, setDayViewDay] = useState<DayData | null>(null);
  const [quickAddDay, setQuickAddDay] = useState<DayData | null>(null);

  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const getProfileFilters = useFiltersStore((s) => s.getProfileFilters);
  const filters = activeProfileId ? getProfileFilters(activeProfileId) : null;
  const selectedProfiles = filters?.selectedProfiles ?? [];

  const focalDateStr = localDateStr(focalDate);
  const { data: focalSummary } = useDaySummary(focalDateStr);

  const days = buildDays(start, end).map((day, idx) => {
    const weatherDay = weather?.daily;
    if (weatherDay && idx < weatherDay.time.length) {
      return {
        ...day,
        weatherCode: weatherDay.weather_code[idx],
        tempMax: weatherDay.temperature_2m_max[idx],
        tempMin: weatherDay.temperature_2m_min[idx],
        precipPct: weatherDay.precipitation_probability_max[idx],
      };
    }
    return day;
  });

  const isOnToday = isSameDay(focalDate, today);

  function handleCardClick(day: DayData) {
    if (isSameDay(day.date, focalDate)) {
      setDayViewDay(day);
    } else {
      setFocalDate(day.date);
    }
  }

  function handleBackToToday() {
    setFocalDate(today);
  }

  return (
    <section className="day-carousel" aria-label="Day carousel" data-testid="day-carousel">
      <LayoutGroup>
        <div className="day-carousel__track" role="list">
          {days.map((day) => {
            const focal = isSameDay(day.date, focalDate);
            return (
              <div
                key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
                className="day-carousel__item"
                role="listitem"
                style={{ flex: focal ? '0 0 50%' : '0 0 12%' }}
              >
                <DayCard
                  day={day}
                  isFocal={focal}
                  summary={focal ? focalSummary : undefined}
                  selectedProfiles={selectedProfiles}
                  onClick={() => handleCardClick(day)}
                  onLongPress={() => setQuickAddDay(day)}
                />
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      {!isOnToday && (
        <button
          className="day-carousel__back-to-today"
          onClick={handleBackToToday}
          aria-label="Back to today"
          data-testid="back-to-today"
        >
          <RotateCcw className="size-3.5" />
          <span>Back to Today</span>
        </button>
      )}

      {createPortal(
        <>
          <DayViewModal day={dayViewDay} onClose={() => setDayViewDay(null)} />
          <QuickAddModal day={quickAddDay} onClose={() => setQuickAddDay(null)} />
        </>,
        document.body,
      )}
    </section>
  );
}

import { useState, useRef } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useQueries } from '@tanstack/react-query';
import { useWeather } from '../../../hooks/useWeather';
import { daySummaryKey } from '../../../hooks/useDaySummary';
import { getDaySummary } from '../../../api/home';
import useFiltersStore from '../../../store/filtersStore';
import useAppStore from '../../../store/appStore';
import useReducedMotion from '../../../hooks/useReducedMotion';
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
  const reducedMotion = useReducedMotion();
  const today = todayDate();
  const [focalDate, setFocalDate] = useState<Date>(today);
  const [dayViewDay, setDayViewDay] = useState<DayData | null>(null);
  const [quickAddDay, setQuickAddDay] = useState<DayData | null>(null);
  // Swipe tracking
  const swipeStartX = useRef<number | null>(null);

  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const getProfileFilters = useFiltersStore((s) => s.getProfileFilters);
  const filters = activeProfileId ? getProfileFilters(activeProfileId) : null;
  const selectedProfiles = filters?.selectedProfiles ?? [];

  const allDates = buildDays(start, end).map((d) => localDateStr(d.date));
  const summaryResults = useQueries({
    queries: allDates.map((dateStr) => ({
      queryKey: daySummaryKey(dateStr),
      queryFn: () => getDaySummary(dateStr),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const summaryByDate = Object.fromEntries(
    allDates.map((dateStr, i) => [dateStr, summaryResults[i].data]),
  );

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

  // Swipe handlers — advance/retreat the focal day
  function handlePointerDown(e: React.PointerEvent<HTMLElement>) {
    swipeStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent<HTMLElement>) {
    if (swipeStartX.current === null) return;
    const delta = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    const THRESHOLD = 60;
    if (Math.abs(delta) < THRESHOLD) return;

    const allDays = buildDays(start, end);
    const focalIdx = allDays.findIndex((d) => isSameDay(d.date, focalDate));
    if (delta < 0 && focalIdx < allDays.length - 1) {
      setFocalDate(allDays[focalIdx + 1].date);
    } else if (delta > 0 && focalIdx > 0) {
      setFocalDate(allDays[focalIdx - 1].date);
    }
  }

  const backToTodayVariants = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: {
          opacity: 1,
          scale: [1, 1.06, 1],
          transition: { duration: 0.4, times: [0, 0.5, 1] },
        },
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
      };

  return (
    <section
      className="day-carousel"
      aria-label="Day carousel"
      data-testid="day-carousel"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <LayoutGroup>
        <div className="day-carousel__track" role="list">
          {days.map((day) => {
            const focal = isSameDay(day.date, focalDate);
            return (
              <motion.div
                key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
                className="day-carousel__item"
                role="listitem"
                layout={!reducedMotion}
                transition={
                  reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }
                }
                style={{ flex: focal ? '0 0 50%' : '0 0 12%' }}
              >
                <DayCard
                  day={day}
                  isFocal={focal}
                  summary={summaryByDate[localDateStr(day.date)]}
                  selectedProfiles={selectedProfiles}
                  onClick={() => handleCardClick(day)}
                  onLongPress={() => setQuickAddDay(day)}
                />
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>

      <AnimatePresence>
        {!isOnToday && (
          <motion.button
            className="day-carousel__back-to-today"
            onClick={handleBackToToday}
            aria-label="Back to today"
            data-testid="back-to-today"
            variants={backToTodayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <RotateCcw className="size-3.5" />
            <span>Back to Today</span>
          </motion.button>
        )}
      </AnimatePresence>

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

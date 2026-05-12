import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, Droplets } from 'lucide-react';
import clsx from 'clsx';
import type { DayData } from './types';
import useReducedMotion from '../../../hooks/useReducedMotion';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function MiniWeatherIcon({ code, className }: { code: number; className?: string }) {
  const cls = clsx('shrink-0', className);
  if (code === 0) return <Sun className={cls} />;
  if (code <= 3) return <Cloud className={cls} />;
  if (code <= 67) return <CloudRain className={cls} />;
  if (code <= 77) return <CloudSnow className={cls} />;
  if (code <= 82) return <Droplets className={cls} />;
  return <Cloud className={cls} />;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

interface DayCardProps {
  day: DayData;
  isFocal: boolean;
  onClick: () => void;
  onLongPress: () => void;
}

const LONG_PRESS_MS = 500;

export default function DayCard({ day, isFocal, onClick, onLongPress }: DayCardProps) {
  const reducedMotion = useReducedMotion();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = isToday(day.date);

  function handlePointerDown() {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handlePointerLeave() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const dateLabel = `${DAY_NAMES[day.date.getDay()]} ${day.date.getDate()} ${MONTH_NAMES[day.date.getMonth()]}`;

  return (
    <motion.button
      layout={!reducedMotion}
      data-testid={`day-card-${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`}
      aria-label={dateLabel}
      aria-pressed={isFocal ? 'true' : 'false'}
      className={clsx('day-card', isFocal && 'day-card--focal', today && 'day-card--today')}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="day-card__date">
        <span className="day-card__day-name">{DAY_NAMES[day.date.getDay()]}</span>
        <span className="day-card__day-num">{day.date.getDate()}</span>
        {isFocal && <span className="day-card__month">{MONTH_NAMES[day.date.getMonth()]}</span>}
      </div>

      {day.weatherCode !== undefined && (
        <div className="day-card__weather">
          <MiniWeatherIcon code={day.weatherCode} className="size-4" />
          {isFocal && day.tempMax !== undefined && (
            <span className="day-card__weather-range">
              {Math.round(day.tempMax)}°/{Math.round(day.tempMin ?? 0)}°
            </span>
          )}
          {!isFocal && day.tempMax !== undefined && (
            <span className="day-card__weather-temp">{Math.round(day.tempMax)}°</span>
          )}
        </div>
      )}

      {isFocal && (
        <ul className="day-card__events" aria-label="Events">
          {day.events.length === 0 ? (
            <li className="day-card__no-events">No events</li>
          ) : (
            day.events.map((ev) => (
              <li
                key={ev.id}
                className="day-card__event"
                style={{ borderLeftColor: ev.profileColour }}
              >
                <span className="day-card__event-time">{ev.startTime}</span>
                <span className="day-card__event-title">{ev.title}</span>
              </li>
            ))
          )}
        </ul>
      )}

      {!isFocal && day.events.length > 0 && (
        <div className="day-card__event-dots" aria-hidden="true">
          {day.events.slice(0, 4).map((ev) => (
            <span
              key={ev.id}
              className="day-card__event-dot"
              style={{ backgroundColor: ev.profileColour }}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}

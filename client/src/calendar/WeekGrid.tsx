import { type CalendarEventRaw } from '../api/calendar';
import { layoutOverlaps } from './layoutOverlaps';
import EventBlock from './EventBlock';
import { PX_PER_HOUR, DAY_START_HOUR, DAY_END_HOUR } from './HourGutter';

const PX_PER_MIN = PX_PER_HOUR / 60;
const TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;

function eventTopPx(event: CalendarEventRaw, dayDate: Date): number {
  const dayStart = new Date(dayDate);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const clampedStart = Math.max(event.start_datetime, dayStart.getTime());
  const minutesFromStart = (clampedStart - dayStart.getTime()) / 60_000;
  return Math.max(0, minutesFromStart * PX_PER_MIN);
}

function eventHeightPx(event: CalendarEventRaw, dayDate: Date): number {
  const dayStart = new Date(dayDate);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);
  const visibleStart = Math.max(event.start_datetime, dayStart.getTime());
  const visibleEnd = Math.min(event.end_datetime, dayEnd.getTime());
  return Math.max(20, ((visibleEnd - visibleStart) / 3_600_000) * PX_PER_HOUR);
}

interface WeekColumnProps {
  day: Date;
  events: CalendarEventRaw[];
  profileColors: Map<number, string>;
  fallbackColour: string;
  isToday: boolean;
  onEventClick: (event: CalendarEventRaw) => void;
  onSlotClick: (time: Date) => void;
}

function getColour(
  event: CalendarEventRaw,
  profileColors: Map<number, string>,
  fallbackColour: string,
): string {
  if (event.colour_override) return event.colour_override;
  if (event.profile_id !== null) return profileColors.get(event.profile_id) ?? fallbackColour;
  return fallbackColour;
}

function WeekColumn({
  day,
  events,
  profileColors,
  fallbackColour,
  isToday,
  onEventClick,
  onSlotClick,
}: WeekColumnProps) {
  const timedEvents = events.filter((e) => e.all_day === 0);
  const laid = layoutOverlaps(timedEvents);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const dayStart = new Date(day);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const minutesFromStart = (y / PX_PER_HOUR) * 60;
    const flooredMinutes = Math.floor(minutesFromStart / 30) * 30;
    const clickedTime = new Date(dayStart.getTime() + flooredMinutes * 60_000);
    onSlotClick(clickedTime);
  }

  return (
    <div
      className={`week-column${isToday ? ' week-column--today' : ''}`}
      style={{ height: TIMELINE_HEIGHT }}
      onClick={handleClick}
      role="presentation"
    >
      {laid.map(({ event, column, totalColumns }) => (
        <EventBlock
          key={event.id}
          event={event}
          colour={getColour(event, profileColors, fallbackColour)}
          top={eventTopPx(event, day)}
          height={eventHeightPx(event, day)}
          column={column}
          totalColumns={totalColumns}
          onClick={() => onEventClick(event)}
        />
      ))}
    </div>
  );
}

interface WeekGridProps {
  weekDays: Date[];
  eventsByDay: Map<string, CalendarEventRaw[]>;
  profileColors: Map<number, string>;
  fallbackColour: string;
  todayMs: number;
  onEventClick: (event: CalendarEventRaw) => void;
  onSlotClick: (time: Date) => void;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export { dayKey };

export default function WeekGrid({
  weekDays,
  eventsByDay,
  profileColors,
  fallbackColour,
  todayMs,
  onEventClick,
  onSlotClick,
}: WeekGridProps) {
  const today = new Date(todayMs);

  return (
    <div className="week-grid">
      {weekDays.map((day) => {
        const isToday =
          day.getFullYear() === today.getFullYear() &&
          day.getMonth() === today.getMonth() &&
          day.getDate() === today.getDate();
        const events = eventsByDay.get(dayKey(day)) ?? [];
        return (
          <WeekColumn
            key={day.toISOString()}
            day={day}
            events={events}
            profileColors={profileColors}
            fallbackColour={fallbackColour}
            isToday={isToday}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
          />
        );
      })}
    </div>
  );
}

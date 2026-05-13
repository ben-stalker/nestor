import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getEvents, type CalendarEventRaw } from '../api/calendar';
import { useProfiles } from '../core/hooks/useProfiles';
import { layoutOverlaps } from './layoutOverlaps';
import EventBlock from './EventBlock';
import HourGutter, { PX_PER_HOUR, DAY_START_HOUR, DAY_END_HOUR } from './HourGutter';

const FALLBACK_COLOUR = '#4a90d9';
const PX_PER_MIN = PX_PER_HOUR / 60;
const TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;

function dayBounds(date: Date): { start: number; end: number } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function eventTopPx(event: CalendarEventRaw, date: Date): number {
  const dayStart = new Date(date);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const clampedStart = Math.max(event.start_datetime, dayStart.getTime());
  const minutesFromStart = (clampedStart - dayStart.getTime()) / 60_000;
  return Math.max(0, minutesFromStart * PX_PER_MIN);
}

function eventHeightPx(event: CalendarEventRaw, date: Date): number {
  const dayStart = new Date(date);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);
  const visibleStart = Math.max(event.start_datetime, dayStart.getTime());
  const visibleEnd = Math.min(event.end_datetime, dayEnd.getTime());
  return Math.max(20, ((visibleEnd - visibleStart) / 3_600_000) * PX_PER_HOUR);
}

interface EventDetailModalProps {
  event: CalendarEventRaw;
  onClose: () => void;
}

function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div role="dialog" aria-modal="true" aria-label={event.title} className="event-detail-modal">
        <div className="event-detail-modal__header">
          <h2 className="event-detail-modal__title">{event.title}</h2>
          <button
            type="button"
            className="event-detail-modal__close"
            onClick={onClose}
            aria-label="Close event"
          >
            <X className="size-5" />
          </button>
        </div>
        {event.notes && <p className="event-detail-modal__notes">{event.notes}</p>}
      </div>
    </>
  );
}

interface QuickAddSheetProps {
  start: Date;
  onClose: () => void;
}

function QuickAddSheet({ start, onClose }: QuickAddSheetProps) {
  const timeStr = new Intl.DateTimeFormat(navigator.language, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(start);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add event at ${timeStr}`}
        className="quick-add-sheet"
      >
        <p className="quick-add-sheet__label">Add event at {timeStr}</p>
        <p className="quick-add-sheet__placeholder">Event creation coming soon.</p>
        <button type="button" className="quick-add-sheet__close" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}

interface DayViewProps {
  date: Date;
}

export default function DayView({ date }: DayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventRaw | null>(null);
  const [quickAddStart, setQuickAddStart] = useState<Date | null>(null);

  const { start, end } = dayBounds(date);
  const { data: events = [] } = useQuery<CalendarEventRaw[]>({
    queryKey: ['events', start, end],
    queryFn: () => getEvents(start, end),
    staleTime: 2 * 60_000,
  });

  const { data: profiles = [] } = useProfiles();
  const profileColors = new Map<number, string>(profiles.map((p) => [p.id, p.colour]));

  const allDayEvents = events.filter((e) => e.all_day !== 0);
  const timedEvents = events.filter((e) => e.all_day === 0);
  const laid = layoutOverlaps(timedEvents);

  function getColour(event: CalendarEventRaw): string {
    if (event.colour_override) return event.colour_override;
    if (event.profile_id !== null) return profileColors.get(event.profile_id) ?? FALLBACK_COLOUR;
    return FALLBACK_COLOUR;
  }

  function handleGridClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const dayStart = new Date(date);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const minutesFromStart = (y / PX_PER_HOUR) * 60;
    const flooredMinutes = Math.floor(minutesFromStart / 30) * 30;
    const clickedTime = new Date(dayStart.getTime() + flooredMinutes * 60_000);
    setQuickAddStart(clickedTime);
  }

  return (
    <div className="day-view">
      {allDayEvents.length > 0 && (
        <div className="day-view__allday" aria-label="All-day events">
          {allDayEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              className="allday-event"
              style={{ backgroundColor: getColour(ev) }}
              onClick={() => setSelectedEvent(ev)}
              aria-label={ev.title}
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      <div className="day-view__timeline">
        <HourGutter />
        <div
          className="event-grid"
          style={{ height: TIMELINE_HEIGHT }}
          onClick={handleGridClick}
          role="presentation"
          data-testid="event-grid"
        >
          {laid.map(({ event, column, totalColumns }) => (
            <EventBlock
              key={event.id}
              event={event}
              colour={getColour(event)}
              top={eventTopPx(event, date)}
              height={eventHeightPx(event, date)}
              column={column}
              totalColumns={totalColumns}
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>

      {selectedEvent !== null && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {quickAddStart !== null && (
        <QuickAddSheet start={quickAddStart} onClose={() => setQuickAddStart(null)} />
      )}
    </div>
  );
}

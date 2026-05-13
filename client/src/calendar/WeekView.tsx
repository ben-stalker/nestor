import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getEvents, type CalendarEventRaw } from '../api/calendar';
import { useProfiles } from '../core/hooks/useProfiles';
import WeekHeader from './WeekHeader';
import WeekGrid, { dayKey } from './WeekGrid';

const FALLBACK_COLOUR = '#4a90d9';

function getWeekDays(anchorDate: Date): Date[] {
  const monday = new Date(anchorDate);
  const dow = monday.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  monday.setDate(monday.getDate() + delta);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function weekBounds(weekDays: Date[]): { start: number; end: number } {
  const start = new Date(weekDays[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date(weekDays[6]);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
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
    weekday: 'short',
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

interface WeekViewProps {
  date: Date;
}

export default function WeekView({ date }: WeekViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventRaw | null>(null);
  const [quickAddStart, setQuickAddStart] = useState<Date | null>(null);

  const weekDays = getWeekDays(date);
  const { start, end } = weekBounds(weekDays);

  const { data: events = [] } = useQuery<CalendarEventRaw[]>({
    queryKey: ['events', start, end],
    queryFn: () => getEvents(start, end),
    staleTime: 2 * 60_000,
  });

  const { data: profiles = [] } = useProfiles();
  const profileColors = new Map<number, string>(profiles.map((p) => [p.id, p.colour]));

  const eventsByDay = events.reduce((map, event) => {
    const d = new Date(event.start_datetime);
    const k = dayKey(d);
    const existing = map.get(k) ?? [];
    map.set(k, [...existing, event]);
    return map;
  }, new Map<string, CalendarEventRaw[]>());

  return (
    <div className="week-view" data-testid="week-view">
      <WeekHeader weekDays={weekDays} todayMs={Date.now()} />
      <div className="week-view__body">
        <WeekGrid
          weekDays={weekDays}
          eventsByDay={eventsByDay}
          profileColors={profileColors}
          fallbackColour={FALLBACK_COLOUR}
          todayMs={Date.now()}
          onEventClick={setSelectedEvent}
          onSlotClick={setQuickAddStart}
        />
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

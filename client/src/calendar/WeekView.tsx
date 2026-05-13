import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvents, type CalendarEventRaw } from '../api/calendar';
import { useProfiles } from '../core/hooks/useProfiles';
import WeekHeader from './WeekHeader';
import WeekGrid, { dayKey } from './WeekGrid';
import EventModal from './EventModal';

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
        <EventModal mode="view" event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {quickAddStart !== null && (
        <EventModal
          mode="create"
          defaultDate={quickAddStart}
          onClose={() => setQuickAddStart(null)}
        />
      )}
    </div>
  );
}

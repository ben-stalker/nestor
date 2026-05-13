import apiFetch from '../api/client';
import type { CalendarEventRaw } from '../api/calendar';

export interface EventCreateInput {
  title: string;
  start_datetime: number;
  end_datetime: number;
  all_day?: boolean;
  profile_id?: number | null;
  type?: string;
  recurring_rule?: string | null;
  colour_override?: string | null;
  notes?: string | null;
}

export type EventUpdateInput = Partial<EventCreateInput>;

export async function createEvent(input: EventCreateInput): Promise<CalendarEventRaw> {
  return apiFetch<CalendarEventRaw>('/api/v1/calendar/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateEvent(id: number, input: EventUpdateInput): Promise<CalendarEventRaw> {
  return apiFetch<CalendarEventRaw>(`/api/v1/calendar/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteEvent(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/calendar/events/${id}`, { method: 'DELETE' });
}

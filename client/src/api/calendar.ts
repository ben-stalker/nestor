import apiFetch from './client';

export interface CalendarEventRaw {
  id: number;
  title: string;
  start_datetime: number;
  end_datetime: number;
  all_day: number;
  profile_id: number | null;
  colour_override: string | null;
  notes: string | null;
  source: string;
  type: string;
}

export async function getEvents(
  start: number,
  end: number,
  profileIds?: number[],
): Promise<CalendarEventRaw[]> {
  const params = new URLSearchParams({ start: String(start), end: String(end) });
  if (profileIds && profileIds.length > 0) {
    params.set('profileIds', profileIds.join(','));
  }
  return apiFetch<CalendarEventRaw[]>(`/api/v1/calendar/events?${params.toString()}`);
}

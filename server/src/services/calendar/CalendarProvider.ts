import type { CalendarAccount, CalendarEvent } from '../../types/calendar';

export interface RawEvent {
  caldav_uid: string;
  caldav_etag?: string;
  title: string;
  start_datetime: number;
  end_datetime: number;
  all_day?: boolean;
  recurring_rule?: string;
  notes?: string;
}

export interface CalendarProvider {
  pull(account: CalendarAccount): Promise<RawEvent[]>;
  push(account: CalendarAccount, event: CalendarEvent): Promise<void>;
  testCredentials(account: CalendarAccount): Promise<boolean>;
}

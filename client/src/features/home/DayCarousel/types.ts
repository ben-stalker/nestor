export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  profileColour: string;
  profileId: string;
}

export interface DayData {
  date: Date;
  events: CalendarEvent[];
  weatherCode?: number;
  tempMax?: number;
  tempMin?: number;
  precipPct?: number;
}

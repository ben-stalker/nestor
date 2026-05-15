import { useQuery } from '@tanstack/react-query';
import apiFetch from '../api/client';

interface CalendarEvent {
  id: number;
  title: string;
  start_datetime: number;
  all_day: boolean;
}

interface Props {
  profileId: number;
  name: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function MyDayCard({ profileId, name }: Props) {
  const now = Date.now();
  const todayEnd = now - (now % 86_400_000) + 86_400_000;

  const { data: events = [] } = useQuery({
    queryKey: ['calendar', 'today', profileId],
    queryFn: () =>
      apiFetch<CalendarEvent[]>(
        `/api/v1/calendar/events?from=${now - (now % 86_400_000)}&to=${todayEnd}&profileId=${profileId}`,
      ),
    staleTime: 60_000,
  });

  return (
    <div className="my-day-card">
      <h2 className="my-day-card__greeting">
        {greeting()}, {name}!
      </h2>
      <p className="my-day-card__date">
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {events.length > 0 ? (
        <ul className="my-day-card__events">
          {events.map((ev) => (
            <li key={ev.id} className="my-day-card__event">
              {!ev.all_day && (
                <span className="my-day-card__event-time">
                  {new Date(ev.start_datetime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              <span className="my-day-card__event-title">{ev.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="my-day-card__no-events">Nothing on today — enjoy!</p>
      )}
    </div>
  );
}

import type { CalendarEventRaw } from '../api/calendar';

const MAX_DOTS = 3;

interface MonthCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEventRaw[];
  profileColors: Map<number, string>;
  fallbackColour: string;
  onClick: () => void;
}

function dotColour(
  event: CalendarEventRaw,
  profileColors: Map<number, string>,
  fallback: string,
): string {
  if (event.colour_override) return event.colour_override;
  if (event.profile_id !== null) return profileColors.get(event.profile_id) ?? fallback;
  return fallback;
}

export default function MonthCell({
  date,
  isCurrentMonth,
  isToday,
  events,
  profileColors,
  fallbackColour,
  onClick,
}: MonthCellProps) {
  const overflow = events.length > MAX_DOTS ? events.length - MAX_DOTS : 0;
  const dots = events.slice(0, MAX_DOTS);

  const classes = [
    'month-cell',
    !isCurrentMonth && 'month-cell--outside',
    isToday && 'month-cell--today',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-current={isToday ? 'date' : undefined}
      aria-label={date.toDateString()}
      role="gridcell"
    >
      <span className="month-cell__date">{date.getDate()}</span>
      {(dots.length > 0 || overflow > 0) && (
        <div className="month-cell__dots" aria-hidden="true">
          {dots.map((ev) => (
            <span
              key={ev.id}
              className={['month-cell__dot', ev.type === 'custody' && 'month-cell__dot--custody']
                .filter(Boolean)
                .join(' ')}
              style={{ backgroundColor: dotColour(ev, profileColors, fallbackColour) }}
            />
          ))}
          {overflow > 0 && <span className="month-cell__overflow">+{overflow}</span>}
        </div>
      )}
    </button>
  );
}

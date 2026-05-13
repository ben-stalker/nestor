import type { CalendarEventRaw } from '../api/calendar';

function formatTime(ms: number): string {
  return new Intl.DateTimeFormat(navigator.language, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

interface EventBlockProps {
  event: CalendarEventRaw;
  colour: string;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
  onClick: () => void;
}

export default function EventBlock({
  event,
  colour,
  top,
  height,
  column,
  totalColumns,
  onClick,
}: EventBlockProps) {
  const widthPct = 100 / totalColumns;
  const leftPct = column * widthPct;
  const compact = height < 32;

  return (
    <button
      type="button"
      className={`event-block${compact ? ' event-block--compact' : ''}`}
      style={{
        top,
        height: Math.max(height, 20),
        left: `${leftPct}%`,
        width: `calc(${widthPct}% - 2px)`,
        backgroundColor: colour,
      }}
      onClick={onClick}
      aria-label={event.title}
    >
      {!compact && <span className="event-block__time">{formatTime(event.start_datetime)}</span>}
      <span className="event-block__title">{event.title}</span>
    </button>
  );
}

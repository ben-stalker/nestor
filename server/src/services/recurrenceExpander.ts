import ICAL from 'ical.js';
import type { Recur as ICALRecur } from 'ical.js';
import type { CalendarEvent } from '../types/calendar';

/**
 * Expand a recurring event into individual occurrences within [rangeStart, rangeEnd].
 * Returns expanded instances; each carries the master event id plus an occurrence_id.
 */
export default function expandRecurring(
  event: CalendarEvent,
  rangeStart: number,
  rangeEnd: number,
): CalendarEvent[] {
  if (!event.recurring_rule) return [];

  const durationMs = event.end_datetime - event.start_datetime;

  let iter: ReturnType<ICALRecur['iterator']>;
  try {
    const rule = ICAL.Recur.fromString(event.recurring_rule);
    const dtstart = ICAL.Time.fromJSDate(new Date(event.start_datetime), true);
    iter = rule.iterator(dtstart);
  } catch {
    return [];
  }

  const out: CalendarEvent[] = [];
  let next = iter.next();

  while (next) {
    const ts = next.toJSDate().getTime();
    if (ts > rangeEnd) break;

    if (ts + durationMs >= rangeStart) {
      out.push({
        ...event,
        start_datetime: ts,
        end_datetime: ts + durationMs,
        occurrence_id: `${event.id}::${ts}`,
      });
    }

    next = iter.next();
  }

  return out;
}

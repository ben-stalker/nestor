import BaseRepository from './BaseRepository';
import expandRecurring from '../services/recurrenceExpander';
import {
  EventInputSchema,
  EventUpdateSchema,
  type CalendarEvent,
  type EventInput,
  type EventUpdate,
} from '../types/calendar';

interface EventRow {
  id: number;
  title: string;
  start_datetime: number;
  end_datetime: number;
  all_day: number;
  profile_id: number | null;
  source: string;
  caldav_uid: string | null;
  caldav_etag: string | null;
  account_id: number | null;
  type: string;
  recurring_rule: string | null;
  colour_override: string | null;
  notes: string | null;
  created_at: number;
}

function toEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    start_datetime: row.start_datetime,
    end_datetime: row.end_datetime,
    all_day: row.all_day,
    profile_id: row.profile_id,
    source: row.source as CalendarEvent['source'],
    caldav_uid: row.caldav_uid,
    caldav_etag: row.caldav_etag,
    account_id: row.account_id,
    type: row.type as CalendarEvent['type'],
    recurring_rule: row.recurring_rule,
    colour_override: row.colour_override,
    notes: row.notes,
    created_at: row.created_at,
  };
}

export default class EventRepository extends BaseRepository {
  get(id: number): CalendarEvent | undefined {
    const row = this.queryOne<EventRow>('SELECT * FROM calendar_events WHERE id = ?', [id]);
    return row ? toEvent(row) : undefined;
  }

  create(input: EventInput): CalendarEvent {
    const parsed = EventInputSchema.parse(input);
    const result = this.run(
      `INSERT INTO calendar_events
        (title, start_datetime, end_datetime, all_day, profile_id, source,
         caldav_uid, caldav_etag, account_id, type, recurring_rule,
         colour_override, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsed.title,
        parsed.start_datetime,
        parsed.end_datetime,
        parsed.all_day ? 1 : 0,
        parsed.profile_id ?? null,
        parsed.source,
        parsed.caldav_uid ?? null,
        parsed.caldav_etag ?? null,
        parsed.account_id ?? null,
        parsed.type,
        parsed.recurring_rule ?? null,
        parsed.colour_override ?? null,
        parsed.notes ?? null,
        Date.now(),
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: EventUpdate): CalendarEvent | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const parsed = EventUpdateSchema.parse(patch);

    const sets: string[] = [];
    const params: unknown[] = [];

    const fields: [keyof typeof parsed, string][] = [
      ['title', 'title'],
      ['start_datetime', 'start_datetime'],
      ['end_datetime', 'end_datetime'],
      ['profile_id', 'profile_id'],
      ['type', 'type'],
      ['recurring_rule', 'recurring_rule'],
      ['colour_override', 'colour_override'],
      ['notes', 'notes'],
    ];

    fields.forEach(([key, col]) => {
      if (parsed[key] !== undefined) {
        sets.push(`${col} = ?`);
        params.push(parsed[key] as unknown);
      }
    });

    if (parsed.all_day !== undefined) {
      sets.push('all_day = ?');
      params.push(parsed.all_day ? 1 : 0);
    }

    if (sets.length === 0) return existing;
    params.push(id);
    this.run(`UPDATE calendar_events SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.run('DELETE FROM calendar_events WHERE id = ?', [id]);
    return result.changes > 0;
  }

  upsertByCaldavUid(
    accountId: number,
    uid: string,
    fields: Omit<EventInput, 'caldav_uid' | 'account_id' | 'source'>,
  ): CalendarEvent {
    const existing = this.queryOne<EventRow>(
      'SELECT * FROM calendar_events WHERE account_id = ? AND caldav_uid = ?',
      [accountId, uid],
    );

    if (existing) {
      const parsed = EventUpdateSchema.parse(fields);
      const sets: string[] = [];
      const params: unknown[] = [];

      if (parsed.title !== undefined) {
        sets.push('title = ?');
        params.push(parsed.title);
      }
      if (parsed.start_datetime !== undefined) {
        sets.push('start_datetime = ?');
        params.push(parsed.start_datetime);
      }
      if (parsed.end_datetime !== undefined) {
        sets.push('end_datetime = ?');
        params.push(parsed.end_datetime);
      }
      if (parsed.all_day !== undefined) {
        sets.push('all_day = ?');
        params.push(parsed.all_day ? 1 : 0);
      }
      if (parsed.profile_id !== undefined) {
        sets.push('profile_id = ?');
        params.push(parsed.profile_id);
      }
      if (parsed.type !== undefined) {
        sets.push('type = ?');
        params.push(parsed.type);
      }
      if (parsed.recurring_rule !== undefined) {
        sets.push('recurring_rule = ?');
        params.push(parsed.recurring_rule);
      }
      if (parsed.colour_override !== undefined) {
        sets.push('colour_override = ?');
        params.push(parsed.colour_override);
      }
      if (parsed.notes !== undefined) {
        sets.push('notes = ?');
        params.push(parsed.notes);
      }

      if (sets.length > 0) {
        params.push(existing.id);
        this.run(`UPDATE calendar_events SET ${sets.join(', ')} WHERE id = ?`, params);
      }
      return this.get(existing.id)!;
    }

    return this.create({
      ...fields,
      caldav_uid: uid,
      account_id: accountId,
      source: 'caldav',
    });
  }

  findInRange(start: number, end: number, profileIds?: number[]): CalendarEvent[] {
    // Fetch single-occurrence events that overlap [start, end] directly.
    let singleSql = `
      SELECT * FROM calendar_events
      WHERE recurring_rule IS NULL
        AND start_datetime <= ? AND end_datetime >= ?
    `;
    const singleParams: unknown[] = [end, start];

    // Fetch all recurring events for the applicable profiles (expand in-memory).
    let recurringSql = `
      SELECT * FROM calendar_events
      WHERE recurring_rule IS NOT NULL
    `;
    const recurringParams: unknown[] = [];

    if (profileIds && profileIds.length > 0) {
      const placeholders = profileIds.map(() => '?').join(', ');
      const profileFilter = ` AND (profile_id IS NULL OR profile_id IN (${placeholders}))`;
      singleSql += profileFilter;
      singleParams.push(...profileIds);
      recurringSql += profileFilter;
      recurringParams.push(...profileIds);
    }

    const singles = this.all<EventRow>(singleSql, singleParams).map(toEvent);
    const recurring = this.all<EventRow>(recurringSql, recurringParams).map(toEvent);

    const expanded = recurring.flatMap((e) => expandRecurring(e, start, end));

    return [...singles, ...expanded].sort((a, b) => a.start_datetime - b.start_datetime);
  }

  findRecurring(): CalendarEvent[] {
    return this.all<EventRow>('SELECT * FROM calendar_events WHERE recurring_rule IS NOT NULL').map(
      toEvent,
    );
  }
}

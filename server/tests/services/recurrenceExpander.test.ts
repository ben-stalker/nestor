import expandRecurring from '../../src/services/recurrenceExpander';
import type { CalendarEvent } from '../../src/types/calendar';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 1,
    title: 'Recurring',
    start_datetime: 0,
    end_datetime: 3_600_000, // 1 hour
    all_day: 0,
    profile_id: null,
    source: 'local',
    caldav_uid: null,
    caldav_etag: null,
    account_id: null,
    type: 'default',
    recurring_rule: null,
    colour_override: null,
    notes: null,
    created_at: 0,
    ...overrides,
  };
}

// Monday 2024-01-01 00:00 UTC = 1704067200000
const MON_JAN_1 = 1_704_067_200_000;
const DAY = 86_400_000;
const HOUR = 3_600_000;
const WEEK = 7 * DAY;

describe('expandRecurring', () => {
  it('returns [] when recurring_rule is null', () => {
    const event = makeEvent({ recurring_rule: null });
    expect(expandRecurring(event, MON_JAN_1, MON_JAN_1 + WEEK)).toEqual([]);
  });

  it('returns [] when range is fully before series start', () => {
    const event = makeEvent({
      start_datetime: MON_JAN_1 + 2 * WEEK,
      end_datetime: MON_JAN_1 + 2 * WEEK + HOUR,
      recurring_rule: 'FREQ=WEEKLY',
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + WEEK);
    expect(results).toHaveLength(0);
  });

  it('weekly BYDAY=MO,WE,FR — 3 occurrences in a Mon–Sun window', () => {
    // Start on Monday 2024-01-01
    const event = makeEvent({
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + 7 * DAY - 1);
    expect(results).toHaveLength(3);
    const titles = results.map((e) => e.occurrence_id);
    expect(titles[0]).toBe(`1::${MON_JAN_1}`); // Monday
    expect(titles[1]).toBe(`1::${MON_JAN_1 + 2 * DAY}`); // Wednesday
    expect(titles[2]).toBe(`1::${MON_JAN_1 + 4 * DAY}`); // Friday
  });

  it('each expanded instance has correct duration', () => {
    const event = makeEvent({
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + 2 * HOUR,
      recurring_rule: 'FREQ=DAILY',
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + 2 * DAY);
    results.forEach((e) => {
      expect(e.end_datetime - e.start_datetime).toBe(2 * HOUR);
    });
  });

  it('COUNT=3 terminates after 3 occurrences', () => {
    const event = makeEvent({
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: 'FREQ=DAILY;COUNT=3',
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + 30 * DAY);
    expect(results).toHaveLength(3);
  });

  it('UNTIL terminates after the UNTIL date', () => {
    // UNTIL=20240104T000000Z = 2024-01-04 00:00 UTC
    const until = '20240104T000000Z';
    const event = makeEvent({
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: `FREQ=DAILY;UNTIL=${until}`,
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + 30 * DAY);
    // Should have Jan 1, 2, 3 (4 excluded by UNTIL=midnight Jan 4)
    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.length).toBeLessThanOrEqual(4);
    results.forEach((e) => {
      expect(e.start_datetime).toBeLessThanOrEqual(MON_JAN_1 + 4 * DAY);
    });
  });

  it('range fully after UNTIL returns []', () => {
    const until = '20240103T000000Z';
    const event = makeEvent({
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: `FREQ=DAILY;UNTIL=${until}`,
    });
    const results = expandRecurring(event, MON_JAN_1 + 10 * DAY, MON_JAN_1 + 20 * DAY);
    expect(results).toHaveLength(0);
  });

  it('monthly on 31st skips months without 31 days', () => {
    // Start Jan 31 2024
    const jan31 = new Date('2024-01-31T00:00:00Z').getTime();
    const event = makeEvent({
      start_datetime: jan31,
      end_datetime: jan31 + HOUR,
      recurring_rule: 'FREQ=MONTHLY;BYMONTHDAY=31',
    });
    // Query 6 months: Jan–Jun 2024
    const results = expandRecurring(event, jan31, jan31 + 6 * 30 * DAY);
    const months = results.map((e) => new Date(e.start_datetime).getUTCMonth());
    // Jan (0), Mar (2), May (4) have 31 days; Feb (1), Apr (3), Jun (5) don't
    expect(months).toContain(0); // January
    expect(months).toContain(2); // March
    expect(months).not.toContain(1); // February has no 31st
  });

  it('occurrence_id is id::startEpoch', () => {
    const event = makeEvent({
      id: 42,
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: 'FREQ=DAILY;COUNT=2',
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + 10 * DAY);
    expect(results[0].occurrence_id).toBe(`42::${MON_JAN_1}`);
    expect(results[1].occurrence_id).toBe(`42::${MON_JAN_1 + DAY}`);
  });

  it('preserves master event id on all occurrences', () => {
    const event = makeEvent({
      id: 7,
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: 'FREQ=DAILY;COUNT=3',
    });
    const results = expandRecurring(event, MON_JAN_1, MON_JAN_1 + 10 * DAY);
    results.forEach((e) => expect(e.id).toBe(7));
  });

  it('invalid RRULE string returns []', () => {
    const event = makeEvent({
      start_datetime: MON_JAN_1,
      end_datetime: MON_JAN_1 + HOUR,
      recurring_rule: 'NOT_A_VALID_RRULE',
    });
    expect(expandRecurring(event, MON_JAN_1, MON_JAN_1 + WEEK)).toEqual([]);
  });
});

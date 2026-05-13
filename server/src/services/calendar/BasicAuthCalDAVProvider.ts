import ICAL, { type Component as ICALComponent, type Property as ICALProperty } from 'ical.js';
import type { CalendarProvider, RawEvent } from './CalendarProvider';
import type { CalendarAccount, CalendarEvent } from '../../types/calendar';
import type CalendarAccountRepository from '../../repositories/CalendarAccountRepository';

export const APPLE_CALDAV_URL = 'https://caldav.icloud.com';
export const YAHOO_CALDAV_URL = 'https://caldav.calendar.yahoo.com';

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

function parseVevent(vevent: ICALComponent, etag?: string): RawEvent | null {
  const uid = vevent.getFirstPropertyValue('uid');
  if (!uid) return null;

  const ev = new ICAL.Event(vevent);
  const rruleProp: ICALProperty | null = vevent.getFirstProperty('rrule');
  let recurringRule: string | undefined;
  if (rruleProp) {
    const raw = rruleProp.toICALString();
    recurringRule = raw.startsWith('RRULE:') ? raw.slice(6) : raw;
  }

  return {
    caldav_uid: uid,
    caldav_etag: etag,
    title: ev.summary || 'Untitled',
    start_datetime: ev.startDate.toJSDate().getTime(),
    end_datetime: ev.endDate.toJSDate().getTime(),
    all_day: ev.startDate.isDate,
    recurring_rule: recurringRule,
    notes: ev.description || undefined,
  };
}

function parseCalendarObject(obj: { data?: string; etag?: string }): RawEvent[] {
  if (!obj.data) return [];
  try {
    const jcal = ICAL.parse(obj.data);
    const comp = new ICAL.Component(jcal);
    return comp
      .getAllSubcomponents('vevent')
      .map((vevent) => parseVevent(vevent, obj.etag))
      .filter((ev): ev is RawEvent => ev !== null);
  } catch {
    return [];
  }
}

export async function fetchBasicAuthCalDAV(
  serverUrl: string,
  creds: BasicAuthCredentials,
): Promise<RawEvent[]> {
  const { createDAVClient } = await import('tsdav');
  const client = await createDAVClient({
    serverUrl,
    credentials: { username: creds.username, password: creds.password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });

  const calendars = await client.fetchCalendars();
  const objectArrays = await Promise.all(
    calendars.map((calendar) => client.fetchCalendarObjects({ calendar })),
  );

  return objectArrays.flat().flatMap(parseCalendarObject);
}

export async function testBasicAuthCalDAV(
  serverUrl: string,
  creds: BasicAuthCredentials,
): Promise<boolean> {
  const { createDAVClient } = await import('tsdav');
  try {
    const client = await createDAVClient({
      serverUrl,
      credentials: { username: creds.username, password: creds.password },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });
    await client.fetchCalendars();
    return true;
  } catch {
    return false;
  }
}

export class BasicAuthCalDAVProvider implements CalendarProvider {
  constructor(
    private readonly accountRepo: CalendarAccountRepository,
    private readonly defaultServerUrl: string,
  ) {}

  async pull(account: CalendarAccount): Promise<RawEvent[]> {
    const creds = this.accountRepo.getCredentials(account.id) as unknown as BasicAuthCredentials;
    const serverUrl = account.caldav_url ?? this.defaultServerUrl;
    return fetchBasicAuthCalDAV(serverUrl, creds);
  }

  // eslint-disable-next-line class-methods-use-this
  async push(_account: CalendarAccount, _event: CalendarEvent): Promise<void> {
    // Read-only CalDAV sync
  }

  async testCredentials(account: CalendarAccount): Promise<boolean> {
    const creds = this.accountRepo.getCredentials(account.id) as unknown as BasicAuthCredentials;
    const serverUrl = account.caldav_url ?? this.defaultServerUrl;
    return testBasicAuthCalDAV(serverUrl, creds);
  }
}

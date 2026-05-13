import ICAL, { type Component as ICALComponent, type Property as ICALProperty } from 'ical.js';
import type { CalendarProvider, RawEvent } from './CalendarProvider';
import type { CalendarAccount, CalendarEvent } from '../../types/calendar';
import type CalendarAccountRepository from '../../repositories/CalendarAccountRepository';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_CALDAV_BASE = 'https://apidata.googleusercontent.com/caldav/v2/';

export interface GoogleCredentials {
  access_token: string;
  refresh_token: string;
  token_expiry: number;
  client_id: string;
  client_secret: string;
  email?: string;
}

export async function refreshGoogleToken(creds: GoogleCredentials): Promise<{
  access_token: string;
  token_expiry: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    access_token: data.access_token,
    token_expiry: Date.now() + data.expires_in * 1000,
  };
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

export class GoogleCalDAVProvider implements CalendarProvider {
  constructor(private readonly accountRepo: CalendarAccountRepository) {}

  async pull(account: CalendarAccount): Promise<RawEvent[]> {
    let creds = this.accountRepo.getCredentials(account.id) as unknown as GoogleCredentials;

    if (Date.now() >= creds.token_expiry - 60_000) {
      const refreshed = await refreshGoogleToken(creds);
      creds = { ...creds, ...refreshed };
      this.accountRepo.update(account.id, {
        credentials: creds as unknown as Record<string, unknown>,
      });
    }

    const caldavUrl = account.caldav_url ?? GOOGLE_CALDAV_BASE;
    const { createDAVClient } = await import('tsdav');

    const client = await createDAVClient({
      serverUrl: caldavUrl,
      credentials: { accessToken: creds.access_token },
      authMethod: 'Oauth',
      defaultAccountType: 'caldav',
    });

    const calendars = await client.fetchCalendars();
    const objectArrays = await Promise.all(
      calendars.map((calendar) => client.fetchCalendarObjects({ calendar })),
    );

    return objectArrays.flat().flatMap(parseCalendarObject);
  }

  // eslint-disable-next-line class-methods-use-this
  async push(_account: CalendarAccount, _event: CalendarEvent): Promise<void> {
    // Read-only CalDAV sync; push is not supported
  }

  async testCredentials(account: CalendarAccount): Promise<boolean> {
    try {
      const creds = this.accountRepo.getCredentials(account.id) as unknown as GoogleCredentials;
      const caldavUrl = account.caldav_url ?? GOOGLE_CALDAV_BASE;
      const res = await fetch(caldavUrl, {
        method: 'PROPFIND',
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          Depth: '0',
        },
      });
      return res.ok || res.status === 207;
    } catch {
      return false;
    }
  }
}

export default GoogleCalDAVProvider;

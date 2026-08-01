import { Router } from 'express';
import { z } from 'zod';
import type EventRepository from '../repositories/EventRepository';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';

export type ComingUpCategory = 'countdown' | 'finance' | 'vehicle' | 'birthday' | 'holiday';

export interface ComingUpItem {
  id: string;
  title: string;
  daysUntil: number;
  category: ComingUpCategory;
  deepLink?: string;
}

export interface ComingUpResponse {
  items: ComingUpItem[];
}

export interface WfhStatus {
  profileId: number;
  profileName: string;
  status: 'wfh' | 'office' | 'holiday' | 'unknown';
}

export interface NurseryDrop {
  profileId: number;
  profileName: string;
  dropTime?: string;
  pickupTime?: string;
}

export interface SchoolPickup {
  profileId: number;
  profileName: string;
  pickupTime?: string;
}

export interface VehicleBooking {
  vehicleId: number;
  vehicleName: string;
  profileId: number;
  profileName: string;
  startTime: string;
  endTime?: string;
}

export interface VetAppointment {
  petId: number;
  petName: string;
  appointmentTime: string;
  notes?: string;
}

export interface BinCollection {
  type: string;
  colour: string;
  collectionDay: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime?: string;
  profileId: number;
  profileColour: string;
  allDay: boolean;
}

export interface DaySummary {
  date: string;
  events: CalendarEvent[];
  wfhStatuses: WfhStatus[];
  nurseryDrops: NurseryDrop[];
  schoolPickups: SchoolPickup[];
  vehicleBookings: VehicleBooking[];
  vetAppointments: VetAppointment[];
  binCollections: BinCollection[];
}

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function getTimezoneOffsetMs(dateStr: string, timezone: string): number {
  // Get the UTC offset for midnight on this date in the given timezone
  const utcDate = new Date(`${dateStr}T00:00:00Z`);
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(utcDate);

  const get = (type: string) => Number(localParts.find((p) => p.type === type)?.value ?? '0');
  const localMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return localMs - utcDate.getTime();
}

function dayBoundsUtc(dateStr: string, timezone: string): { start: number; end: number } {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    // Find UTC ms for midnight and 23:59:59.999 in the target timezone
    const startLocal = new Date(`${dateStr}T00:00:00`);
    const endLocal = new Date(`${dateStr}T23:59:59.999`);

    // Validate the timezone is a recognised IANA name (throws otherwise, caught below)
    fmt.format(startLocal);

    // Use Temporal-style offset calculation: difference between UTC interpretation of the dateStr
    // and the actual local midnight in UTC.
    const tzOffset = getTimezoneOffsetMs(dateStr, timezone);
    return {
      start: startLocal.getTime() - tzOffset,
      end: endLocal.getTime() - tzOffset,
    };
  } catch {
    // Fallback: treat as UTC
    return {
      start: new Date(`${dateStr}T00:00:00Z`).getTime(),
      end: new Date(`${dateStr}T23:59:59.999Z`).getTime(),
    };
  }
}

export default function createHomeRouter(
  eventRepo?: EventRepository,
  settingsRepo?: AppSettingsRepository,
): Router {
  const router = Router();

  router.get('/api/v1/home/coming-up', (_req, res) => {
    const response: ComingUpResponse = { items: [] };
    res.json(response);
  });

  router.get('/api/v1/home/day-summary', (req, res, next) => {
    try {
      const parsed = DateSchema.safeParse(req.query.date);
      if (!parsed.success) {
        res.status(400).json({
          error: 'INVALID_DATE',
          message: 'date query parameter must be in YYYY-MM-DD format',
        });
        return;
      }

      const dateStr = parsed.data;
      const timezone = settingsRepo?.get<string>('timezone') ?? 'UTC';
      const { start: dayStart, end: dayEnd } = dayBoundsUtc(dateStr, timezone);

      const rawEvents = eventRepo ? eventRepo.findInRange(dayStart, dayEnd) : [];
      const events: CalendarEvent[] = rawEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: new Date(e.start_datetime).toISOString(),
        endTime: e.end_datetime ? new Date(e.end_datetime).toISOString() : undefined,
        profileId: e.profile_id ?? 0,
        profileColour: '#888888',
        allDay: Boolean(e.all_day),
      }));

      const summary: DaySummary = {
        date: dateStr,
        events,
        wfhStatuses: [],
        nurseryDrops: [],
        schoolPickups: [],
        vehicleBookings: [],
        vetAppointments: [],
        binCollections: [],
      };

      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

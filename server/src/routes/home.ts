import { Router } from 'express';
import { z } from 'zod';

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

export default function createHomeRouter(): Router {
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

      const summary: DaySummary = {
        date: parsed.data,
        events: [],
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

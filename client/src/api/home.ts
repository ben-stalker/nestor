import apiFetch from './client';

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

export async function getDaySummary(date: string): Promise<DaySummary> {
  return apiFetch<DaySummary>(`/api/v1/home/day-summary?date=${date}`);
}

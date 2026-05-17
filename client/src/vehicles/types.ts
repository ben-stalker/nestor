export type VehicleType = 'car' | 'van' | 'motorcycle' | 'bicycle' | 'ev';

export interface Vehicle {
  id: number;
  nickname: string;
  type: VehicleType;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  colour: string | null;
  photo_path: string | null;
  mot_due: number | null;
  tax_due: number | null;
  insurance_due: number | null;
  service_due: number | null;
  service_due_mileage: number | null;
  current_mileage: number | null;
  active: boolean;
  reminder_overrides_json: Record<string, number[]> | null;
  plug_in_reminder_time: string | null;
  plug_in_reminder_days: number[] | null;
  plug_in_snoozed_until: number | null;
}

export interface VehicleBooking {
  id: number;
  vehicle_id: number;
  profile_id: number | null;
  start_datetime: number;
  end_datetime: number;
  business: boolean;
  miles: number | null;
  notes: string | null;
  created_at: number;
}

export interface BookingConflict {
  id: number;
  start_datetime: number;
  end_datetime: number;
  profile_id: number | null;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  date: number;
  litres: number;
  cost_minor: number;
  mileage: number | null;
}

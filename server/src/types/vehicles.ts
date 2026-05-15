import { z } from 'zod';

export const VEHICLE_TYPES = ['car', 'van', 'motorcycle', 'bicycle', 'ev'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

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
}

export const VehicleInputSchema = z.object({
  nickname: z.string().min(1).max(100),
  type: z.enum(VEHICLE_TYPES),
  make: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  registration: z.string().max(20).nullable().optional(),
  colour: z.string().max(50).nullable().optional(),
  mot_due: z.number().int().nullable().optional(),
  tax_due: z.number().int().nullable().optional(),
  insurance_due: z.number().int().nullable().optional(),
  service_due: z.number().int().nullable().optional(),
  service_due_mileage: z.number().int().nullable().optional(),
  current_mileage: z.number().int().nullable().optional(),
});
export type VehicleInput = z.infer<typeof VehicleInputSchema>;

export const VehicleUpdateSchema = VehicleInputSchema.partial().extend({
  active: z.boolean().optional(),
  photo_path: z.string().max(500).nullable().optional(),
});
export type VehicleUpdate = z.infer<typeof VehicleUpdateSchema>;

// ─── Bookings ────────────────────────────────────────────────────────────────

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

export const BookingInputSchema = z.object({
  profile_id: z.number().int().nullable().optional(),
  start_datetime: z.number().int(),
  end_datetime: z.number().int(),
  business: z.boolean().optional().default(false),
  miles: z.number().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type BookingInput = z.input<typeof BookingInputSchema>;

export const BookingUpdateSchema = BookingInputSchema.partial();
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;

// ─── Fuel Logs ───────────────────────────────────────────────────────────────

export interface FuelLog {
  id: number;
  vehicle_id: number;
  date: number;
  litres: number;
  cost_minor: number;
  mileage: number | null;
}

export const FuelLogInputSchema = z.object({
  date: z.number().int(),
  litres: z.number().positive(),
  cost_minor: z.number().int().nonnegative(),
  mileage: z.number().int().nullable().optional(),
});
export type FuelLogInput = z.infer<typeof FuelLogInputSchema>;

// ─── Errors ──────────────────────────────────────────────────────────────────

export class ConflictError extends Error {
  readonly conflicts: VehicleBooking[];

  constructor(conflicts: VehicleBooking[]) {
    super('BOOKING_CONFLICT');
    this.name = 'ConflictError';
    this.conflicts = conflicts;
  }
}

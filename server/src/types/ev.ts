import { z } from 'zod';

export interface EvChargingLog {
  id: number;
  vehicle_id: number;
  session_date: number;
  kwh: number;
  cost_minor: number | null;
  location: string | null;
  notes: string | null;
  created_at: number;
}

export const EvChargingLogInputSchema = z.object({
  vehicle_id: z.number().int().positive(),
  session_date: z.number().int().positive(),
  kwh: z.number().positive(),
  cost_minor: z.number().int().nonnegative().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type EvChargingLogInput = z.infer<typeof EvChargingLogInputSchema>;

export const EvChargingLogUpdateSchema = z.object({
  session_date: z.number().int().positive().optional(),
  kwh: z.number().positive().optional(),
  cost_minor: z.number().int().nonnegative().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type EvChargingLogUpdate = z.infer<typeof EvChargingLogUpdateSchema>;

export interface MonthlyEvSummary {
  year: number;
  month: number;
  total_kwh: number;
  total_cost_minor: number;
  session_count: number;
}

export interface EnergySummary {
  this_month: {
    ev_kwh: number;
    ev_cost_minor: number;
    electricity_units: number;
    electricity_cost_minor: number;
    gas_cost_minor: number;
    oil_cost_minor: number;
    total_cost_minor: number;
  };
  monthly_ev_history: MonthlyEvSummary[];
}

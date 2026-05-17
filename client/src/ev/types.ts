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

export interface FuelRates {
  current: Record<string, number>;
  history: Array<{ fuel: string; rate: number; effective_date: string }>;
}

export interface EvChargingLogInput {
  vehicle_id: number;
  session_date: number;
  kwh: number;
  cost_minor?: number | null;
  location?: string | null;
  notes?: string | null;
}

export interface EvChargingLogUpdate {
  session_date?: number;
  kwh?: number;
  cost_minor?: number | null;
  location?: string | null;
  notes?: string | null;
}

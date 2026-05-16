export interface BinSchedule {
  id: number;
  name: string;
  colour: string;
  icon: string;
  day_of_week: number;
  frequency_weeks: 1 | 2 | 4;
  anchor_date: number;
  bank_holiday_shift: boolean;
  reminder_evening_before: boolean;
  reminder_morning_of: boolean;
  audio_chime: boolean;
  active: boolean;
}

export interface BinUpcomingEntry {
  bin: BinSchedule;
  dates: number[];
}

export interface BinUpcomingResponse {
  bins: BinUpcomingEntry[];
}

export type SubscriptionCategory = 'streaming' | 'software' | 'services' | 'other';

export interface Subscription {
  id: number;
  name: string;
  category: SubscriptionCategory;
  monthly_cost: number;
  renewal_date: number;
  trial_end_date: number | null;
  alert_days_before: number;
  active: boolean;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  totalMonthlyCost: number;
}

export type MaintenanceType = 'job' | 'warranty' | 'reminder';

export interface HomeMaintenance {
  id: number;
  title: string;
  type: MaintenanceType;
  completed_date: number | null;
  next_due_date: number | null;
  cost: number | null;
  contact_id: number | null;
  landlord_report: boolean;
  renter_mode: boolean;
  notes: string | null;
}

export type FuelType = 'electricity' | 'gas' | 'oil' | 'water';

export interface MeterReading {
  id: number;
  fuel_type: FuelType;
  reading_date: number;
  value: number;
  unit: string;
  cost_per_unit: number | null;
  notes: string | null;
}

export interface BudgetCategory {
  id: number;
  name: string;
  monthly_budget_minor: number;
  colour: string | null;
}

export interface BudgetExpense {
  id: number;
  category_id: number;
  amount_minor: number;
  spent_date: number;
  note: string | null;
}

export interface MonthlySummaryEntry {
  category: BudgetCategory;
  spent_minor: number;
  budget_minor: number;
}

export type ChecklistType = 'daily_reset' | 'trip' | 'one_off' | 'recurring';

export interface Checklist {
  id: number;
  name: string;
  type: ChecklistType;
  auto_reset_cron: string | null;
  template_id: string | null;
  last_reset_at: number | null;
  guest_name: string | null;
  guest_arrival_date: number | null;
  created_at: number;
}

export interface ChecklistItem {
  id: number;
  checklist_id: number;
  text: string;
  ticked: boolean;
  sort_order: number;
  section: string | null;
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

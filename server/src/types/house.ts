import { z } from 'zod';

// ─── Bin Schedules ────────────────────────────────────────────────────────────

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

export const BinScheduleInputSchema = z.object({
  name: z.string().min(1).max(100),
  colour: z.string().default('#4CAF50'),
  icon: z.string().default('trash'),
  day_of_week: z.number().int().min(0).max(6),
  frequency_weeks: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  anchor_date: z.number().int(),
  bank_holiday_shift: z.boolean().default(true),
  reminder_evening_before: z.boolean().default(true),
  reminder_morning_of: z.boolean().default(false),
  audio_chime: z.boolean().default(false),
});
export type BinScheduleInput = z.infer<typeof BinScheduleInputSchema>;

export const BinScheduleUpdateSchema = BinScheduleInputSchema.partial();
export type BinScheduleUpdate = z.infer<typeof BinScheduleUpdateSchema>;

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const SUBSCRIPTION_CATEGORIES = ['streaming', 'software', 'services', 'other'] as const;
export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];

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

export const SubscriptionInputSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(SUBSCRIPTION_CATEGORIES).default('other'),
  monthly_cost: z.number().int().min(0),
  renewal_date: z.number().int(),
  trial_end_date: z.number().int().nullable().optional(),
  alert_days_before: z.number().int().min(1).default(7),
});
export type SubscriptionInput = z.infer<typeof SubscriptionInputSchema>;

export const SubscriptionUpdateSchema = SubscriptionInputSchema.partial().extend({
  active: z.boolean().optional(),
});
export type SubscriptionUpdate = z.infer<typeof SubscriptionUpdateSchema>;

// ─── Home Maintenance ─────────────────────────────────────────────────────────

export const MAINTENANCE_TYPES = ['job', 'warranty', 'reminder'] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

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

export const HomeMaintenanceInputSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(MAINTENANCE_TYPES),
  completed_date: z.number().int().nullable().optional(),
  next_due_date: z.number().int().nullable().optional(),
  cost: z.number().int().nullable().optional(),
  contact_id: z.number().int().nullable().optional(),
  landlord_report: z.boolean().default(false),
  renter_mode: z.boolean().default(false),
  notes: z.string().max(2000).nullable().optional(),
});
export type HomeMaintenanceInput = z.infer<typeof HomeMaintenanceInputSchema>;

export const HomeMaintenanceUpdateSchema = HomeMaintenanceInputSchema.partial();
export type HomeMaintenanceUpdate = z.infer<typeof HomeMaintenanceUpdateSchema>;

// ─── Meter Readings ───────────────────────────────────────────────────────────

export const FUEL_TYPES = ['electricity', 'gas', 'oil', 'water'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export interface MeterReading {
  id: number;
  fuel_type: FuelType;
  reading_date: number;
  value: number;
  unit: string;
  cost_per_unit: number | null;
  notes: string | null;
}

export const MeterReadingInputSchema = z.object({
  fuel_type: z.enum(FUEL_TYPES),
  reading_date: z.number().int(),
  value: z.number(),
  unit: z.string().default('kWh'),
  cost_per_unit: z.number().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type MeterReadingInput = z.infer<typeof MeterReadingInputSchema>;

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface BudgetCategory {
  id: number;
  name: string;
  monthly_budget_minor: number;
  colour: string | null;
}

export const BudgetCategoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  monthly_budget_minor: z.number().int().min(0).default(0),
  colour: z.string().nullable().optional(),
});
export type BudgetCategoryInput = z.infer<typeof BudgetCategoryInputSchema>;

export const BudgetCategoryUpdateSchema = BudgetCategoryInputSchema.partial();
export type BudgetCategoryUpdate = z.infer<typeof BudgetCategoryUpdateSchema>;

export interface BudgetExpense {
  id: number;
  category_id: number;
  amount_minor: number;
  spent_date: number;
  note: string | null;
}

export const BudgetExpenseInputSchema = z.object({
  category_id: z.number().int().positive(),
  amount_minor: z.number().int().min(1),
  spent_date: z.number().int(),
  note: z.string().max(500).nullable().optional(),
});
export type BudgetExpenseInput = z.infer<typeof BudgetExpenseInputSchema>;

// ─── Checklists ───────────────────────────────────────────────────────────────

export const CHECKLIST_TYPES = ['daily_reset', 'trip', 'one_off', 'recurring'] as const;
export type ChecklistType = (typeof CHECKLIST_TYPES)[number];

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

export const ChecklistInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(CHECKLIST_TYPES),
  auto_reset_cron: z.string().nullable().optional(),
  template_id: z.string().nullable().optional(),
  guest_name: z.string().nullable().optional(),
  guest_arrival_date: z.number().int().nullable().optional(),
});
export type ChecklistInput = z.infer<typeof ChecklistInputSchema>;

export const ChecklistUpdateSchema = ChecklistInputSchema.partial();
export type ChecklistUpdate = z.infer<typeof ChecklistUpdateSchema>;

export interface ChecklistItem {
  id: number;
  checklist_id: number;
  text: string;
  ticked: boolean;
  sort_order: number;
  section: string | null;
}

export const ChecklistItemInputSchema = z.object({
  text: z.string().min(1).max(500),
  sort_order: z.number().int().min(0).default(0),
  section: z.string().nullable().optional(),
});
export type ChecklistItemInput = z.infer<typeof ChecklistItemInputSchema>;

export const ChecklistItemUpdateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  ticked: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  section: z.string().nullable().optional(),
});
export type ChecklistItemUpdate = z.infer<typeof ChecklistItemUpdateSchema>;

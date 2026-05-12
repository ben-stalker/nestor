import { z } from 'zod';

export const CalendarProviderSchema = z.enum(['google', 'apple', 'yahoo', 'custom']);
export type CalendarProvider = z.infer<typeof CalendarProviderSchema>;

export const EventTypeSchema = z.enum([
  'default',
  'wfh',
  'shift',
  'nursery_drop',
  'vehicle_booking',
  'vet',
  'custody',
  'school_term',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EventSourceSchema = z.enum(['local', 'caldav', 'plugin']);
export type EventSource = z.infer<typeof EventSourceSchema>;

export interface CalendarAccount {
  id: number;
  provider: CalendarProvider;
  display_name: string;
  caldav_url: string | null;
  sync_interval_mins: number;
  last_sync_at: number | null;
  last_sync_error: string | null;
  profile_id: number | null;
  active: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start_datetime: number;
  end_datetime: number;
  all_day: number;
  profile_id: number | null;
  source: EventSource;
  caldav_uid: string | null;
  caldav_etag: string | null;
  account_id: number | null;
  type: EventType;
  recurring_rule: string | null;
  colour_override: string | null;
  notes: string | null;
  created_at: number;
  occurrence_id?: string;
}

export const AccountInputSchema = z.object({
  provider: CalendarProviderSchema,
  display_name: z.string().min(1).max(200),
  caldav_url: z.string().url().nullable().optional(),
  credentials: z.record(z.string(), z.unknown()),
  sync_interval_mins: z.number().int().min(1).optional().default(15),
  profile_id: z.number().int().positive().nullable().optional(),
});
export type AccountInput = z.input<typeof AccountInputSchema>;

export const AccountUpdateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  caldav_url: z.string().url().nullable().optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  sync_interval_mins: z.number().int().min(1).optional(),
  profile_id: z.number().int().positive().nullable().optional(),
  active: z.number().int().min(0).max(1).optional(),
});
export type AccountUpdate = z.infer<typeof AccountUpdateSchema>;

export const EventInputSchema = z.object({
  title: z.string().min(1).max(200),
  start_datetime: z.number().int(),
  end_datetime: z.number().int(),
  all_day: z.boolean().default(false),
  profile_id: z.number().int().nullable().optional(),
  type: EventTypeSchema.default('default'),
  recurring_rule: z.string().optional(),
  colour_override: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  notes: z.string().max(2000).optional(),
  source: EventSourceSchema.optional().default('local'),
  caldav_uid: z.string().optional(),
  caldav_etag: z.string().optional(),
  account_id: z.number().int().positive().optional(),
});
export type EventInput = z.infer<typeof EventInputSchema>;

export const EventUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  start_datetime: z.number().int().optional(),
  end_datetime: z.number().int().optional(),
  all_day: z.boolean().optional(),
  profile_id: z.number().int().nullable().optional(),
  type: EventTypeSchema.optional(),
  recurring_rule: z.string().nullable().optional(),
  colour_override: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type EventUpdate = z.infer<typeof EventUpdateSchema>;

import { z } from 'zod';

// ─── Chores ──────────────────────────────────────────────────────────────────

export const CHORE_FREQUENCIES = ['daily', 'weekly', 'one_off'] as const;
export type ChoreFrequency = (typeof CHORE_FREQUENCIES)[number];

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  assigned_profile_id: number | null;
  points: number;
  frequency: ChoreFrequency;
  recurring_rule: string | null;
  active: boolean;
  sort_order: number;
  created_at: number;
}

export const ChoreInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  assigned_profile_id: z.number().int().positive().nullable().optional(),
  points: z.number().int().min(1).max(100).optional().default(1),
  frequency: z.enum(CHORE_FREQUENCIES),
  recurring_rule: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().min(0).optional().default(0),
});
export type ChoreInput = z.input<typeof ChoreInputSchema>;

export const ChoreUpdateSchema = ChoreInputSchema.partial().extend({
  active: z.boolean().optional(),
});
export type ChoreUpdate = z.infer<typeof ChoreUpdateSchema>;

// ─── Chore Completions ────────────────────────────────────────────────────────

export interface ChoreCompletion {
  id: number;
  chore_id: number;
  profile_id: number;
  completed_at: number;
  points_awarded: number;
}

// ─── Reward Redemptions ───────────────────────────────────────────────────────

export interface RewardRedemption {
  id: number;
  profile_id: number;
  points_spent: number;
  reward_label: string;
  redeemed_at: number;
}

export const RedemptionInputSchema = z.object({
  points_spent: z.number().int().min(1),
  reward_label: z.string().min(1).max(200),
});
export type RedemptionInput = z.infer<typeof RedemptionInputSchema>;

// ─── Health Logs ──────────────────────────────────────────────────────────────

export const HEALTH_LOG_TYPES = [
  'medicine',
  'temperature',
  'symptom',
  'vaccination',
  'growth',
  'feed',
  'nappy',
  'sleep',
  'mood',
  'weight',
] as const;
export type HealthLogType = (typeof HEALTH_LOG_TYPES)[number];

export interface HealthLog {
  id: number;
  profile_id: number;
  log_type: HealthLogType;
  data_json: Record<string, unknown>;
  logged_at: number;
}

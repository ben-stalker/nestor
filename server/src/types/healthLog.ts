import { z } from 'zod';

const MedicineSchema = z.object({
  log_type: z.literal('medicine'),
  name: z.string().min(1).max(200),
  dose: z.string().min(1).max(100),
  reason: z.string().max(300).optional(),
});

const TemperatureSchema = z.object({
  log_type: z.literal('temperature'),
  value: z.number().min(30).max(45),
  unit: z.enum(['c', 'f']),
});

const SymptomSchema = z.object({
  log_type: z.literal('symptom'),
  text: z.string().min(1).max(1000),
});

const VaccinationSchema = z.object({
  log_type: z.literal('vaccination'),
  name: z.string().min(1).max(200),
  lot_number: z.string().max(100).optional(),
});

const GrowthSchema = z.object({
  log_type: z.literal('growth'),
  weight_kg: z.number().min(0).max(300).optional(),
  height_cm: z.number().min(0).max(300).optional(),
  head_cm: z.number().min(0).max(100).optional(),
});

const FeedSchema = z.object({
  log_type: z.literal('feed'),
  side: z.enum(['left', 'right', 'bottle']).optional(),
  amount_ml: z.number().min(0).optional(),
  duration_mins: z.number().min(0).optional(),
});

const NappySchema = z.object({
  log_type: z.literal('nappy'),
  type: z.enum(['wet', 'dirty', 'both']),
});

const SleepSchema = z.object({
  log_type: z.literal('sleep'),
  start_ms: z.number().int(),
  end_ms: z.number().int().optional(),
});

const MoodSchema = z.object({
  log_type: z.literal('mood'),
  score: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

const WeightSchema = z.object({
  log_type: z.literal('weight'),
  value_kg: z.number().min(0).max(300),
});

export const HealthLogInput = z.discriminatedUnion('log_type', [
  MedicineSchema,
  TemperatureSchema,
  SymptomSchema,
  VaccinationSchema,
  GrowthSchema,
  FeedSchema,
  NappySchema,
  SleepSchema,
  MoodSchema,
  WeightSchema,
]);

export type HealthLogInputType = z.infer<typeof HealthLogInput>;

export const HealthLogUpdateSchema = z.object({
  data_json: z.record(z.string(), z.unknown()).optional(),
  logged_at: z.number().int().positive().optional(),
});

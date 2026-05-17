import { z } from 'zod';

export const PET_SPECIES = ['dog', 'cat', 'rabbit', 'bird', 'fish', 'reptile', 'other'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_LOG_TYPES = [
  'vaccination',
  'flea_treatment',
  'worming',
  'weight',
  'medication',
  'vet_visit',
  'document',
  'other',
] as const;
export type PetLogType = (typeof PET_LOG_TYPES)[number];

export const PetSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  species: z.enum(PET_SPECIES),
  breed: z.string().nullable(),
  dob: z.string().nullable(),
  colour: z.string().nullable(),
  microchip: z.string().nullable(),
  insurance_policy: z.string().nullable(),
  vet_name: z.string().nullable(),
  vet_phone: z.string().nullable(),
  vet_address: z.string().nullable(),
  vet_contact_id: z.number().int().nullable(),
  feeding_notes: z.string().nullable(),
  grooming_notes: z.string().nullable(),
  photo_path: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.number().int(),
  updated_at: z.number().int(),
});
export type Pet = z.infer<typeof PetSchema>;

export const PetInputSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum(PET_SPECIES).optional().default('dog'),
  breed: z.string().max(100).nullable().optional(),
  dob: z.string().nullable().optional(),
  colour: z.string().max(100).nullable().optional(),
  microchip: z.string().max(100).nullable().optional(),
  insurance_policy: z.string().max(200).nullable().optional(),
  vet_name: z.string().max(200).nullable().optional(),
  vet_phone: z.string().max(50).nullable().optional(),
  vet_address: z.string().max(500).nullable().optional(),
  vet_contact_id: z.number().int().nullable().optional(),
  feeding_notes: z.string().max(2000).nullable().optional(),
  grooming_notes: z.string().max(2000).nullable().optional(),
});
export type PetInput = z.infer<typeof PetInputSchema>;

export const PetHealthLogSchema = z.object({
  id: z.number().int(),
  pet_id: z.number().int(),
  log_type: z.enum(PET_LOG_TYPES),
  title: z.string(),
  notes: z.string().nullable(),
  log_date: z.string(),
  next_due_date: z.string().nullable(),
  reminder_days_before: z.number().int().nullable(),
  weight_kg: z.number().nullable(),
  document_path: z.string().nullable(),
  document_name: z.string().nullable(),
  linked_calendar_event_id: z.number().int().nullable(),
  created_at: z.number().int(),
  updated_at: z.number().int(),
});
export type PetHealthLog = z.infer<typeof PetHealthLogSchema>;

export const PetHealthLogInputSchema = z.object({
  log_type: z.enum(PET_LOG_TYPES),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).nullable().optional(),
  log_date: z.string(),
  next_due_date: z.string().nullable().optional(),
  reminder_days_before: z.number().int().min(0).max(365).nullable().optional(),
  weight_kg: z.number().positive().nullable().optional(),
  vet_appointment_date: z.string().nullable().optional(),
});
export type PetHealthLogInput = z.infer<typeof PetHealthLogInputSchema>;

export const UpcomingCareItemSchema = z.object({
  log_id: z.number().int(),
  pet_id: z.number().int(),
  pet_name: z.string(),
  log_type: z.enum(PET_LOG_TYPES),
  title: z.string(),
  next_due_date: z.string(),
  reminder_days_before: z.number().int().nullable(),
  days_until: z.number().int(),
});
export type UpcomingCareItem = z.infer<typeof UpcomingCareItemSchema>;

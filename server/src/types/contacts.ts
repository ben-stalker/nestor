import { z } from 'zod';

export const CONTACT_CATEGORIES = [
  'medical',
  'school',
  'pets',
  'home_services',
  'emergency',
  'family',
  'trade',
  'other',
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const ContactSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  role: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  category: z.enum(CONTACT_CATEGORIES),
  notes: z.string().nullable(),
  linked_pet_id: z.number().int().nullable(),
  linked_vehicle_id: z.number().int().nullable(),
  created_at: z.number().int(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const ContactInputSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  category: z.enum(CONTACT_CATEGORIES),
  notes: z.string().max(2000).nullable().optional(),
  linked_pet_id: z.number().int().nullable().optional(),
  linked_vehicle_id: z.number().int().nullable().optional(),
});
export type ContactInput = z.infer<typeof ContactInputSchema>;

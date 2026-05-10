import { z } from 'zod';
import type { Permissions } from './permissions';

export const ProfileTypeSchema = z.enum([
  'baby',
  'toddler',
  'child',
  'teen',
  'grandparent',
  'guest',
  'admin',
]);
export type ProfileType = z.infer<typeof ProfileTypeSchema>;

export const TextSizeSchema = z.enum(['small', 'default', 'large', 'xlarge']);
export type TextSize = z.infer<typeof TextSizeSchema>;

export interface Profile {
  id: number;
  name: string;
  type: ProfileType;
  colour: string;
  avatar_path: string | null;
  accessibility_json: Record<string, unknown> | null;
  permissions_json: Permissions;
  text_size: TextSize;
  simplified_nav: number;
  created_at: number;
}

export const CreateProfileSchema = z.object({
  name: z.string().min(1),
  type: ProfileTypeSchema,
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  pin: z.string().optional(),
  avatar_path: z.string().optional(),
  accessibility_json: z.record(z.string(), z.unknown()).optional(),
  permissions_json: z.record(z.string(), z.boolean()).optional(),
  text_size: TextSizeSchema.optional().default('default'),
  simplified_nav: z.number().int().min(0).max(1).optional().default(0),
});
export type CreateProfileInput = z.input<typeof CreateProfileSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  type: ProfileTypeSchema.optional(),
  colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  pin: z.string().optional(),
  avatar_path: z.string().nullable().optional(),
  accessibility_json: z.record(z.string(), z.unknown()).nullable().optional(),
  permissions_json: z.record(z.string(), z.boolean()).optional(),
  text_size: TextSizeSchema.optional(),
  simplified_nav: z.number().int().min(0).max(1).optional(),
});
export type UpdateProfileInput = z.input<typeof UpdateProfileSchema>;

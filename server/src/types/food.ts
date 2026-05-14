import { z } from 'zod';

// ─── Recipe ────────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  quantity: number | null;
  unit: string | null;
  ingredient: string;
  notes: string | null;
  sort_order: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  prep_mins: number;
  cook_mins: number;
  servings: number;
  calories: number | null;
  tags: string[];
  photo_path: string | null;
  source_url: string | null;
  created_at: number;
  ingredients: RecipeIngredient[];
}

export const RecipeIngredientInputSchema = z.object({
  quantity: z.number().nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
  ingredient: z.string().min(1).max(200),
  notes: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().default(0),
});
export type RecipeIngredientInput = z.infer<typeof RecipeIngredientInputSchema>;

export const RecipeInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  prep_mins: z.number().int().min(0).default(0),
  cook_mins: z.number().int().min(0).default(0),
  servings: z.number().int().min(1).default(4),
  calories: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string().max(50)).default([]),
  photo_path: z.string().max(500).nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  ingredients: z.array(RecipeIngredientInputSchema).default([]),
});
export type RecipeInput = z.infer<typeof RecipeInputSchema>;

export const RecipeUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  prep_mins: z.number().int().min(0).optional(),
  cook_mins: z.number().int().min(0).optional(),
  servings: z.number().int().min(1).optional(),
  calories: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string().max(50)).optional(),
  photo_path: z.string().max(500).nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  ingredients: z.array(RecipeIngredientInputSchema).optional(),
});
export type RecipeUpdate = z.infer<typeof RecipeUpdateSchema>;

// ─── Meal Plan ──────────────────────────────────────────────────────────────

export interface MealPlanEntry {
  id: number;
  plan_date: string;
  slot_name: string;
  recipe_id: number | null;
  free_text: string | null;
  servings_override: number | null;
  recipe: Recipe | null;
}

export const MealPlanEntryInputSchema = z.object({
  plan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
  slot_name: z.string().min(1).max(100),
  recipe_id: z.number().int().positive().nullable().optional(),
  free_text: z.string().max(500).nullable().optional(),
  servings_override: z.number().int().positive().nullable().optional(),
});
export type MealPlanEntryInput = z.infer<typeof MealPlanEntryInputSchema>;

// ─── Shopping Item ──────────────────────────────────────────────────────────

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  ticked: number;
  added_by_profile_id: number | null;
  pending_approval: number;
  created_at: number;
}

export const ShoppingItemInputSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  ticked: z.number().int().min(0).max(1).optional().default(0),
  added_by_profile_id: z.number().int().positive().nullable().optional(),
  pending_approval: z.number().int().min(0).max(1).optional().default(0),
});
export type ShoppingItemInput = z.input<typeof ShoppingItemInputSchema>;

export const ShoppingItemUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  ticked: z.number().int().min(0).max(1).optional(),
  pending_approval: z.number().int().min(0).max(1).optional(),
});
export type ShoppingItemUpdate = z.infer<typeof ShoppingItemUpdateSchema>;

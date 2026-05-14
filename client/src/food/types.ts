export interface Ingredient {
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
  ingredients: Ingredient[];
}

export interface MealPlanEntry {
  id: number;
  plan_date: string; // YYYY-MM-DD
  slot_name: string;
  recipe_id: number | null;
  free_text: string | null;
  servings_override: number | null;
  recipe: Recipe | null;
}

export interface MealSlot {
  id: string;
  label: string;
  time: string;
}

export const DEFAULT_SLOTS: MealSlot[] = [
  { id: 'breakfast', label: 'Breakfast', time: '08:00' },
  { id: 'lunch', label: 'Lunch', time: '12:00' },
  { id: 'dinner', label: 'Dinner', time: '18:00' },
];

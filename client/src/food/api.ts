import apiFetch from '../api/client';
import type { Recipe, MealPlanEntry } from './types';

// ─── Recipes ────────────────────────────────────────────────────────────────

export function getRecipes(search?: string, tags?: string[]): Promise<Recipe[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (tags && tags.length > 0) params.set('tags', tags.join(','));
  const qs = params.toString();
  return apiFetch<Recipe[]>(`/api/v1/recipes${qs ? `?${qs}` : ''}`);
}

export function getRecipe(id: number): Promise<Recipe> {
  return apiFetch<Recipe>(`/api/v1/recipes/${id}`);
}

export function createRecipe(input: object): Promise<Recipe> {
  return apiFetch<Recipe>('/api/v1/recipes', { method: 'POST', body: input });
}

export function updateRecipe(id: number, input: object): Promise<Recipe> {
  return apiFetch<Recipe>(`/api/v1/recipes/${id}`, { method: 'PATCH', body: input });
}

export function deleteRecipe(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/recipes/${id}`, { method: 'DELETE' });
}

// ─── Meal Plan ──────────────────────────────────────────────────────────────

export function getMealPlan(start: string, end: string): Promise<MealPlanEntry[]> {
  return apiFetch<MealPlanEntry[]>(`/api/v1/meal-plan?start=${start}&end=${end}`);
}

export interface MealPlanEntryInput {
  plan_date: string;
  slot_name: string;
  recipe_id?: number | null;
  free_text?: string | null;
  servings_override?: number | null;
}

export function setMealPlanEntry(input: MealPlanEntryInput): Promise<MealPlanEntry> {
  return apiFetch<MealPlanEntry>('/api/v1/meal-plan', { method: 'POST', body: input });
}

export function deleteMealPlanEntry(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/meal-plan/${id}`, { method: 'DELETE' });
}

import BaseRepository from './BaseRepository';
import {
  MealPlanEntryInputSchema,
  type MealPlanEntry,
  type MealPlanEntryInput,
  type Recipe,
} from '../types/food';

interface MealPlanRow {
  id: number;
  plan_date: string;
  slot_name: string;
  recipe_id: number | null;
  free_text: string | null;
  servings_override: number | null;
  // Joined recipe fields (prefixed)
  r_id: number | null;
  r_title: string | null;
  r_description: string | null;
  r_prep_mins: number | null;
  r_cook_mins: number | null;
  r_servings: number | null;
  r_calories: number | null;
  r_tags_json: string | null;
  r_photo_path: string | null;
  r_source_url: string | null;
  r_created_at: number | null;
}

function toEntry(row: MealPlanRow): MealPlanEntry {
  let recipe: Recipe | null = null;
  if (row.r_id !== null && row.r_title !== null) {
    recipe = {
      id: row.r_id,
      title: row.r_title,
      description: row.r_description,
      prep_mins: row.r_prep_mins ?? 0,
      cook_mins: row.r_cook_mins ?? 0,
      servings: row.r_servings ?? 4,
      calories: row.r_calories,
      tags: JSON.parse(row.r_tags_json ?? '[]') as string[],
      photo_path: row.r_photo_path,
      source_url: row.r_source_url,
      created_at: row.r_created_at ?? 0,
      ingredients: [],
    };
  }
  return {
    id: row.id,
    plan_date: row.plan_date,
    slot_name: row.slot_name,
    recipe_id: row.recipe_id,
    free_text: row.free_text,
    servings_override: row.servings_override,
    recipe,
  };
}

const JOIN_SQL = `
  SELECT
    mp.id, mp.plan_date, mp.slot_name, mp.recipe_id, mp.free_text, mp.servings_override,
    r.id AS r_id, r.title AS r_title, r.description AS r_description,
    r.prep_mins AS r_prep_mins, r.cook_mins AS r_cook_mins, r.servings AS r_servings,
    r.calories AS r_calories, r.tags_json AS r_tags_json, r.photo_path AS r_photo_path,
    r.source_url AS r_source_url, r.created_at AS r_created_at
  FROM meal_plan mp
  LEFT JOIN recipes r ON r.id = mp.recipe_id
`;

export default class MealPlanRepository extends BaseRepository {
  listForRange(start: string, end: string): MealPlanEntry[] {
    const rows = this.all<MealPlanRow>(
      `${JOIN_SQL} WHERE mp.plan_date >= ? AND mp.plan_date <= ? ORDER BY mp.plan_date ASC, mp.slot_name ASC`,
      [start, end],
    );
    return rows.map(toEntry);
  }

  get(id: number): MealPlanEntry | undefined {
    const row = this.queryOne<MealPlanRow>(`${JOIN_SQL} WHERE mp.id = ?`, [id]);
    return row ? toEntry(row) : undefined;
  }

  create(input: MealPlanEntryInput): MealPlanEntry {
    const parsed = MealPlanEntryInputSchema.parse(input);
    const result = this.run(
      `INSERT INTO meal_plan (plan_date, slot_name, recipe_id, free_text, servings_override)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parsed.plan_date,
        parsed.slot_name,
        parsed.recipe_id ?? null,
        parsed.free_text ?? null,
        parsed.servings_override ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  delete(id: number): boolean {
    const result = this.run('DELETE FROM meal_plan WHERE id = ?', [id]);
    return result.changes > 0;
  }

  upsert(input: MealPlanEntryInput): MealPlanEntry {
    const parsed = MealPlanEntryInputSchema.parse(input);
    // Find existing entry for same plan_date + slot_name
    const existing = this.queryOne<{ id: number }>(
      'SELECT id FROM meal_plan WHERE plan_date = ? AND slot_name = ?',
      [parsed.plan_date, parsed.slot_name],
    );

    if (existing) {
      this.run(
        `UPDATE meal_plan SET recipe_id = ?, free_text = ?, servings_override = ?
         WHERE id = ?`,
        [
          parsed.recipe_id ?? null,
          parsed.free_text ?? null,
          parsed.servings_override ?? null,
          existing.id,
        ],
      );
      return this.get(existing.id)!;
    }

    return this.create(input);
  }
}

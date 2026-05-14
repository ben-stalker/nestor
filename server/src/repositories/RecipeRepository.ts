import BaseRepository from './BaseRepository';
import {
  RecipeInputSchema,
  RecipeUpdateSchema,
  type Recipe,
  type RecipeIngredient,
  type RecipeInput,
  type RecipeUpdate,
} from '../types/food';

interface RecipeRow {
  id: number;
  title: string;
  description: string | null;
  prep_mins: number;
  cook_mins: number;
  servings: number;
  calories: number | null;
  tags_json: string;
  photo_path: string | null;
  source_url: string | null;
  created_at: number;
}

interface IngredientRow {
  id: number;
  recipe_id: number;
  quantity: number | null;
  unit: string | null;
  ingredient: string;
  notes: string | null;
  sort_order: number;
}

function toRecipe(row: RecipeRow, ingredients: RecipeIngredient[] = []): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prep_mins: row.prep_mins,
    cook_mins: row.cook_mins,
    servings: row.servings,
    calories: row.calories,
    tags: JSON.parse(row.tags_json) as string[],
    photo_path: row.photo_path,
    source_url: row.source_url,
    created_at: row.created_at,
    ingredients,
  };
}

function toIngredient(row: IngredientRow): RecipeIngredient {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    quantity: row.quantity,
    unit: row.unit,
    ingredient: row.ingredient,
    notes: row.notes,
    sort_order: row.sort_order,
  };
}

export default class RecipeRepository extends BaseRepository {
  get(id: number): Recipe | undefined {
    const row = this.queryOne<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);
    if (!row) return undefined;
    const ingredientRows = this.all<IngredientRow>(
      'SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order ASC',
      [id],
    );
    return toRecipe(row, ingredientRows.map(toIngredient));
  }

  list(opts?: { search?: string; tags?: string[] }): Recipe[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts?.search) {
      conditions.push('title LIKE ?');
      params.push(`%${opts.search}%`);
    }

    if (opts?.tags && opts.tags.length > 0) {
      // Filter by each tag using LIKE on tags_json
      opts.tags.forEach((tag) => {
        conditions.push('tags_json LIKE ?');
        params.push(`%${tag}%`);
      });
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.all<RecipeRow>(
      `SELECT * FROM recipes ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows.map((r) => toRecipe(r, []));
  }

  create(input: RecipeInput): Recipe {
    const parsed = RecipeInputSchema.parse(input);
    const result = this.run(
      `INSERT INTO recipes
        (title, description, prep_mins, cook_mins, servings, calories, tags_json, photo_path, source_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsed.title,
        parsed.description ?? null,
        parsed.prep_mins,
        parsed.cook_mins,
        parsed.servings,
        parsed.calories ?? null,
        JSON.stringify(parsed.tags),
        parsed.photo_path ?? null,
        parsed.source_url ?? null,
        Date.now(),
      ],
    );
    const recipeId = result.lastInsertRowid as number;
    this.insertIngredients(recipeId, parsed.ingredients);
    return this.get(recipeId)!;
  }

  update(id: number, input: RecipeUpdate): Recipe | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;

    const parsed = RecipeUpdateSchema.parse(input);

    const sets: string[] = [];
    const params: unknown[] = [];

    const scalarFields: [keyof typeof parsed, string][] = [
      ['title', 'title'],
      ['description', 'description'],
      ['prep_mins', 'prep_mins'],
      ['cook_mins', 'cook_mins'],
      ['servings', 'servings'],
      ['calories', 'calories'],
      ['photo_path', 'photo_path'],
      ['source_url', 'source_url'],
    ];

    scalarFields.forEach(([key, col]) => {
      if (parsed[key] !== undefined) {
        sets.push(`${col} = ?`);
        params.push(parsed[key] as unknown);
      }
    });

    if (parsed.tags !== undefined) {
      sets.push('tags_json = ?');
      params.push(JSON.stringify(parsed.tags));
    }

    if (sets.length > 0) {
      params.push(id);
      this.run(`UPDATE recipes SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    if (parsed.ingredients !== undefined) {
      this.run('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      this.insertIngredients(id, parsed.ingredients);
    }

    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.run('DELETE FROM recipes WHERE id = ?', [id]);
    return result.changes > 0;
  }

  private insertIngredients(recipeId: number, ingredients: RecipeInput['ingredients']): void {
    ingredients.forEach((ing) => {
      this.run(
        `INSERT INTO recipe_ingredients (recipe_id, quantity, unit, ingredient, notes, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          ing.quantity ?? null,
          ing.unit ?? null,
          ing.ingredient,
          ing.notes ?? null,
          ing.sort_order,
        ],
      );
    });
  }
}

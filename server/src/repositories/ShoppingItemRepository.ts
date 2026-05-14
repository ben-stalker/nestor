import BaseRepository from './BaseRepository';
import {
  ShoppingItemInputSchema,
  ShoppingItemUpdateSchema,
  type ShoppingItem,
  type ShoppingItemInput,
  type ShoppingItemUpdate,
} from '../types/food';

interface ShoppingItemRow {
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

function toItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    ticked: row.ticked,
    added_by_profile_id: row.added_by_profile_id,
    pending_approval: row.pending_approval,
    created_at: row.created_at,
  };
}

export default class ShoppingItemRepository extends BaseRepository {
  list(): ShoppingItem[] {
    const rows = this.all<ShoppingItemRow>('SELECT * FROM shopping_items ORDER BY created_at DESC');
    return rows.map(toItem);
  }

  get(id: number): ShoppingItem | undefined {
    const row = this.queryOne<ShoppingItemRow>('SELECT * FROM shopping_items WHERE id = ?', [id]);
    return row ? toItem(row) : undefined;
  }

  create(input: ShoppingItemInput): ShoppingItem {
    const parsed = ShoppingItemInputSchema.parse(input);
    const result = this.run(
      `INSERT INTO shopping_items
        (name, quantity, unit, category, ticked, added_by_profile_id, pending_approval, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsed.name,
        parsed.quantity ?? null,
        parsed.unit ?? null,
        parsed.category ?? null,
        parsed.ticked,
        parsed.added_by_profile_id ?? null,
        parsed.pending_approval,
        Date.now(),
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, input: ShoppingItemUpdate): ShoppingItem | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;

    const parsed = ShoppingItemUpdateSchema.parse(input);
    const sets: string[] = [];
    const params: unknown[] = [];

    const fields: [keyof typeof parsed, string][] = [
      ['name', 'name'],
      ['quantity', 'quantity'],
      ['unit', 'unit'],
      ['category', 'category'],
      ['ticked', 'ticked'],
      ['pending_approval', 'pending_approval'],
    ];

    fields.forEach(([key, col]) => {
      if (parsed[key] !== undefined) {
        sets.push(`${col} = ?`);
        params.push(parsed[key] as unknown);
      }
    });

    if (sets.length === 0) return existing;
    params.push(id);
    this.run(`UPDATE shopping_items SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.get(id);
  }

  delete(id: number): boolean {
    const result = this.run('DELETE FROM shopping_items WHERE id = ?', [id]);
    return result.changes > 0;
  }

  clearTicked(): number {
    const result = this.run('DELETE FROM shopping_items WHERE ticked = 1');
    return result.changes;
  }
}

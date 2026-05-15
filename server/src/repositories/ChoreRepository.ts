import BaseRepository from './BaseRepository';
import type { Chore, ChoreInput, ChoreUpdate } from '../types/family';

interface ChoreRow {
  id: number;
  name: string;
  description: string | null;
  assigned_profile_id: number | null;
  points: number;
  frequency: string;
  recurring_rule: string | null;
  active: number;
  sort_order: number;
  created_at: number;
}

function fromRow(row: ChoreRow): Chore {
  return {
    ...row,
    frequency: row.frequency as Chore['frequency'],
    active: row.active === 1,
  };
}

export default class ChoreRepository extends BaseRepository {
  list(filter: { assigned_profile_id?: number; includeInactive?: boolean } = {}): Chore[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (!filter.includeInactive) {
      conditions.push('active = 1');
    }
    if (filter.assigned_profile_id !== undefined) {
      conditions.push('assigned_profile_id = ?');
      params.push(filter.assigned_profile_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.all<ChoreRow>(
      `SELECT * FROM chores ${where} ORDER BY sort_order, id`,
      params,
    );
    return rows.map(fromRow);
  }

  get(id: number): Chore | undefined {
    const row = this.queryOne<ChoreRow>('SELECT * FROM chores WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  countAssigned(profileId: number): number {
    const result = this.queryOne<{ n: number }>(
      'SELECT COUNT(*) AS n FROM chores WHERE assigned_profile_id = ? AND active = 1',
      [profileId],
    );
    return result?.n ?? 0;
  }

  create(input: ChoreInput & { points: number; sort_order: number }): Chore {
    const result = this.run(
      `INSERT INTO chores
         (name, description, assigned_profile_id, points, frequency, recurring_rule, active, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        input.name,
        input.description ?? null,
        input.assigned_profile_id ?? null,
        input.points,
        input.frequency,
        input.recurring_rule ?? null,
        input.sort_order,
        Date.now(),
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: ChoreUpdate): Chore | undefined {
    const fields = Object.keys(patch) as (keyof ChoreUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'active') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE chores SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM chores WHERE id = ?', [id]);
  }
}

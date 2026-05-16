import BaseRepository from './BaseRepository';
import type { CountdownTimer, CountdownTimerInput, CountdownTimerUpdate } from '../types/board';

interface CountdownRow {
  id: number;
  name: string;
  target_date: number;
  show_on_home: number;
  savings_goal_id: number | null;
  created_at: number;
}

function fromRow(row: CountdownRow): CountdownTimer {
  return {
    ...row,
    show_on_home: row.show_on_home === 1,
  };
}

export default class CountdownRepository extends BaseRepository {
  list(): CountdownTimer[] {
    const rows = this.all<CountdownRow>(
      'SELECT * FROM countdown_timers ORDER BY target_date ASC',
    );
    return rows.map(fromRow);
  }

  listForHome(): CountdownTimer[] {
    const rows = this.all<CountdownRow>(
      'SELECT * FROM countdown_timers WHERE show_on_home = 1 ORDER BY target_date ASC',
    );
    return rows.map(fromRow);
  }

  get(id: number): CountdownTimer | undefined {
    const row = this.queryOne<CountdownRow>('SELECT * FROM countdown_timers WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: CountdownTimerInput): CountdownTimer {
    const result = this.run(
      'INSERT INTO countdown_timers (name, target_date, show_on_home, savings_goal_id) VALUES (?, ?, ?, ?)',
      [input.name, input.target_date, input.show_on_home ? 1 : 0, input.savings_goal_id ?? null],
    );
    const row = this.queryOne<CountdownRow>('SELECT * FROM countdown_timers WHERE id = ?', [
      result.lastInsertRowid as number,
    ])!;
    return fromRow(row);
  }

  update(id: number, patch: CountdownTimerUpdate): CountdownTimer | undefined {
    const fields = Object.keys(patch) as (keyof CountdownTimerUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'show_on_home') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE countdown_timers SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM countdown_timers WHERE id = ?', [id]);
  }
}

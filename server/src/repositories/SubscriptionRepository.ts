import BaseRepository from './BaseRepository';
import type { Subscription, SubscriptionInput, SubscriptionUpdate } from '../types/house';

interface SubscriptionRow {
  id: number;
  name: string;
  category: string;
  monthly_cost: number;
  renewal_date: number;
  trial_end_date: number | null;
  alert_days_before: number;
  active: number;
}

function fromRow(row: SubscriptionRow): Subscription {
  return {
    ...row,
    category: row.category as Subscription['category'],
    active: row.active === 1,
  };
}

export default class SubscriptionRepository extends BaseRepository {
  list(activeOnly = true): Subscription[] {
    const where = activeOnly ? 'WHERE active = 1' : '';
    const rows = this.all<SubscriptionRow>(
      `SELECT * FROM subscriptions ${where} ORDER BY renewal_date`,
    );
    return rows.map(fromRow);
  }

  get(id: number): Subscription | undefined {
    const row = this.queryOne<SubscriptionRow>('SELECT * FROM subscriptions WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: SubscriptionInput): Subscription {
    const result = this.run(
      `INSERT INTO subscriptions
         (name, category, monthly_cost, renewal_date, trial_end_date, alert_days_before)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.category,
        input.monthly_cost,
        input.renewal_date,
        input.trial_end_date ?? null,
        input.alert_days_before,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: SubscriptionUpdate): Subscription | undefined {
    const fields = Object.keys(patch) as (keyof SubscriptionUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'active') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE subscriptions SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('UPDATE subscriptions SET active = 0 WHERE id = ?', [id]);
  }

  findRenewingWithin(days: number): Subscription[] {
    const now = Date.now();
    const cutoff = now + days * 24 * 60 * 60 * 1000;
    const rows = this.all<SubscriptionRow>(
      'SELECT * FROM subscriptions WHERE active = 1 AND renewal_date BETWEEN ? AND ? ORDER BY renewal_date',
      [now, cutoff],
    );
    return rows.map(fromRow);
  }

  findTrialEndingWithin(days: number): Subscription[] {
    const now = Date.now();
    const cutoff = now + days * 24 * 60 * 60 * 1000;
    const rows = this.all<SubscriptionRow>(
      'SELECT * FROM subscriptions WHERE active = 1 AND trial_end_date IS NOT NULL AND trial_end_date BETWEEN ? AND ? ORDER BY trial_end_date',
      [now, cutoff],
    );
    return rows.map(fromRow);
  }
}

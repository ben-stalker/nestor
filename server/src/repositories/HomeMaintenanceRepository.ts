import BaseRepository from './BaseRepository';
import type {
  HomeMaintenance,
  HomeMaintenanceInput,
  HomeMaintenanceUpdate,
  MaintenanceType,
} from '../types/house';

interface HomeMaintenanceRow {
  id: number;
  title: string;
  type: string;
  completed_date: number | null;
  next_due_date: number | null;
  cost: number | null;
  contact_id: number | null;
  landlord_report: number;
  renter_mode: number;
  notes: string | null;
}

function fromRow(row: HomeMaintenanceRow): HomeMaintenance {
  return {
    ...row,
    type: row.type as MaintenanceType,
    landlord_report: row.landlord_report === 1,
    renter_mode: row.renter_mode === 1,
  };
}

export default class HomeMaintenanceRepository extends BaseRepository {
  list(type?: MaintenanceType): HomeMaintenance[] {
    const where = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];
    const rows = this.all<HomeMaintenanceRow>(
      `SELECT * FROM home_maintenance ${where} ORDER BY next_due_date ASC, id DESC`,
      params,
    );
    return rows.map(fromRow);
  }

  get(id: number): HomeMaintenance | undefined {
    const row = this.queryOne<HomeMaintenanceRow>('SELECT * FROM home_maintenance WHERE id = ?', [
      id,
    ]);
    return row ? fromRow(row) : undefined;
  }

  create(input: HomeMaintenanceInput): HomeMaintenance {
    const result = this.run(
      `INSERT INTO home_maintenance
         (title, type, completed_date, next_due_date, cost, contact_id,
          landlord_report, renter_mode, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.type,
        input.completed_date ?? null,
        input.next_due_date ?? null,
        input.cost ?? null,
        input.contact_id ?? null,
        input.landlord_report ? 1 : 0,
        input.renter_mode ? 1 : 0,
        input.notes ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: HomeMaintenanceUpdate): HomeMaintenance | undefined {
    const boolFields = new Set(['landlord_report', 'renter_mode']);
    const fields = Object.keys(patch) as (keyof HomeMaintenanceUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (boolFields.has(f)) return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE home_maintenance SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM home_maintenance WHERE id = ?', [id]);
  }
}

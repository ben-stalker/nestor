import BaseRepository from './BaseRepository';
import type { Vehicle, VehicleInput, VehicleUpdate } from '../types/vehicles';

interface VehicleRow {
  id: number;
  nickname: string;
  type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  colour: string | null;
  photo_path: string | null;
  mot_due: number | null;
  tax_due: number | null;
  insurance_due: number | null;
  service_due: number | null;
  service_due_mileage: number | null;
  current_mileage: number | null;
  active: number;
}

function fromRow(row: VehicleRow): Vehicle {
  return {
    ...row,
    type: row.type as Vehicle['type'],
    active: row.active === 1,
  };
}

export default class VehicleRepository extends BaseRepository {
  list(includeInactive = false): Vehicle[] {
    const rows = this.all<VehicleRow>(
      `SELECT * FROM vehicles${includeInactive ? '' : ' WHERE active = 1'} ORDER BY nickname`,
    );
    return rows.map(fromRow);
  }

  get(id: number): Vehicle | undefined {
    const row = this.queryOne<VehicleRow>('SELECT * FROM vehicles WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: VehicleInput): Vehicle {
    const result = this.run(
      `INSERT INTO vehicles (nickname, type, make, model, year, registration, colour,
        mot_due, tax_due, insurance_due, service_due, service_due_mileage, current_mileage, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        input.nickname,
        input.type,
        input.make ?? null,
        input.model ?? null,
        input.year ?? null,
        input.registration ?? null,
        input.colour ?? null,
        input.mot_due ?? null,
        input.tax_due ?? null,
        input.insurance_due ?? null,
        input.service_due ?? null,
        input.service_due_mileage ?? null,
        input.current_mileage ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: VehicleUpdate): Vehicle | undefined {
    const fields = Object.keys(patch) as (keyof VehicleUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (f === 'active') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE vehicles SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM vehicles WHERE id = ?', [id]);
  }
}

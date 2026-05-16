import BaseRepository from './BaseRepository';
import type { MeterReading, MeterReadingInput, FuelType } from '../types/house';

interface MeterReadingRow {
  id: number;
  fuel_type: string;
  reading_date: number;
  value: number;
  unit: string;
  cost_per_unit: number | null;
  notes: string | null;
}

function fromRow(row: MeterReadingRow): MeterReading {
  return {
    ...row,
    fuel_type: row.fuel_type as FuelType,
  };
}

export default class MeterReadingRepository extends BaseRepository {
  listByFuelType(fuelType: string): MeterReading[] {
    const rows = this.all<MeterReadingRow>(
      'SELECT * FROM meter_readings WHERE fuel_type = ? ORDER BY reading_date DESC',
      [fuelType],
    );
    return rows.map(fromRow);
  }

  get(id: number): MeterReading | undefined {
    const row = this.queryOne<MeterReadingRow>('SELECT * FROM meter_readings WHERE id = ?', [id]);
    return row ? fromRow(row) : undefined;
  }

  create(input: MeterReadingInput): MeterReading {
    const result = this.run(
      `INSERT INTO meter_readings (fuel_type, reading_date, value, unit, cost_per_unit, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.fuel_type,
        input.reading_date,
        input.value,
        input.unit,
        input.cost_per_unit ?? null,
        input.notes ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: Partial<MeterReadingInput>): MeterReading | undefined {
    const fields = Object.keys(patch) as (keyof MeterReadingInput)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => patch[f] ?? null);
    this.run(`UPDATE meter_readings SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM meter_readings WHERE id = ?', [id]);
  }
}

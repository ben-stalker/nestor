import BaseRepository from './BaseRepository';
import type { FuelLog, FuelLogInput } from '../types/vehicles';

export default class FuelLogRepository extends BaseRepository {
  listForVehicle(vehicleId: number): FuelLog[] {
    return this.all<FuelLog>('SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY date DESC', [
      vehicleId,
    ]);
  }

  get(id: number): FuelLog | undefined {
    return this.queryOne<FuelLog>('SELECT * FROM fuel_logs WHERE id = ?', [id]);
  }

  create(vehicleId: number, input: FuelLogInput): FuelLog {
    const result = this.run(
      'INSERT INTO fuel_logs (vehicle_id, date, litres, cost_minor, mileage) VALUES (?, ?, ?, ?, ?)',
      [vehicleId, input.date, input.litres, input.cost_minor, input.mileage ?? null],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: Partial<FuelLogInput>): FuelLog | undefined {
    const fields = Object.keys(patch) as (keyof FuelLogInput)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => patch[f] ?? null);
    this.run(`UPDATE fuel_logs SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM fuel_logs WHERE id = ?', [id]);
  }
}

import BaseRepository from './BaseRepository';
import type { EvChargingLog, EvChargingLogInput, EvChargingLogUpdate, MonthlyEvSummary } from '../types/ev';

export default class EvChargingRepository extends BaseRepository {
  listForVehicle(vehicleId: number): EvChargingLog[] {
    return this.all<EvChargingLog>(
      'SELECT * FROM ev_charging_log WHERE vehicle_id = ? ORDER BY session_date DESC',
      [vehicleId],
    );
  }

  listAll(): EvChargingLog[] {
    return this.all<EvChargingLog>('SELECT * FROM ev_charging_log ORDER BY session_date DESC');
  }

  listForMonth(year: number, month: number, vehicleId?: number): EvChargingLog[] {
    const start = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const end = Math.floor(new Date(year, month, 1).getTime() / 1000);
    if (vehicleId !== undefined) {
      return this.all<EvChargingLog>(
        'SELECT * FROM ev_charging_log WHERE vehicle_id = ? AND session_date >= ? AND session_date < ? ORDER BY session_date DESC',
        [vehicleId, start, end],
      );
    }
    return this.all<EvChargingLog>(
      'SELECT * FROM ev_charging_log WHERE session_date >= ? AND session_date < ? ORDER BY session_date DESC',
      [start, end],
    );
  }

  monthlyTotals(vehicleId?: number): MonthlyEvSummary[] {
    const sql = `SELECT
      CAST(strftime('%Y', datetime(session_date, 'unixepoch')) AS INTEGER) AS year,
      CAST(strftime('%m', datetime(session_date, 'unixepoch')) AS INTEGER) AS month,
      ROUND(SUM(kwh), 2) AS total_kwh,
      COALESCE(SUM(cost_minor), 0) AS total_cost_minor,
      COUNT(*) AS session_count
    FROM ev_charging_log
    ${vehicleId !== undefined ? 'WHERE vehicle_id = ?' : ''}
    GROUP BY year, month
    ORDER BY year DESC, month DESC
    LIMIT 12`;
    return this.all<MonthlyEvSummary>(sql, vehicleId !== undefined ? [vehicleId] : []);
  }

  get(id: number): EvChargingLog | undefined {
    return this.queryOne<EvChargingLog>('SELECT * FROM ev_charging_log WHERE id = ?', [id]) ?? undefined;
  }

  create(input: EvChargingLogInput): EvChargingLog {
    const result = this.run(
      `INSERT INTO ev_charging_log (vehicle_id, session_date, kwh, cost_minor, location, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.vehicle_id,
        input.session_date,
        input.kwh,
        input.cost_minor ?? null,
        input.location ?? null,
        input.notes ?? null,
      ],
    );
    return this.get(result.lastInsertRowid as number)!;
  }

  update(id: number, patch: EvChargingLogUpdate): EvChargingLog | undefined {
    const fields = Object.keys(patch) as (keyof EvChargingLogUpdate)[];
    if (fields.length === 0) return this.get(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => patch[f] ?? null);
    this.run(`UPDATE ev_charging_log SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.get(id);
  }

  delete(id: number): void {
    this.run('DELETE FROM ev_charging_log WHERE id = ?', [id]);
  }
}

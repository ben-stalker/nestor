import BaseRepository from './BaseRepository';

export type FuelType = 'electricity' | 'gas';

export interface ConsumptionRow {
  id: number;
  fuel_type: FuelType;
  interval_start: number;
  interval_end: number;
  kwh: number;
  created_at: number;
}

export interface UpsertParams {
  fuelType: FuelType;
  intervalStart: number;
  intervalEnd: number;
  kwh: number;
}

export interface DailyTotal {
  date: string;
  kwh: number;
}

class OctopusConsumptionRepository extends BaseRepository {
  upsert(row: UpsertParams): void {
    this.run(
      `INSERT OR REPLACE INTO octopus_consumption (fuel_type, interval_start, interval_end, kwh)
       VALUES (?, ?, ?, ?)`,
      [row.fuelType, row.intervalStart, row.intervalEnd, row.kwh],
    );
  }

  listForRange(fuelType: FuelType, fromEpoch: number, toEpoch: number): ConsumptionRow[] {
    return this.all<ConsumptionRow>(
      `SELECT * FROM octopus_consumption
       WHERE fuel_type = ? AND interval_start >= ? AND interval_start <= ?
       ORDER BY interval_start ASC`,
      [fuelType, fromEpoch, toEpoch],
    );
  }

  latestIntervalStart(fuelType: FuelType): number | null {
    const row = this.queryOne<{ max_start: number | null }>(
      `SELECT MAX(interval_start) AS max_start FROM octopus_consumption WHERE fuel_type = ?`,
      [fuelType],
    );
    return row?.max_start ?? null;
  }

  dailyTotals(fuelType: FuelType, days: number): DailyTotal[] {
    return this.all<DailyTotal>(
      `SELECT date(interval_start, 'unixepoch') AS date, SUM(kwh) AS kwh
       FROM octopus_consumption
       WHERE fuel_type = ?
         AND interval_start >= unixepoch('now', ? || ' days')
       GROUP BY date(interval_start, 'unixepoch')
       ORDER BY date ASC`,
      [fuelType, `-${days}`],
    );
  }
}

export default OctopusConsumptionRepository;

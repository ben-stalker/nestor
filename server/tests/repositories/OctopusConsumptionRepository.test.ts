import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import OctopusConsumptionRepository from '../../src/repositories/OctopusConsumptionRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

// Unix epoch helpers
const T0 = 1_700_000_000; // arbitrary anchor
const HALF_HOUR = 1800;

function makeInterval(offset: number) {
  return {
    intervalStart: T0 + offset * HALF_HOUR,
    intervalEnd: T0 + (offset + 1) * HALF_HOUR,
    kwh: 0.5 + offset * 0.1,
  };
}

describe('OctopusConsumptionRepository', () => {
  let db: Database.Database;
  let repo: OctopusConsumptionRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new OctopusConsumptionRepository(db);
  });

  afterEach(() => db.close());

  // ------------------------------------------------------------------ upsert
  describe('upsert', () => {
    it('inserts a new electricity row', () => {
      const interval = makeInterval(0);
      repo.upsert({ fuelType: 'electricity', ...interval });

      const rows = repo.listForRange('electricity', T0, T0 + HALF_HOUR);
      expect(rows).toHaveLength(1);
      expect(rows[0].kwh).toBeCloseTo(0.5);
      expect(rows[0].fuel_type).toBe('electricity');
    });

    it('inserts a new gas row', () => {
      const interval = makeInterval(0);
      repo.upsert({ fuelType: 'gas', ...interval });

      const rows = repo.listForRange('gas', T0, T0 + HALF_HOUR);
      expect(rows).toHaveLength(1);
      expect(rows[0].fuel_type).toBe('gas');
    });

    it('replaces existing row with same fuel_type + interval_start', () => {
      const interval = makeInterval(0);
      repo.upsert({ fuelType: 'electricity', ...interval });
      repo.upsert({ fuelType: 'electricity', ...interval, kwh: 9.9 });

      const rows = repo.listForRange('electricity', T0, T0 + HALF_HOUR);
      expect(rows).toHaveLength(1);
      expect(rows[0].kwh).toBeCloseTo(9.9);
    });

    it('electricity and gas can share the same interval_start without conflict', () => {
      const interval = makeInterval(0);
      repo.upsert({ fuelType: 'electricity', ...interval });
      repo.upsert({ fuelType: 'gas', ...interval });

      expect(repo.listForRange('electricity', T0, T0 + HALF_HOUR)).toHaveLength(1);
      expect(repo.listForRange('gas', T0, T0 + HALF_HOUR)).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------- listForRange
  describe('listForRange', () => {
    beforeEach(() => {
      [0, 1, 2, 3, 4].forEach((i) => {
        repo.upsert({ fuelType: 'electricity', ...makeInterval(i) });
      });
    });

    it('returns rows within the range in ascending order', () => {
      const rows = repo.listForRange('electricity', T0 + HALF_HOUR, T0 + 3 * HALF_HOUR);
      // offsets 1, 2, 3 all have interval_start within [T0+1800, T0+5400]
      expect(rows).toHaveLength(3);
      expect(rows[0].interval_start).toBe(T0 + HALF_HOUR);
      expect(rows[2].interval_start).toBe(T0 + 3 * HALF_HOUR);
    });

    it('returns empty array when no rows in range', () => {
      const rows = repo.listForRange('electricity', T0 + 100 * HALF_HOUR, T0 + 200 * HALF_HOUR);
      expect(rows).toHaveLength(0);
    });

    it('does not return rows for the other fuel type', () => {
      repo.upsert({ fuelType: 'gas', ...makeInterval(0) });
      const elecRows = repo.listForRange('electricity', T0, T0 + 10 * HALF_HOUR);
      elecRows.forEach((r) => expect(r.fuel_type).toBe('electricity'));
    });
  });

  // -------------------------------------------------------- latestIntervalStart
  describe('latestIntervalStart', () => {
    it('returns null when table is empty for fuel type', () => {
      expect(repo.latestIntervalStart('electricity')).toBeNull();
    });

    it('returns null for gas when only electricity rows exist', () => {
      repo.upsert({ fuelType: 'electricity', ...makeInterval(0) });
      expect(repo.latestIntervalStart('gas')).toBeNull();
    });

    it('returns the maximum interval_start for electricity', () => {
      [0, 1, 2].forEach((i) => repo.upsert({ fuelType: 'electricity', ...makeInterval(i) }));
      expect(repo.latestIntervalStart('electricity')).toBe(T0 + 2 * HALF_HOUR);
    });

    it('returns the maximum interval_start for gas independently', () => {
      repo.upsert({ fuelType: 'electricity', ...makeInterval(10) });
      repo.upsert({ fuelType: 'gas', ...makeInterval(3) });
      expect(repo.latestIntervalStart('gas')).toBe(T0 + 3 * HALF_HOUR);
    });
  });

  // ------------------------------------------------------------- dailyTotals
  describe('dailyTotals', () => {
    it('returns empty array when no data', () => {
      expect(repo.dailyTotals('electricity', 7)).toHaveLength(0);
    });

    it('aggregates kWh per calendar day', () => {
      // Use real recent epochs so the "last N days" window includes them
      const today = Math.floor(Date.now() / 1000);
      const daySeconds = 86400;
      // Two slots yesterday
      repo.upsert({
        fuelType: 'electricity',
        intervalStart: today - daySeconds,
        intervalEnd: today - daySeconds + HALF_HOUR,
        kwh: 1.0,
      });
      repo.upsert({
        fuelType: 'electricity',
        intervalStart: today - daySeconds + HALF_HOUR,
        intervalEnd: today - daySeconds + 2 * HALF_HOUR,
        kwh: 2.0,
      });

      const totals = repo.dailyTotals('electricity', 7);
      expect(totals.length).toBeGreaterThanOrEqual(1);
      const yesterday = totals.find((t) => t.kwh > 0);
      expect(yesterday).toBeDefined();
      expect(yesterday!.kwh).toBeCloseTo(3.0);
    });

    it('does not include rows outside the day window', () => {
      // Insert a row 60 days ago — should not appear in a 7-day window
      const today = Math.floor(Date.now() / 1000);
      repo.upsert({
        fuelType: 'electricity',
        intervalStart: today - 60 * 86400,
        intervalEnd: today - 60 * 86400 + HALF_HOUR,
        kwh: 99.9,
      });

      const totals = repo.dailyTotals('electricity', 7);
      const hasOldRow = totals.some((t) => t.kwh > 90);
      expect(hasOldRow).toBe(false);
    });

    it('keeps gas and electricity totals separate', () => {
      const today = Math.floor(Date.now() / 1000);
      repo.upsert({
        fuelType: 'electricity',
        intervalStart: today - 86400,
        intervalEnd: today - 86400 + HALF_HOUR,
        kwh: 5.0,
      });
      repo.upsert({
        fuelType: 'gas',
        intervalStart: today - 86400,
        intervalEnd: today - 86400 + HALF_HOUR,
        kwh: 10.0,
      });

      const elecTotals = repo.dailyTotals('electricity', 7);
      const gasTotals = repo.dailyTotals('gas', 7);
      expect(elecTotals.some((t) => Math.abs(t.kwh - 5.0) < 0.01)).toBe(true);
      expect(gasTotals.some((t) => Math.abs(t.kwh - 10.0) < 0.01)).toBe(true);
    });
  });
});

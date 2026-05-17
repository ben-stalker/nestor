import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import EvChargingRepository from '../../src/repositories/EvChargingRepository';
import VehicleRepository from '../../src/repositories/VehicleRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

function makeVehicle(db: Database.Database, type: 'ev' | 'car' = 'ev') {
  const repo = new VehicleRepository(db);
  return repo.create({ nickname: 'Test EV', type });
}

describe('EvChargingRepository', () => {
  let db: Database.Database;
  let repo: EvChargingRepository;
  let vehicleId: number;

  beforeEach(() => {
    db = makeDb();
    repo = new EvChargingRepository(db);
    vehicleId = makeVehicle(db).id;
  });

  afterEach(() => db.close());

  it('creates and retrieves a charging session', () => {
    const session = repo.create({
      vehicle_id: vehicleId,
      session_date: 1700000000,
      kwh: 30.5,
      cost_minor: 850,
      location: 'Home',
      notes: null,
    });
    expect(session.id).toBeGreaterThan(0);
    expect(session.kwh).toBe(30.5);
    expect(session.cost_minor).toBe(850);
    expect(session.location).toBe('Home');
  });

  it('lists sessions for a vehicle', () => {
    const v2Id = makeVehicle(db).id;
    repo.create({ vehicle_id: vehicleId, session_date: 1700000000, kwh: 20 });
    repo.create({ vehicle_id: v2Id, session_date: 1700000100, kwh: 40 });

    const list = repo.listForVehicle(vehicleId);
    expect(list).toHaveLength(1);
    expect(list[0].kwh).toBe(20);
  });

  it('listAll returns all sessions', () => {
    const v2Id = makeVehicle(db).id;
    repo.create({ vehicle_id: vehicleId, session_date: 1700000000, kwh: 20 });
    repo.create({ vehicle_id: v2Id, session_date: 1700000100, kwh: 40 });
    expect(repo.listAll()).toHaveLength(2);
  });

  it('listForMonth filters by month', () => {
    // Jan 2026
    const jan = Math.floor(new Date(2026, 0, 15).getTime() / 1000);
    // Feb 2026
    const feb = Math.floor(new Date(2026, 1, 15).getTime() / 1000);
    repo.create({ vehicle_id: vehicleId, session_date: jan, kwh: 10 });
    repo.create({ vehicle_id: vehicleId, session_date: feb, kwh: 20 });

    const janList = repo.listForMonth(2026, 1);
    expect(janList).toHaveLength(1);
    expect(janList[0].kwh).toBe(10);
  });

  it('monthlyTotals aggregates correctly', () => {
    const jan1 = Math.floor(new Date(2026, 0, 10).getTime() / 1000);
    const jan2 = Math.floor(new Date(2026, 0, 20).getTime() / 1000);
    repo.create({ vehicle_id: vehicleId, session_date: jan1, kwh: 15, cost_minor: 400 });
    repo.create({ vehicle_id: vehicleId, session_date: jan2, kwh: 20, cost_minor: 500 });

    const totals = repo.monthlyTotals(vehicleId);
    expect(totals).toHaveLength(1);
    expect(totals[0].total_kwh).toBe(35);
    expect(totals[0].total_cost_minor).toBe(900);
    expect(totals[0].session_count).toBe(2);
  });

  it('monthlyTotals without vehicleId sums all', () => {
    const v2Id = makeVehicle(db).id;
    const jan = Math.floor(new Date(2026, 0, 15).getTime() / 1000);
    repo.create({ vehicle_id: vehicleId, session_date: jan, kwh: 10, cost_minor: 300 });
    repo.create({ vehicle_id: v2Id, session_date: jan, kwh: 20, cost_minor: 600 });

    const totals = repo.monthlyTotals();
    expect(totals[0].total_cost_minor).toBe(900);
  });

  it('updates a session', () => {
    const s = repo.create({ vehicle_id: vehicleId, session_date: 1700000000, kwh: 10 });
    const updated = repo.update(s.id, { kwh: 25, notes: 'public charger' });
    expect(updated?.kwh).toBe(25);
    expect(updated?.notes).toBe('public charger');
  });

  it('deletes a session', () => {
    const s = repo.create({ vehicle_id: vehicleId, session_date: 1700000000, kwh: 10 });
    repo.delete(s.id);
    expect(repo.get(s.id)).toBeUndefined();
  });

  it('cascades delete when vehicle is removed', () => {
    repo.create({ vehicle_id: vehicleId, session_date: 1700000000, kwh: 10 });
    const vehicleRepo = new VehicleRepository(db);
    vehicleRepo.delete(vehicleId);
    expect(repo.listAll()).toHaveLength(0);
  });
});

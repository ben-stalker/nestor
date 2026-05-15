import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import VehicleRepository from '../../src/repositories/VehicleRepository';
import VehicleBookingRepository from '../../src/repositories/VehicleBookingRepository';
import FuelLogRepository from '../../src/repositories/FuelLogRepository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

// ─── VehicleRepository ───────────────────────────────────────────────────────

describe('VehicleRepository', () => {
  let db: Database.Database;
  let repo: VehicleRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new VehicleRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves a vehicle', () => {
    const v = repo.create({ nickname: 'Family Car', type: 'car' });
    expect(v.id).toBeGreaterThan(0);
    expect(v.nickname).toBe('Family Car');
    expect(v.type).toBe('car');
    expect(v.active).toBe(true);
  });

  it('lists only active vehicles by default', () => {
    repo.create({ nickname: 'Active', type: 'car' });
    const inactive = repo.create({ nickname: 'Inactive', type: 'van' });
    repo.update(inactive.id, { active: false });
    expect(repo.list()).toHaveLength(1);
    expect(repo.list(true)).toHaveLength(2);
  });

  it('updates fields', () => {
    const v = repo.create({ nickname: 'Bike', type: 'bicycle' });
    const updated = repo.update(v.id, { nickname: 'Road Bike', colour: 'blue' });
    expect(updated?.nickname).toBe('Road Bike');
    expect(updated?.colour).toBe('blue');
  });

  it('deletes a vehicle', () => {
    const v = repo.create({ nickname: 'Old Car', type: 'car' });
    repo.delete(v.id);
    expect(repo.get(v.id)).toBeUndefined();
  });

  it('update with empty patch returns existing vehicle', () => {
    const v = repo.create({ nickname: 'Car', type: 'car' });
    const result = repo.update(v.id, {});
    expect(result?.id).toBe(v.id);
  });
});

// ─── VehicleBookingRepository ────────────────────────────────────────────────

describe('VehicleBookingRepository', () => {
  let db: Database.Database;
  let vehicleRepo: VehicleRepository;
  let bookingRepo: VehicleBookingRepository;
  let vehicleId: number;

  const T = (offset: number): number => 1_000_000 + offset * 60_000;

  beforeEach(() => {
    db = makeDb();
    vehicleRepo = new VehicleRepository(db);
    bookingRepo = new VehicleBookingRepository(db);
    vehicleId = vehicleRepo.create({ nickname: 'Car', type: 'car' }).id;
  });

  afterEach(() => {
    db.close();
  });

  function book(start: number, end: number): number {
    return bookingRepo.create(vehicleId, { start_datetime: start, end_datetime: end }).id;
  }

  it('creates and retrieves a booking', () => {
    const b = bookingRepo.create(vehicleId, {
      start_datetime: T(0),
      end_datetime: T(60),
      notes: 'test',
    });
    expect(b.id).toBeGreaterThan(0);
    expect(b.vehicle_id).toBe(vehicleId);
    expect(b.business).toBe(false);
  });

  it('detects overlapping booking', () => {
    book(T(0), T(60));
    const conflicts = bookingRepo.findConflicts(vehicleId, T(30), T(90));
    expect(conflicts).toHaveLength(1);
  });

  it('contained booking is a conflict', () => {
    book(T(0), T(120));
    expect(bookingRepo.findConflicts(vehicleId, T(30), T(90))).toHaveLength(1);
  });

  it('surrounding booking is a conflict', () => {
    book(T(30), T(90));
    expect(bookingRepo.findConflicts(vehicleId, T(0), T(120))).toHaveLength(1);
  });

  it('touching at boundary is NOT a conflict', () => {
    book(T(0), T(60));
    expect(bookingRepo.findConflicts(vehicleId, T(60), T(120))).toHaveLength(0);
  });

  it('adjacent before boundary is NOT a conflict', () => {
    book(T(60), T(120));
    expect(bookingRepo.findConflicts(vehicleId, T(0), T(60))).toHaveLength(0);
  });

  it('excludeBookingId excludes self', () => {
    const id = book(T(0), T(60));
    expect(bookingRepo.findConflicts(vehicleId, T(0), T(60), id)).toHaveLength(0);
  });

  it('excludeBookingId still detects other conflicts', () => {
    const id = book(T(0), T(60));
    book(T(30), T(90));
    expect(bookingRepo.findConflicts(vehicleId, T(0), T(60), id)).toHaveLength(1);
  });

  it('listForVehicle filters by range', () => {
    book(T(0), T(60));
    book(T(120), T(180));
    const results = bookingRepo.listForVehicle(vehicleId, T(50), T(130));
    expect(results).toHaveLength(2);
  });

  it('deletes a booking', () => {
    const id = book(T(0), T(60));
    bookingRepo.delete(id);
    expect(bookingRepo.get(id)).toBeUndefined();
  });

  it('cascade deletes bookings when vehicle deleted', () => {
    const id = book(T(0), T(60));
    vehicleRepo.delete(vehicleId);
    expect(bookingRepo.get(id)).toBeUndefined();
  });
});

// ─── FuelLogRepository ───────────────────────────────────────────────────────

describe('FuelLogRepository', () => {
  let db: Database.Database;
  let vehicleRepo: VehicleRepository;
  let fuelRepo: FuelLogRepository;
  let vehicleId: number;

  beforeEach(() => {
    db = makeDb();
    vehicleRepo = new VehicleRepository(db);
    fuelRepo = new FuelLogRepository(db);
    vehicleId = vehicleRepo.create({ nickname: 'Car', type: 'car' }).id;
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves fuel log', () => {
    const entry = fuelRepo.create(vehicleId, {
      date: Date.now(),
      litres: 40.5,
      cost_minor: 6200,
      mileage: 50000,
    });
    expect(entry.litres).toBe(40.5);
    expect(entry.cost_minor).toBe(6200);
    expect(entry.vehicle_id).toBe(vehicleId);
  });

  it('lists fuel logs in descending date order', () => {
    fuelRepo.create(vehicleId, { date: 1000, litres: 30, cost_minor: 5000 });
    fuelRepo.create(vehicleId, { date: 2000, litres: 35, cost_minor: 5500 });
    const logs = fuelRepo.listForVehicle(vehicleId);
    expect(logs[0].date).toBe(2000);
  });

  it('deletes fuel log', () => {
    const entry = fuelRepo.create(vehicleId, { date: Date.now(), litres: 20, cost_minor: 3000 });
    fuelRepo.delete(entry.id);
    expect(fuelRepo.get(entry.id)).toBeUndefined();
  });

  it('cascade deletes fuel logs when vehicle deleted', () => {
    const entry = fuelRepo.create(vehicleId, { date: Date.now(), litres: 20, cost_minor: 3000 });
    vehicleRepo.delete(vehicleId);
    expect(fuelRepo.get(entry.id)).toBeUndefined();
  });
});

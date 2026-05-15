import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../../src/db/migrationRunner';
import AppSettingsRepository from '../../../src/repositories/AppSettingsRepository';
import VehicleRepository from '../../../src/repositories/VehicleRepository';
import AlertRepository from '../../../src/repositories/AlertRepository';
import { initCrypto } from '../../../src/utils/crypto';
import evaluateReminders from '../../../src/services/vehicles/reminders';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function daysFromNow(now: Date, days: number): number {
  return now.getTime() + days * 86_400_000;
}

describe('evaluateReminders', () => {
  let db: Database.Database;
  let vehicleRepo: VehicleRepository;
  let alertRepo: AlertRepository;
  let now: Date;

  beforeEach(() => {
    db = makeDb();
    vehicleRepo = new VehicleRepository(db);
    alertRepo = new AlertRepository(db);
    now = new Date('2024-06-01T00:05:00Z');
  });

  afterEach(() => {
    db.close();
  });

  it('pushes alert when MOT is exactly 30 days away', async () => {
    vehicleRepo.create({
      nickname: 'Family Car',
      type: 'car',
      mot_due: daysFromNow(now, 30),
    });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    const alerts = alertRepo.listActive();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('MOT');
    expect(alerts[0].severity).toBe('info');
  });

  it('pushes nothing when MOT is 31 days away (not in window)', async () => {
    vehicleRepo.create({
      nickname: 'Family Car',
      type: 'car',
      mot_due: daysFromNow(now, 31),
    });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });

  it('uses error severity when MOT is 1 day away', async () => {
    vehicleRepo.create({
      nickname: 'Family Car',
      type: 'car',
      mot_due: daysFromNow(now, 1),
    });
    await evaluateReminders(vehicleRepo, alertRepo, now);
    const alerts = alertRepo.listActive();
    expect(alerts[0].severity).toBe('error');
    expect(alerts[0].message).toContain('1 day');
  });

  it('uses warning severity when MOT is 7 days away', async () => {
    vehicleRepo.create({
      nickname: 'Family Car',
      type: 'car',
      mot_due: daysFromNow(now, 7),
    });
    await evaluateReminders(vehicleRepo, alertRepo, now);
    const alerts = alertRepo.listActive();
    expect(alerts[0].severity).toBe('warning');
  });

  it('per-vehicle override [60, 30] fires at 60 days (not default window)', async () => {
    const v = vehicleRepo.create({
      nickname: 'Custom Car',
      type: 'car',
      mot_due: daysFromNow(now, 60),
    });
    vehicleRepo.update(v.id, { reminder_overrides_json: { mot: [60, 30] } });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    const alerts = alertRepo.listActive();
    expect(alerts[0].message).toContain('60 days');
  });

  it('per-vehicle override suppresses default window days', async () => {
    // With override [60, 30], a MOT 14 days away should NOT fire (14 is in default but not override)
    const v = vehicleRepo.create({
      nickname: 'Custom Car',
      type: 'car',
      mot_due: daysFromNow(now, 14),
    });
    vehicleRepo.update(v.id, { reminder_overrides_json: { mot: [60, 30] } });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });

  it('triggers mileage-based service reminder when within 500 miles', async () => {
    vehicleRepo.create({
      nickname: 'Service Car',
      type: 'car',
      service_due_mileage: 55000,
      current_mileage: 54600, // 400 miles remaining — within 500
    });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    const alerts = alertRepo.listActive();
    expect(alerts[0].message).toContain('service due within 500 miles');
  });

  it('does not trigger mileage reminder when more than 500 miles away', async () => {
    vehicleRepo.create({
      nickname: 'Service Car',
      type: 'car',
      service_due_mileage: 55000,
      current_mileage: 54400, // 600 miles remaining — outside 500
    });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });

  it('dedup blocks second push of same alert type', async () => {
    vehicleRepo.create({
      nickname: 'Family Car',
      type: 'car',
      mot_due: daysFromNow(now, 30),
    });
    // First run
    const first = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(first.pushed).toBe(1);
    // Second run same day — should not push again
    const second = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(second.pushed).toBe(0);
  });

  it('dedup blocks mileage reminder on same day', async () => {
    vehicleRepo.create({
      nickname: 'Service Car',
      type: 'car',
      service_due_mileage: 55000,
      current_mileage: 54600,
    });
    const first = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(first.pushed).toBe(1);
    const second = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(second.pushed).toBe(0);
  });

  it('bicycle skips mot check', async () => {
    vehicleRepo.create({
      nickname: 'My Bike',
      type: 'bicycle',
      mot_due: daysFromNow(now, 30),
    });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });

  it('bicycle can still get service reminders', async () => {
    vehicleRepo.create({
      nickname: 'My Bike',
      type: 'bicycle',
      service_due: daysFromNow(now, 7),
    });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(1);
    const alerts = alertRepo.listActive();
    expect(alerts[0].message).toContain('SERVICE');
  });

  it('skips inactive vehicles', async () => {
    const v = vehicleRepo.create({
      nickname: 'Old Car',
      type: 'car',
      mot_due: daysFromNow(now, 30),
    });
    vehicleRepo.update(v.id, { active: false });
    const result = await evaluateReminders(vehicleRepo, alertRepo, now);
    expect(result.pushed).toBe(0);
  });
});

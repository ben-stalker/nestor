import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import VehicleRepository from '../../src/repositories/VehicleRepository';
import EvChargingRepository from '../../src/repositories/EvChargingRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import evaluateEvPlugInAlerts from '../../src/services/evAlertService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

const todayDayOfWeek = new Date().getDay();
const reminderTime = `${String(new Date().getHours()).padStart(2, '0')}:00`; // current hour

describe('evAlertService', () => {
  let db: Database.Database;
  let vehicleRepo: VehicleRepository;
  let evRepo: EvChargingRepository;
  let alertRepo: AlertRepository;

  beforeEach(() => {
    db = makeDb();
    vehicleRepo = new VehicleRepository(db);
    evRepo = new EvChargingRepository(db);
    alertRepo = new AlertRepository(db);
  });

  afterEach(() => db.close());

  it('creates plug-in alert for EV with reminder due today', () => {
    const v = vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
    vehicleRepo.update(v.id, {
      plug_in_reminder_time: reminderTime,
      plug_in_reminder_days: [todayDayOfWeek],
    });

    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    const alerts = alertRepo.listActive();
    expect(alerts.some((a) => a.type === `ev_plug_in:${v.id}`)).toBe(true);
  });

  it('does not create alert for non-EV vehicle', () => {
    const v = vehicleRepo.create({ nickname: 'Car', type: 'car' });
    vehicleRepo.update(v.id, {
      plug_in_reminder_time: reminderTime,
      plug_in_reminder_days: [todayDayOfWeek],
    });

    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    expect(alertRepo.listActive()).toHaveLength(0);
  });

  it('does not create alert when today is not in reminder days', () => {
    const v = vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
    const notToday = (todayDayOfWeek + 1) % 7;
    vehicleRepo.update(v.id, {
      plug_in_reminder_time: reminderTime,
      plug_in_reminder_days: [notToday],
    });

    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    expect(alertRepo.listActive()).toHaveLength(0);
  });

  it('does not create alert when vehicle is snoozed', () => {
    const v = vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
    const midnight = Math.floor(new Date().setHours(23, 59, 59, 0) / 1000);
    vehicleRepo.update(v.id, {
      plug_in_reminder_time: reminderTime,
      plug_in_reminder_days: [todayDayOfWeek],
      plug_in_snoozed_until: midnight,
    });

    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    expect(alertRepo.listActive()).toHaveLength(0);
  });

  it('does not create alert when charged today', () => {
    const v = vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
    vehicleRepo.update(v.id, {
      plug_in_reminder_time: reminderTime,
      plug_in_reminder_days: [todayDayOfWeek],
    });
    // log a session for today
    evRepo.create({ vehicle_id: v.id, session_date: Math.floor(Date.now() / 1000), kwh: 20 });

    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    expect(alertRepo.listActive()).toHaveLength(0);
  });

  it('deduplicates alerts on repeated evaluation', () => {
    const v = vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
    vehicleRepo.update(v.id, {
      plug_in_reminder_time: reminderTime,
      plug_in_reminder_days: [todayDayOfWeek],
    });

    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    const alerts = alertRepo.listActive().filter((a) => a.type === `ev_plug_in:${v.id}`);
    expect(alerts).toHaveLength(1);
  });

  it('does not create alert when no reminder set', () => {
    vehicleRepo.create({ nickname: 'Leaf', type: 'ev' });
    evaluateEvPlugInAlerts(vehicleRepo, evRepo, alertRepo);
    expect(alertRepo.listActive()).toHaveLength(0);
  });
});

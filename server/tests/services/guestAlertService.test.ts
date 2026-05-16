import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import AlertRepository from '../../src/repositories/AlertRepository';
import ChecklistRepository from '../../src/repositories/ChecklistRepository';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import { initCrypto } from '../../src/utils/crypto';
import evaluateGuestAlerts from '../../src/services/guestAlertService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

describe('evaluateGuestAlerts', () => {
  let db: Database.Database;
  let checklistRepo: ChecklistRepository;
  let alertRepo: AlertRepository;

  beforeEach(() => {
    db = makeDb();
    checklistRepo = new ChecklistRepository(db);
    alertRepo = new AlertRepository(db);
  });

  it('creates alert when guest arrives in 7 days with incomplete items', () => {
    const checklist = checklistRepo.create({
      name: 'Guest visit',
      type: 'one_off',
      guest_name: 'Mum',
      guest_arrival_date: daysFromNow(7),
    });
    checklistRepo.createItem(checklist.id, { text: 'Prepare room', sort_order: 0 });

    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('guest_arrival');
    expect(alerts[0].message).toContain('Mum');
    expect(alerts[0].message).toContain('7 days');
  });

  it('creates alert when guest arrives in 1 day with high severity', () => {
    const checklist = checklistRepo.create({
      name: 'Guest visit',
      type: 'one_off',
      guest_name: 'Dad',
      guest_arrival_date: daysFromNow(1),
    });
    checklistRepo.createItem(checklist.id, { text: 'Fresh towels', sort_order: 0 });

    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('error');
  });

  it('does not create alert when all items are ticked', () => {
    const checklist = checklistRepo.create({
      name: 'Guest visit',
      type: 'one_off',
      guest_name: 'Friend',
      guest_arrival_date: daysFromNow(7),
    });
    const item = checklistRepo.createItem(checklist.id, { text: 'Room ready', sort_order: 0 });
    checklistRepo.tickItem(item.id, true);

    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(0);
  });

  it('does not create duplicate alerts', () => {
    const checklist = checklistRepo.create({
      name: 'Guest visit',
      type: 'one_off',
      guest_name: 'Sis',
      guest_arrival_date: daysFromNow(7),
    });
    checklistRepo.createItem(checklist.id, { text: 'Prepare', sort_order: 0 });

    evaluateGuestAlerts(checklistRepo, alertRepo);
    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(1);
  });

  it('does not create alert for non-threshold days (e.g. 4 days)', () => {
    const checklist = checklistRepo.create({
      name: 'Guest visit',
      type: 'one_off',
      guest_name: 'Uncle',
      guest_arrival_date: daysFromNow(4),
    });
    checklistRepo.createItem(checklist.id, { text: 'Prepare', sort_order: 0 });

    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(0);
  });

  it('ignores checklists without guest_name', () => {
    checklistRepo.create({
      name: 'Not a guest checklist',
      type: 'one_off',
    });

    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(0);
  });

  it('ignores checklists without guest_arrival_date', () => {
    const checklist = checklistRepo.create({
      name: 'No date',
      type: 'one_off',
      guest_name: 'Nobody',
    });
    checklistRepo.createItem(checklist.id, { text: 'Task', sort_order: 0 });

    evaluateGuestAlerts(checklistRepo, alertRepo);

    const alerts = alertRepo.listActive();
    expect(alerts.length).toBe(0);
  });
});

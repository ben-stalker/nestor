import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from '../../src/db/migrationRunner';
import { initCrypto } from '../../src/utils/crypto';
import AppSettingsRepository from '../../src/repositories/AppSettingsRepository';
import BinScheduleRepository from '../../src/repositories/BinScheduleRepository';
import AlertRepository from '../../src/repositories/AlertRepository';
import evaluateBinAlerts from '../../src/services/binAlertService';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, MIGRATIONS_DIR);
  initCrypto(new AppSettingsRepository(db));
  return db;
}

describe('evaluateBinAlerts', () => {
  it('creates a morning-of alert when collection is within 12h', () => {
    const db = makeDb();
    const binRepo = new BinScheduleRepository(db);
    const alertRepo = new AlertRepository(db);

    const today = new Date();
    const dow = today.getDay();
    // anchor is today (a known collection date)
    binRepo.create({
      name: 'General',
      colour: '#000',
      icon: 'trash',
      day_of_week: dow,
      frequency_weeks: 1,
      anchor_date: new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: true,
      audio_chime: false,
    });

    evaluateBinAlerts(binRepo, alertRepo);
    const alerts = alertRepo.listActive();
    const binAlert = alerts.find((a) => a.type === 'bin_day');
    expect(binAlert).toBeDefined();
    db.close();
  });

  it('creates an evening-before alert when collection is 12-24h away', () => {
    const db = makeDb();
    const binRepo = new BinScheduleRepository(db);
    const alertRepo = new AlertRepository(db);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dow = tomorrow.getDay();

    binRepo.create({
      name: 'Recycling',
      colour: '#00f',
      icon: 'recycle',
      day_of_week: dow,
      frequency_weeks: 1,
      anchor_date: tomorrow.getTime(),
      bank_holiday_shift: false,
      reminder_evening_before: true,
      reminder_morning_of: false,
      audio_chime: false,
    });

    evaluateBinAlerts(binRepo, alertRepo);
    const alerts = alertRepo.listActive();
    const binAlert = alerts.find((a) => a.type === 'bin_day');
    expect(binAlert).toBeDefined();
    db.close();
  });

  it('does not create duplicate alert on second evaluation', () => {
    const db = makeDb();
    const binRepo = new BinScheduleRepository(db);
    const alertRepo = new AlertRepository(db);

    const today = new Date();
    const dow = today.getDay();
    binRepo.create({
      name: 'General',
      colour: '#000',
      icon: 'trash',
      day_of_week: dow,
      frequency_weeks: 1,
      anchor_date: new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: true,
      audio_chime: false,
    });

    evaluateBinAlerts(binRepo, alertRepo);
    evaluateBinAlerts(binRepo, alertRepo);
    const alerts = alertRepo.listActive().filter((a) => a.type === 'bin_day');
    expect(alerts).toHaveLength(1);
    db.close();
  });

  it('does not create alert when reminders are disabled', () => {
    const db = makeDb();
    const binRepo = new BinScheduleRepository(db);
    const alertRepo = new AlertRepository(db);

    const today = new Date();
    const dow = today.getDay();
    binRepo.create({
      name: 'Quiet Bin',
      colour: '#000',
      icon: 'trash',
      day_of_week: dow,
      frequency_weeks: 1,
      anchor_date: new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: false,
      audio_chime: false,
    });

    evaluateBinAlerts(binRepo, alertRepo);
    const alerts = alertRepo.listActive().filter((a) => a.type === 'bin_day');
    expect(alerts).toHaveLength(0);
    db.close();
  });

  it('does not create alert when collection is more than 24h away', () => {
    const db = makeDb();
    const binRepo = new BinScheduleRepository(db);
    const alertRepo = new AlertRepository(db);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);
    const dow = threeDaysFromNow.getDay();

    binRepo.create({
      name: 'Far Bin',
      colour: '#000',
      icon: 'trash',
      day_of_week: dow,
      frequency_weeks: 1,
      anchor_date: threeDaysFromNow.getTime(),
      bank_holiday_shift: false,
      reminder_evening_before: true,
      reminder_morning_of: true,
      audio_chime: false,
    });

    evaluateBinAlerts(binRepo, alertRepo);
    const alerts = alertRepo.listActive().filter((a) => a.type === 'bin_day');
    expect(alerts).toHaveLength(0);
    db.close();
  });

  it('handles multiple bins independently', () => {
    const db = makeDb();
    const binRepo = new BinScheduleRepository(db);
    const alertRepo = new AlertRepository(db);

    const today = new Date();
    const todayDow = today.getDay();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();

    binRepo.create({
      name: 'Bin A',
      colour: '#000',
      icon: 'trash',
      day_of_week: todayDow,
      frequency_weeks: 1,
      anchor_date: todayMidnight,
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: true,
      audio_chime: false,
    });
    binRepo.create({
      name: 'Bin B',
      colour: '#0f0',
      icon: 'recycle',
      day_of_week: todayDow,
      frequency_weeks: 1,
      anchor_date: todayMidnight,
      bank_holiday_shift: false,
      reminder_evening_before: false,
      reminder_morning_of: true,
      audio_chime: false,
    });

    evaluateBinAlerts(binRepo, alertRepo);
    const alerts = alertRepo.listActive().filter((a) => a.type === 'bin_day');
    expect(alerts).toHaveLength(2);
    db.close();
  });
});

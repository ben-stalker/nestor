/**
 * E2E test database seeder.
 *
 * Seeds a known state into the SQLite test DB including:
 * - app_settings with setup_complete = 'true'
 * - Admin profile with PIN "0000"
 * - Child profile (no PIN)
 * - A test alert
 * - A chore assigned to child profile
 * - A test event
 * - A bin schedule
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.NESTOR_DB_PATH ?? '/tmp/e2e-test.db';
const MIGRATIONS_DIR = path.join(__dirname, '../../server/migrations');

export interface SeedResult {
  adminProfileId: number;
  childProfileId: number;
  alertId: number;
  choreId: number;
  eventId: number;
  binScheduleId: number;
  vehicleId: number;
}

function runMigrations(db: Database.Database): void {
  const MIGRATION_FILENAME_RE = /^\d{3}_[a-z0-9_]+\.sql$/;
  const allFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => MIGRATION_FILENAME_RE.test(f))
    .sort();

  const bootstrapFile = allFiles.find((f) => f.startsWith('000_'));
  if (bootstrapFile) {
    const bootstrapSql = fs.readFileSync(path.join(MIGRATIONS_DIR, bootstrapFile), 'utf8');
    db.exec(bootstrapSql);
  }

  const applied = new Set<string>(
    db
      .prepare<[], { filename: string }>('SELECT filename FROM applied_migrations')
      .all()
      .map((r) => r.filename),
  );

  allFiles.forEach((filename) => {
    if (applied.has(filename)) return;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO applied_migrations (filename, applied_at) VALUES (?, ?)').run(
        filename,
        Date.now(),
      );
    })();
  });
}

export function seedTestDb(): SeedResult {
  // Remove old DB to start fresh
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  // App settings
  const settingsUpsert = db.prepare(
    'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
  );
  settingsUpsert.run('setup_complete', JSON.stringify(true), Date.now());
  settingsUpsert.run('language', JSON.stringify('en'), Date.now());
  settingsUpsert.run('locale', JSON.stringify('en-GB'), Date.now());
  settingsUpsert.run('timezone', JSON.stringify('Europe/London'), Date.now());

  // Admin profile with PIN "0000"
  const pinHash = bcrypt.hashSync('0000', 10);
  const adminResult = db
    .prepare(
      `INSERT INTO profiles (name, type, colour, pin_hash, permissions_json, text_size, simplified_nav, feed_alert_hours, conversion_rate, created_at)
       VALUES (?, 'admin', '#4f46e5', ?, '{}', 'default', 0, 4, 0, ?)`,
    )
    .run('Admin', pinHash, Date.now());
  const adminProfileId = adminResult.lastInsertRowid as number;

  // Child profile (no PIN)
  const childResult = db
    .prepare(
      `INSERT INTO profiles (name, type, colour, pin_hash, permissions_json, text_size, simplified_nav, feed_alert_hours, conversion_rate, created_at)
       VALUES (?, 'child', '#10b981', NULL, '{}', 'default', 0, 4, 0, ?)`,
    )
    .run('Alice', Date.now());
  const childProfileId = childResult.lastInsertRowid as number;

  // Test alert
  const alertResult = db
    .prepare(
      `INSERT INTO alerts (type, severity, message, nav_mode_badge, created_at)
       VALUES ('e2e_test', 'warning', 'E2E Test Alert — please dismiss me', 'home', ?)`,
    )
    .run(Date.now());
  const alertId = alertResult.lastInsertRowid as number;

  // Test chore assigned to child
  const choreResult = db
    .prepare(
      `INSERT INTO chores (name, description, assigned_profile_id, points, frequency, active, sort_order, created_at)
       VALUES ('E2E Test Chore', 'A chore for testing', ?, 5, 'daily', 1, 0, ?)`,
    )
    .run(childProfileId, Date.now());
  const choreId = choreResult.lastInsertRowid as number;

  // Test calendar event (uses calendar_events table)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const eventEnd = new Date(tomorrow);
  eventEnd.setHours(11, 0, 0, 0);

  const eventResult = db
    .prepare(
      `INSERT INTO calendar_events (title, start_datetime, end_datetime, all_day, profile_id, source, created_at)
       VALUES ('E2E Seed Event', ?, ?, 0, ?, 'local', ?)`,
    )
    .run(tomorrow.getTime(), eventEnd.getTime(), adminProfileId, Date.now());
  const eventId = eventResult.lastInsertRowid as number;

  // Test bin schedule — Monday weekly
  // Use a Monday anchor date
  const anchor = new Date('2024-01-01'); // A Monday
  const binResult = db
    .prepare(
      `INSERT INTO bin_schedules (name, colour, icon, day_of_week, frequency_weeks, anchor_date, bank_holiday_shift, reminder_evening_before, reminder_morning_of, audio_chime)
       VALUES ('General Waste', '#374151', 'trash', 1, 1, ?, 0, 0, 0, 0)`,
    )
    .run(anchor.getTime());
  const binScheduleId = binResult.lastInsertRowid as number;

  // Test vehicle
  const vehicleResult = db
    .prepare(
      `INSERT INTO vehicles (nickname, type, active)
       VALUES ('Family Car', 'car', 1)`,
    )
    .run();
  const vehicleId = vehicleResult.lastInsertRowid as number;

  db.close();

  return { adminProfileId, childProfileId, alertId, choreId, eventId, binScheduleId, vehicleId };
}

export function seedWizardDb(): void {
  // A separate DB path for wizard tests (setup_complete = false)
  const wizardDbPath = '/tmp/e2e-wizard-test.db';
  if (fs.existsSync(wizardDbPath)) {
    fs.unlinkSync(wizardDbPath);
  }

  const db = new Database(wizardDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);

  // Deliberately DO NOT set setup_complete so wizard shows
  db.close();
}

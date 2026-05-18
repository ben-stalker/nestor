'use strict';
/**
 * Seed the test SQLite database for CI (E2E tests and Lighthouse CI).
 * Plain CJS so it can run with `node` without tsx/ts-node.
 *
 * Deletes any existing file at DB_PATH and creates a fresh one with:
 *  - All migrations applied
 *  - setup_complete = true
 *  - Admin profile (PIN "0000")
 *  - Child profile "Alice" (no PIN)
 *  - Test alert "E2E Test Alert"
 *  - Test chore assigned to Alice
 *  - Test calendar event
 *  - Bin schedule (Monday)
 *  - Test vehicle
 *
 * Usage:
 *   NESTOR_DB_PATH=/tmp/e2e-test.db node scripts/seed-lhci.cjs
 */
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.NESTOR_DB_PATH || '/tmp/lhci.db';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'server', 'migrations');

// Fresh DB — delete existing file so we start clean
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  // WAL journal files
  [DB_PATH + '-wal', DB_PATH + '-shm'].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
}
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const allFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => /^\d{3}_[a-z0-9_]+\.sql$/.test(f))
  .sort();

// Bootstrap migration creates the applied_migrations table
const bootstrapFile = allFiles.find((f) => f.startsWith('000_'));
if (bootstrapFile) {
  db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, bootstrapFile), 'utf8'));
}

const applied = new Set(
  db
    .prepare('SELECT filename FROM applied_migrations')
    .all()
    .map((r) => r.filename),
);

for (const filename of allFiles) {
  if (applied.has(filename)) continue;
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
  db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO applied_migrations (filename, applied_at) VALUES (?, ?)').run(
      filename,
      Date.now(),
    );
  })();
}

const upsert = (key, value) =>
  db
    .prepare(
      'INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',
    )
    .run(key, JSON.stringify(value), Date.now());

upsert('setup_complete', true);
upsert('language', 'en');
upsert('locale', 'en-GB');
upsert('timezone', 'Europe/London');

// Admin profile with PIN "0000" — all permissions granted
const pinHash = bcrypt.hashSync('0000', 10);
const ALL_PERMISSIONS = [
  'view_calendar',
  'add_calendar_event',
  'edit_calendar_event',
  'delete_calendar_event',
  'view_food',
  'add_recipe',
  'add_to_shopping',
  'tick_shopping',
  'clear_shopping',
  'view_vehicles',
  'book_vehicle',
  'manage_vehicles',
  'view_chores',
  'complete_chore',
  'manage_chores',
  'view_health_log',
  'add_health_log',
  'view_finance',
  'manage_finance',
  'view_house',
  'manage_house',
  'view_pets',
  'manage_pets',
  'view_board',
  'post_board_message',
  'view_contacts',
  'manage_contacts',
  'manage_settings',
  'manage_plugins',
];
const adminPerms = JSON.stringify(Object.fromEntries(ALL_PERMISSIONS.map((k) => [k, true])));
const adminResult = db
  .prepare(
    `INSERT INTO profiles(name,type,colour,pin_hash,permissions_json,text_size,simplified_nav,feed_alert_hours,conversion_rate,created_at)
     VALUES(?,'admin','#4f46e5',?,?,'default',0,4,0,?)`,
  )
  .run('Admin', pinHash, adminPerms, Date.now());
const adminProfileId = adminResult.lastInsertRowid;

// Child profile (no PIN)
const childResult = db
  .prepare(
    `INSERT INTO profiles(name,type,colour,pin_hash,permissions_json,text_size,simplified_nav,feed_alert_hours,conversion_rate,created_at)
     VALUES(?,'child','#10b981',NULL,'{}','default',0,4,0,?)`,
  )
  .run('Alice', Date.now());
const childProfileId = childResult.lastInsertRowid;

// Test alert
db.prepare(
  `INSERT INTO alerts(type,severity,message,nav_mode_badge,created_at)
   VALUES('e2e_test','warning','E2E Test Alert — please dismiss me','home',?)`,
).run(Date.now());

// Test chore assigned to child
db.prepare(
  `INSERT INTO chores(name,description,assigned_profile_id,points,frequency,active,sort_order,created_at)
   VALUES('E2E Test Chore','A chore for testing',?,5,'daily',1,0,?)`,
).run(childProfileId, Date.now());

// Test calendar event (tomorrow 10–11)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);
const eventEnd = new Date(tomorrow);
eventEnd.setHours(11, 0, 0, 0);
db.prepare(
  `INSERT INTO calendar_events(title,start_datetime,end_datetime,all_day,profile_id,source,created_at)
   VALUES('E2E Seed Event',?,?,0,?,'local',?)`,
).run(tomorrow.getTime(), eventEnd.getTime(), adminProfileId, Date.now());

// Bin schedule (Monday)
db.prepare(
  `INSERT INTO bin_schedules(name,colour,icon,day_of_week,frequency_weeks,anchor_date,bank_holiday_shift,reminder_evening_before,reminder_morning_of,audio_chime)
   VALUES('General Waste','#374151','trash',1,1,?,0,0,0,0)`,
).run(new Date('2024-01-01').getTime());

// Test vehicle
db.prepare(`INSERT INTO vehicles(nickname,type,active) VALUES('Family Car','car',1)`).run();

db.close();
console.log(
  '[seed-ci] DB seeded at',
  DB_PATH,
  '— admin:',
  adminProfileId,
  'child:',
  childProfileId,
);

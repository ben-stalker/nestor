CREATE TABLE bin_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  colour TEXT NOT NULL DEFAULT '#4CAF50',
  icon TEXT NOT NULL DEFAULT 'trash',
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  frequency_weeks INTEGER NOT NULL CHECK(frequency_weeks IN (1,2,4)),
  anchor_date INTEGER NOT NULL,
  bank_holiday_shift INTEGER NOT NULL DEFAULT 1,
  reminder_evening_before INTEGER NOT NULL DEFAULT 1,
  reminder_morning_of INTEGER NOT NULL DEFAULT 0,
  audio_chime INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK(category IN ('streaming','software','services','other')),
  monthly_cost INTEGER NOT NULL,
  renewal_date INTEGER NOT NULL,
  trial_end_date INTEGER,
  alert_days_before INTEGER NOT NULL DEFAULT 7,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_subscriptions_renewal ON subscriptions(renewal_date);

CREATE TABLE home_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('job','warranty','reminder')),
  completed_date INTEGER,
  next_due_date INTEGER,
  cost INTEGER,
  contact_id INTEGER,
  landlord_report INTEGER NOT NULL DEFAULT 0,
  renter_mode INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
CREATE INDEX idx_home_maintenance_due ON home_maintenance(next_due_date);

CREATE TABLE meter_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fuel_type TEXT NOT NULL CHECK(fuel_type IN ('electricity','gas','oil','water')),
  reading_date INTEGER NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kWh',
  cost_per_unit REAL,
  notes TEXT
);
CREATE INDEX idx_meter_readings_date ON meter_readings(reading_date);

CREATE TABLE budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  monthly_budget_minor INTEGER NOT NULL DEFAULT 0,
  colour TEXT
);

CREATE TABLE budget_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  amount_minor INTEGER NOT NULL,
  spent_date INTEGER NOT NULL,
  note TEXT
);
CREATE INDEX idx_budget_expenses_date ON budget_expenses(spent_date);

CREATE TABLE checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('daily_reset','trip','one_off','recurring')),
  auto_reset_cron TEXT,
  template_id TEXT,
  last_reset_at INTEGER,
  guest_name TEXT,
  guest_arrival_date INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  ticked INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  section TEXT
);
CREATE INDEX idx_checklist_items_list ON checklist_items(checklist_id);

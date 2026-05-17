CREATE TABLE ev_charging_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  session_date INTEGER NOT NULL,
  kwh REAL NOT NULL,
  cost_minor INTEGER,
  location TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_ev_charging_vehicle ON ev_charging_log(vehicle_id);
CREATE INDEX idx_ev_charging_date ON ev_charging_log(session_date);

ALTER TABLE vehicles ADD COLUMN plug_in_reminder_time TEXT;
ALTER TABLE vehicles ADD COLUMN plug_in_reminder_days TEXT;
ALTER TABLE vehicles ADD COLUMN plug_in_snoozed_until INTEGER;

CREATE TABLE octopus_consumption (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fuel_type TEXT NOT NULL CHECK(fuel_type IN ('electricity','gas')),
  interval_start INTEGER NOT NULL,
  interval_end INTEGER NOT NULL,
  kwh REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX idx_octopus_consumption_interval ON octopus_consumption(fuel_type, interval_start);

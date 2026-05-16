CREATE TABLE IF NOT EXISTS pets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  species     TEXT    NOT NULL DEFAULT 'dog',
  breed       TEXT,
  dob         TEXT,
  colour      TEXT,
  microchip   TEXT,
  insurance_policy TEXT,
  vet_name    TEXT,
  vet_phone   TEXT,
  vet_address TEXT,
  feeding_notes TEXT,
  grooming_notes TEXT,
  photo_path  TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS pet_health_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id          INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  log_type        TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  notes           TEXT,
  log_date        TEXT    NOT NULL,
  next_due_date   TEXT,
  reminder_days_before INTEGER DEFAULT 7,
  weight_kg       REAL,
  document_path   TEXT,
  document_name   TEXT,
  linked_calendar_event_id INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_pet_health_next_due ON pet_health_logs(next_due_date) WHERE next_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pet_health_pet ON pet_health_logs(pet_id);

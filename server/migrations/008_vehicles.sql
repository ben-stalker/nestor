CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY,
  nickname TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('car','van','motorcycle','bicycle','ev')),
  make TEXT,
  model TEXT,
  year INTEGER,
  registration TEXT,
  colour TEXT,
  photo_path TEXT,
  mot_due INTEGER,
  tax_due INTEGER,
  insurance_due INTEGER,
  service_due INTEGER,
  service_due_mileage INTEGER,
  current_mileage INTEGER,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE vehicle_bookings (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  start_datetime INTEGER NOT NULL,
  end_datetime INTEGER NOT NULL,
  business INTEGER NOT NULL DEFAULT 0,
  miles REAL,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_vehicle_bookings_range
  ON vehicle_bookings(vehicle_id, start_datetime, end_datetime);

CREATE TABLE fuel_logs (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date INTEGER NOT NULL,
  litres REAL NOT NULL,
  cost_minor INTEGER NOT NULL,
  mileage INTEGER
);

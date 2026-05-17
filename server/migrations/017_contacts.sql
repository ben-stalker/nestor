CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT NOT NULL CHECK(category IN ('medical','school','pets','home_services','emergency','family','trade','other')),
  notes TEXT,
  linked_pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
  linked_vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_contacts_category ON contacts(category);

CREATE TABLE IF NOT EXISTS journeys (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id      INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label           TEXT    NOT NULL,
  origin          TEXT    NOT NULL,
  destination     TEXT    NOT NULL,
  transport_mode  TEXT    NOT NULL DEFAULT 'transit', -- transit | drive | walk | cycle
  days_active     INTEGER NOT NULL DEFAULT 127,        -- bitmask Sun(1)|Mon(2)|Tue(4)|Wed(8)|Thu(16)|Fri(32)|Sat(64)
  provider_id     TEXT,                               -- reserved for future transport adapters
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_journeys_profile ON journeys(profile_id);

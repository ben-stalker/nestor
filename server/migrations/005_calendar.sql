CREATE TABLE IF NOT EXISTS calendar_accounts (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  provider              TEXT    NOT NULL CHECK(provider IN ('google','apple','yahoo','custom')),
  display_name          TEXT    NOT NULL,
  caldav_url            TEXT,
  credentials_encrypted TEXT    NOT NULL,
  sync_interval_mins    INTEGER NOT NULL DEFAULT 15,
  last_sync_at          INTEGER,
  last_sync_error       TEXT,
  profile_id            INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  active                INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT    NOT NULL,
  start_datetime    INTEGER NOT NULL,
  end_datetime      INTEGER NOT NULL,
  all_day           INTEGER NOT NULL DEFAULT 0,
  profile_id        INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  source            TEXT    NOT NULL CHECK(source IN ('local','caldav','plugin')),
  caldav_uid        TEXT,
  caldav_etag       TEXT,
  account_id        INTEGER REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  type              TEXT    NOT NULL DEFAULT 'default' CHECK(type IN ('default','wfh','shift','nursery_drop','vehicle_booking','vet','custody','school_term')),
  recurring_rule    TEXT,
  colour_override   TEXT,
  notes             TEXT,
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_profile_date
  ON calendar_events(profile_id, start_datetime);

CREATE INDEX IF NOT EXISTS idx_events_account
  ON calendar_events(account_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_caldav_uid
  ON calendar_events(account_id, caldav_uid)
  WHERE caldav_uid IS NOT NULL;

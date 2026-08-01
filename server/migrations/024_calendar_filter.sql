-- Per-account calendar name filter: JSON array of calendar display names to include.
-- NULL means sync all calendars from the account.
ALTER TABLE calendar_accounts ADD COLUMN calendar_names_filter TEXT DEFAULT NULL;

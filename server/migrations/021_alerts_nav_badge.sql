ALTER TABLE alerts ADD COLUMN nav_mode_badge TEXT;
ALTER TABLE alerts ADD COLUMN read_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_alerts_nav_badge ON alerts(nav_mode_badge, dismissed, read_at);

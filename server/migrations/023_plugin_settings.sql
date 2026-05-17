-- Plugin settings: per-plugin encrypted key/value store.
-- Values are encrypted at the application layer using the same AES-256-GCM crypto used elsewhere.
CREATE TABLE IF NOT EXISTS plugin_settings (
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (plugin_id, key)
);

CREATE INDEX IF NOT EXISTS idx_plugin_settings_plugin
  ON plugin_settings (plugin_id);

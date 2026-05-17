-- Voice command log: every transcript the voice router sees, with match result.
CREATE TABLE IF NOT EXISTS voice_command_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  transcript TEXT NOT NULL,
  matched_handler TEXT,   -- null if unmatched/fell through
  response TEXT,          -- TTS response text, if any
  duration_ms INTEGER     -- STT + routing latency
);

CREATE INDEX IF NOT EXISTS idx_voice_command_log_created
  ON voice_command_log (created_at DESC);

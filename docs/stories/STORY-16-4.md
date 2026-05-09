# STORY-16.4: Plugin settings repository (encrypted)

**Epic:** EPIC-16: Plugin System & Official Plugins
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** `plugin_settings` per-plugin key/value with AES-256-GCM encryption
**So that** plugin secrets are stored safely

---

## Acceptance Criteria

- [ ] Migration creates `plugin_settings(plugin_id, key, value_encrypted, updated_at)` PK `(plugin_id, key)`
- [ ] Repo `get(pluginId, key)`, `set(pluginId, key, value)`, `delete(pluginId, key)`, `getAll(pluginId)`, `deleteAll(pluginId)`
- [ ] Encryption applied to all values via STORY-1.8; transparent on read
- [ ] Tests cover encrypt/decrypt round-trip + tamper detection

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_plugin_settings.sql`
- `server/src/repositories/PluginSettingsRepository.ts`
- `server/tests/repositories/PluginSettingsRepository.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE plugin_settings (
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (plugin_id, key)
);
```
2. Repo:
```ts
get(pluginId, key) {
  const row = this.db.prepare(`SELECT value_encrypted FROM plugin_settings WHERE plugin_id=? AND key=?`).get(pluginId, key);
  return row ? JSON.parse(decrypt(row.value_encrypted)) : null;
}
set(pluginId, key, value) {
  const enc = encrypt(JSON.stringify(value));
  this.db.prepare(`INSERT INTO plugin_settings(plugin_id, key, value_encrypted, updated_at) VALUES (?,?,?,?) ON CONFLICT(plugin_id,key) DO UPDATE SET value_encrypted=excluded.value_encrypted, updated_at=excluded.updated_at`).run(pluginId, key, enc, Date.now());
}
```
3. Tests: round-trip; tampered ciphertext throws; getAll returns map.

### Key technical details

- Architecture §"Component 2: Plugin Manager" + §"Data Encryption".
- Values stored as JSON-encoded encrypted text; supports any JSON value type.
- Disabling a plugin does NOT delete its settings (so re-enabling preserves config).

---

## Dependencies

- **Blocked by:** STORY-1.8, STORY-16.1
- **Blocks:** STORY-16.3 (admin panel saves through this), STORY-16.7+ (each plugin uses)

---

## Test Checklist

- [ ] Unit: set → get round-trip
- [ ] Unit: tampered ciphertext throws on read
- [ ] Unit: deleteAll removes all keys
- [ ] Unit: getAll returns key-value map
- [ ] Unit: PK conflict updates value

---

## Notes

- Schema is simple key-value to avoid plugin-author needing to design tables.
- Bulk operations (`getAll`, `deleteAll`) are useful at plugin enable/disable.

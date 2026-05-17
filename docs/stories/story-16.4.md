# STORY-16.4: Plugin settings repository (encrypted)

## Status: complete

## Tasks
- [x] Migration `023_plugin_settings.sql`: `plugin_settings(plugin_id, key, value_encrypted, updated_at)` PK(plugin_id, key)
- [x] `PluginSettingsRepository`: `get(pluginId, key)`, `set(pluginId, key, value)`, `delete(pluginId, key)`, `deleteAll(pluginId)`
- [x] All values encrypted at rest via `encrypt`/`decrypt` from `utils/crypto.ts`
- [x] Transparent decryption on read

## Implementation Notes
`server/src/repositories/PluginSettingsRepository.ts`
`server/migrations/023_plugin_settings.sql`

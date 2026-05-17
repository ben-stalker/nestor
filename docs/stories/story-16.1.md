# STORY-16.1: Plugin manifest schema + loader

## Status: complete

## Tasks
- [x] Zod schema for PluginManifest (id, name, version, author, description, capabilities[], settingsFields[], apiRisk)
- [x] On startup, scan `/plugins/*/manifest.json`, validate each manifest
- [x] Log warnings for invalid manifests, skip silently on missing
- [x] In-memory plugin registry (`pluginRegistry: Map<string, PluginRegistryEntry>`) with status: disabled|enabled|error
- [x] `app_settings.plugins_enabled` JSON array tracks enabled plugin IDs
- [x] `listPlugins()`, `getPlugin()`, `markStatus()` exports

## Implementation Notes
`server/src/services/pluginLoader.ts` — scans `<repoRoot>/plugins/*/manifest.json` at startup.
`server/src/types/plugins.ts` — Zod schemas for manifest and settings fields.

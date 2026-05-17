# STORY-16.2: NestorPluginContext + Plugin Manager runtime

## Status: complete

## Tasks
- [x] `NestorPluginContext` interface: `pushAlert`, `speak`, `addEvent`, `registerWidget`, `registerNavMode`, `registerVoiceHandler`, `registerSidebarFilter`, `registerCalendarSystem`, `getSetting`, `setSetting`, `httpRequest`, `logger`
- [x] `PluginManager.loadPlugin(id)` — requires plugin entry, calls `plugin.init(context)`, catches all errors
- [x] `PluginManager.enablePlugin(id)` / `disablePlugin(id)` — manages lifecycle
- [x] On disable: deregister all capabilities, dismiss plugin alerts, remove widgets
- [x] All context method calls wrapped in try/catch, errors logged with plugin ID
- [x] HTTP request rate limiting: 10 req/min per plugin
- [x] 10s timeout on `httpRequest`

## Implementation Notes
`server/src/services/pluginManager.ts`
Depends on pluginLoader, pluginRegistries, PluginSettingsRepository, AlertRepository.

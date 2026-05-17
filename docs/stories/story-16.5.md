# STORY-16.5: Capability registries

## Status: complete

## Tasks
- [x] Five typed registries: `widgetRegistry`, `navModeRegistry`, `sidebarFilterRegistry`, `voiceHandlerRegistry`, `calendarSystemRegistry`
- [x] Each backed by EventEmitter for change notifications
- [x] `register(id, def)` and `removeByPlugin(pluginId)` on each registry
- [x] `snapshot()` returns current state as arrays
- [x] Client hooks: `usePluginWidgets()`, `usePluginNavModes()`, `usePluginSidebarFilters()`
- [x] `GET /api/v1/plugins/registries` endpoint returns full snapshot

## Implementation Notes
`server/src/services/pluginRegistries.ts`
`client/src/plugins/hooks/usePlugins.ts` — `usePluginRegistries()`, `usePluginWidgets()`, etc.

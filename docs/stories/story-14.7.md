# STORY-14.7: Plugin-source alerts

## Status: complete

## Tasks
- [x] `NestorPluginContext.pushAlert(...)` proxies to `AlertRepository.create` with `type='plugin:<pluginId>'`
- [x] Alert deduplication: same `alertKey` won't re-fire while plugin is enabled (tracked per-plugin in `alertKeyCache`)
- [x] Disabling a plugin auto-dismisses its outstanding alerts via `dismissPluginAlerts()`
- [x] Restarting a plugin clears the alert key cache so alerts can re-fire

## Implementation Notes
Implemented as part of `NestorPluginContext.pushAlert` in `server/src/services/pluginManager.ts`.
`alertKeyCache: Map<string, Set<string>>` tracks used keys per plugin.

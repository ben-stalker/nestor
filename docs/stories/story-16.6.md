# STORY-16.6: Plugin error isolation + chaos test

## Status: complete

## Tasks
- [x] Any throw from plugin call sets `status='error'` and logs
- [x] Errored plugin's capabilities removed from all registries
- [x] Errored plugin shown in admin with "Disable" / "Restart" buttons
- [x] `POST /api/v1/plugins/:id/restart` re-loads the plugin after disabling
- [x] `plugins/_test-chaos/manifest.json` + `plugins/_test-chaos/index.js` — throws on init
- [x] Server tests verify core stays up after chaos plugin errors

## Implementation Notes
`plugins/_test-chaos/` — chaos plugin for testing error isolation.
Error handling is wired into `PluginManager.loadPlugin()`.

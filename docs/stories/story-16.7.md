# STORY-16.7: Tesla plugin — manifest + auth + battery widget

## Status: complete

## Tasks
- [x] `plugins/tesla/manifest.json`: capabilities `['home_screen_widget', 'alert_source', 'tts_announcements', 'settings_panel']`, `apiRisk: 'unofficial'`
- [x] Settings fields: `access_token` (password), `vehicle_id` (text), `low_battery_threshold` (number, default 20), `enable_alerts` (toggle), `enable_tts` (toggle)
- [x] `plugins/tesla/index.js` — plugin entry point
- [x] Polling job via scheduler: every 10 min when active, every 60 min when sleeping
- [x] Calls Tesla Fleet API `/api/1/vehicles/{id}/vehicle_data`
- [x] Registers `tesla_battery` home screen widget (battery %, range, charging status)
- [x] Server tests with mocked Tesla API

## Implementation Notes
`plugins/tesla/` — self-contained CommonJS plugin.
Uses `context.httpRequest()` for API calls (rate-limited, goes through plugin manager).

# STORY-16.9: Eufy plugin — cameras + doorbell + vacuum

## Status: complete

## Tasks
- [x] `plugins/eufy/manifest.json`: capabilities `['home_screen_widget', 'alert_source', 'tts_announcements', 'nav_mode']`, `apiRisk: 'unofficial'`
- [x] Settings: `username` (text), `password` (password), `enable_doorbell_alerts` (toggle), `enable_vacuum_status` (toggle)
- [x] Stub implementation with graceful load if `eufy-security-client` unavailable
- [x] Doorbell ring → pushAlert + optional TTS "Someone at the front door"
- [x] Vacuum status widget: idle/cleaning/docked/needs-emptying
- [x] Plugin loads without crashing even without hardware

## Implementation Notes
`plugins/eufy/` — stub implementation (full hardware integration requires `eufy-security-client`).
Uses try/require guard to avoid crashing if package not installed.

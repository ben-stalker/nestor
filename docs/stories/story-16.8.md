# STORY-16.8: Tesla plugin — alerts + TTS announcements

## Status: complete

## Tasks
- [x] Alert when battery < threshold + not plugged in: "Your Tesla battery is at X%"
- [x] TTS "Your car is fully charged" once per charge session (dedup with alertKey)
- [x] User-configurable: enable alerts (toggle), low_battery_threshold (number), enable_tts (toggle)
- [x] Alert dedup via `alertKey` so same alert doesn't fire repeatedly

## Implementation Notes
Implemented within `plugins/tesla/index.js` alongside STORY-16.7.

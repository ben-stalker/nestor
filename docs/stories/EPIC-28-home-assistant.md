# EPIC-28: Home Assistant Integration Plugin

**Status:** backlog  
**Priority:** 9

## Overview

Home Assistant is the dominant open-source home automation platform. A Nestor plugin that connects to a local HA instance gives users access to all their smart home devices and automations from the dashboard without needing to open a separate app.

## Stories

### STORY-28.1: Home Assistant API connection

- Plugin settings: HA base URL (e.g. `http://homeassistant.local:8123`), Long-Lived Access Token
- `GET /api/v1/plugins/homeassistant/entities` — fetches all HA entity states via `GET /api/states`
- WebSocket connection to HA for real-time state updates (`ws://ha/api/websocket`)
- Store last-known entity states in `ha_entity_states` table (entity_id, state, attributes JSON, last_changed)

### STORY-28.2: Entity widget strip

- Admin configures up to 6 entities to pin to the Home Screen widget strip
- Each pinned entity: icon (derived from HA domain), name, current state
- Tap to toggle (lights, switches) or view detail (sensors, climate)
- Supported domains: `light`, `switch`, `climate`, `sensor`, `binary_sensor`, `lock`, `cover`

### STORY-28.3: Entity control panel

- Full entity browser: grouped by HA area/floor
- Search by name
- Tap entity: inline control (on/off toggle, brightness slider for lights, temperature for climate, open/close for covers)
- Entity history sparkline (last 24h) for sensors

### STORY-28.4: Automations & scenes

- List HA scenes and scripts
- Tap to trigger a scene or script
- Pin favourite scenes to the home screen widget

### STORY-28.5: Alerts from HA

- Configure which HA `binary_sensor` entities trigger Nestor alerts (e.g. door open, leak detected, smoke alarm)
- Mapping: HA entity → Nestor alert with configurable message, severity, and TTS announcement

### STORY-28.6: Voice integration

- Register as a voice handler
- "Turn on the kitchen lights", "Set the thermostat to 20 degrees", "Run the bedtime scene"
- Commands routed to HA `call_service` API

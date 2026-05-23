# EPIC-24: Tesla Plugin v2 — Full Implementation

**Status:** backlog  
**Priority:** 5

## Overview

The existing Tesla plugin is a stub. This epic implements the full feature set per PRD Section 32.1: live vehicle data, home charging log, widget, alerts, and basic climate control.

## Stories

### STORY-24.1: Tesla API authentication

- Use `tesla-fleet-api` (official Fleet API, replacing deprecated owner API) or `teslajs` as fallback
- Plugin settings: Client ID, Client Secret, Refresh Token (obtained via Tesla developer portal)
- `POST /plugins/tesla/auth/refresh` endpoint to refresh access token on schedule
- Encrypted credential storage in plugin_settings table

### STORY-24.2: Live vehicle data

- Poll vehicle state every 5 minutes (configurable); skip if vehicle is asleep to preserve battery
- Store in `tesla_vehicle_state` table: battery %, range (miles/km per locale), charging state, charge limit, plugged-in status, climate on/off, odometer
- `GET /api/v1/plugins/tesla/status` returns latest cached state

### STORY-24.3: Home screen widget

Per PRD 32.1:
- Battery arc (SVG, 0–100%, colour: green >50%, amber 20–50%, red <20%)
- Range figure below arc (respects locale distance units)
- Charging status line: "Charging · 1h 23m to limit" / "Plugged in · Full" / "Not plugged in"
- Climate toggle button (on/off, shows current cabin temp)
- Tap widget → full Tesla detail page

### STORY-24.4: Alerts

- "Car not plugged in" alert: fires at configurable time in the evening if vehicle is home and not plugged in
- "Charge low" alert: fires when battery < configurable threshold (default 20%)
- "Charge complete" TTS: "Your Tesla is fully charged" via voice plugin
- All alerts dismissible and configurable in plugin settings

### STORY-24.5: Home charging log

- Manual or auto-detected charging sessions (start/end detected from state changes)
- Log: date, kWh added, duration, cost (calculated from electricity rate in House → Energy settings)
- Monthly and annual cumulative cost chart
- Integration with EV screen charging log

### STORY-24.6: Climate pre-conditioning

- "Start heating/cooling" button in widget and detail page
- Target temperature input (respects locale °C/°F)
- Scheduled pre-conditioning: "warm up at 07:45" per weekday

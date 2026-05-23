# EPIC-27: Eufy Plugin v2 — Cameras, Doorbell, Vacuum

**Status:** backlog  
**Priority:** 8

## Overview

The existing Eufy plugin is a stub. This epic implements the full feature set per PRD Section 32.2: live camera feeds, doorbell ring detection with full-screen overlay, and RoboVac control.

## Stories

### STORY-27.1: Eufy API integration

- Use `eufy-security-client` (community reverse-engineered library, `apiRisk: unofficial`)
- Plugin settings: Eufy account email + password, station serial numbers
- Connect to Eufy cloud and local station; prefer local P2P when on home network
- Document known risks: API may break on Eufy firmware updates

### STORY-27.2: Doorbell — ring detection & alert

- Subscribe to doorbell ring events via `eufy-security-client` event emitter
- On ring: push alert to Nestor alerts system ("Someone at the front door")
- Full-screen camera feed overlay auto-opens on ring (configurable: on/off)
- TTS: "Someone at the front door" via voice plugin
- Missed ring log: list of recent rings with timestamp in plugin detail page
- Motion alert: configurable separate alert for motion-without-ring

### STORY-27.3: Camera feeds

- List all cameras registered to the Eufy account
- Tap any camera → full-screen live feed (RTSP stream via HLS proxy on the Nestor server)
- Multi-camera grid view (2×2) for households with multiple cameras
- Last motion snapshot displayed on camera card when not live

### STORY-27.4: RoboVac control

- Current status: Vacuuming / Docked / Needs Emptying / Error
- Controls: Start, Stop, Return to Dock
- "Needs emptying" alert (push to alerts strip + TTS)
- Cleaning history: last 7 sessions (date, duration, area cleaned if available)

### STORY-27.5: Home screen widget

Per PRD 32.2:
- Last doorbell ring timestamp ("Front door: 14 mins ago")
- Vacuum status icon + state text
- Tap → camera grid or doorbell detail

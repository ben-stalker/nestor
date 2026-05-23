# EPIC-29: Screensaver — Family Photo Slideshow

**Status:** backlog  
**Priority:** 10

## Overview

PRD Section 24. After a configurable idle period the screen transitions to a full-screen photo slideshow with Ken Burns effect. Any touch exits instantly. Night mode dims the screensaver further.

## Stories

### STORY-29.1: Photo source & management

- Admin → Display → Screensaver: configure local photo folder path (default `~/nestor-photos`)
- `GET /api/v1/screensaver/photos` — lists available photos from the folder
- `POST /api/v1/screensaver/photos` — upload photos via the admin UI (drag-and-drop, multi-file)
- Delete photos from admin UI
- Optional: Syncthing integration note in docs for automatic photo sync from phone

### STORY-29.2: Screensaver component

- `<Screensaver>` React component renders full-screen above all other content when active
- Photo displayed full-bleed, `object-fit: cover`
- Ken Burns effect: random choice of slow zoom in, zoom out, or pan (CSS animation, 8–12s per photo)
- Crossfade between photos: 1.5s opacity overlap
- Optional clock overlay: large serif time bottom-left, date below
- Tap anywhere → dismiss (fade out 300ms)

### STORY-29.3: Idle detection & trigger

- Track last touch event timestamp
- Idle threshold configurable in Admin → Display (default 90s, min 30s, max 30min)
- When threshold exceeded: dim overlay fades in first (500ms), then screensaver component mounts
- On screensaver touch: unmount screensaver, restore full brightness

### STORY-29.4: Night mode integration

- During configured night hours (Admin → Display → Night Mode): screensaver brightness capped at 20% via CSS filter
- Day mode: full brightness
- DPMS sleep (OS-level display off) after extended idle (default 10 min, configurable) — uses `xset dpms force off` via server shell-out

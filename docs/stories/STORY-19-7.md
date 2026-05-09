# STORY-19.7: Chromium kiosk launcher

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a launcher script that starts Chromium with the right flags
**So that** the kiosk is locked down and gesture-clean

---

## Acceptance Criteria

- [ ] `install/scripts/start-kiosk.sh` runs Chromium with: `--kiosk`, `--noerrdialogs`, `--disable-pinch`, `--overscroll-history-navigation=0`, `--disable-translate`, `--app=http://localhost:3000`
- [ ] Hides cursor (`unclutter`)
- [ ] xdotool/onboard hooks for OS keyboard
- [ ] Waits for server health (`curl http://localhost:3000/health`) before launching browser
- [ ] Re-launches Chromium if it crashes (handled by systemd Restart=always or inner loop)

---

## Technical Implementation

### Files to create / modify

- `install/scripts/start-kiosk.sh`
- `install/scripts/wait-for-server.sh` — small helper

### Implementation steps

1. Script:
```bash
#!/usr/bin/env bash
set -euo pipefail
# Wait for server health
until curl -sf http://localhost:3000/health > /dev/null; do sleep 2; done
# Hide cursor
unclutter -idle 0.5 -root &
# Start onboard (on-screen keyboard) docked at bottom
onboard --layout=Compact --theme=Nightshade --xid 2>/dev/null &
# Start Chromium
exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-translate \
  --no-first-run \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  --app=http://localhost:3000
```
2. Make executable; test on a real device (manual).
3. systemd `nestor-kiosk.service` invokes this script (STORY-19.6).

### Key technical details

- `--app=` mode hides Chromium chrome.
- `unclutter` hides idle cursor immediately.
- `onboard` provides the on-screen keyboard; triggered by focus on `<input>`.
- Wait-loop ensures we don't hit a 503 if browser starts before server.

---

## Dependencies

- **Blocked by:** STORY-19.6
- **Blocks:** —

---

## Test Checklist

- [ ] Manual: script launches Chromium full-screen
- [ ] Manual: cursor hidden after 0.5s idle
- [ ] Manual: tapping input opens onboard keyboard
- [ ] Manual: server crash → systemd restarts the unit; browser reconnects
- [ ] Manual: health-wait loop holds until server up

---

## Notes

- Wayland alternative: `chromium-browser --ozone-platform=wayland`; document in hardware guide.
- Future: a screensaver process (STORY-17.5) could pause the kiosk during quiet hours.

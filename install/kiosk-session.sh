#!/usr/bin/env bash
# Nestor kiosk X session — replaces GNOME, no panels or dock
exec > /home/nestor/.kiosk-session.log 2>&1

xset s off
xset s noblank
xset -dpms

# Rotate display to portrait (right edge at top)
DISPLAY_NAME=$(xrandr | awk '/ connected/{print $1; exit}')
xrandr --output "$DISPLAY_NAME" --rotate right

# Persistently enforce touch CTM in background.
# The Melfas controller re-enumerates ~3x on boot, each time resetting the matrix.
# This loop watches for ID changes and reapplies immediately.
(
  last_id=""
  while true; do
    id=$(xinput list 2>/dev/null \
      | grep -i 'melfas\|incell' \
      | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
    if [[ -n "$id" && "$id" != "$last_id" ]]; then
      xinput set-prop "$id" "Coordinate Transformation Matrix" \
        0 1 0 -1 0 1 0 0 1 2>/dev/null \
        && echo "[$(date)] touch CTM applied to id=$id"
      last_id="$id"
    fi
    sleep 1
  done
) &

# Start openbox in background (handles window management, no panels)
openbox &

# Hide cursor when idle
unclutter -idle 3 &

# Wait for Nestor server to be ready
until curl -sf http://localhost:3000 > /dev/null 2>&1; do
  sleep 1
done

# Launch Chromium fullscreen kiosk — exec replaces this shell
exec chromium-browser \
  --kiosk \
  --no-first-run \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --noerrdialogs \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --touch-events=enabled \
  http://localhost:3000

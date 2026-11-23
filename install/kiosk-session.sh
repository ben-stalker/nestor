#!/usr/bin/env bash
# Nestor kiosk X session — replaces GNOME, no panels or dock
exec > "$HOME/.kiosk-session.log" 2>&1

xset s off
xset s noblank
xset -dpms

# Rotate display to portrait (right edge at top)
DISPLAY_NAME=$(xrandr | awk '/ connected/{print $1; exit}')
xrandr --output "$DISPLAY_NAME" --rotate right

# Persistently enforce touch CTM — reapply every 5 s to handle Melfas
# re-enumeration which can reset the matrix even without changing device ID.
(
  while true; do
    id=$(xinput list 2>/dev/null \
      | grep -i 'melfas\|incell' \
      | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
    if [[ -n "$id" ]]; then
      xinput set-prop "$id" "Coordinate Transformation Matrix" \
        0 1 0 -1 0 1 0 0 1 2>/dev/null
    fi
    sleep 5
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

# Prefer Google Chrome (the on-screen keyboard needs its AT-SPI support);
# fall back to Chromium so a fresh install still gets a working kiosk.
BROWSER=$(command -v google-chrome || command -v chromium-browser || command -v chromium || true)
if [[ -z "$BROWSER" ]]; then
  echo "No Chrome/Chromium found" >&2
  exit 1
fi

# Launch fullscreen kiosk — exec replaces this shell
exec "$BROWSER" \
  --password-store=basic \
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

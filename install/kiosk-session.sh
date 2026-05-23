#!/usr/bin/env bash
# Nestor kiosk X session — replaces GNOME, no panels or dock
exec > /home/nestor/.kiosk-session.log 2>&1

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

# On-screen keyboard: auto-show when a text field is focused via AT-SPI.
# Google Chrome (deb) exposes accessibility unlike the snap build.
if command -v onboard >/dev/null 2>&1; then
  gsettings set org.onboard.auto-show enabled true
  gsettings set org.onboard start-minimized true
  gsettings set org.onboard layout 'Compact'
  onboard &
fi

# Wait for Nestor server to be ready
until curl -sf http://localhost:3000 > /dev/null 2>&1; do
  sleep 1
done

# Launch Chrome fullscreen kiosk — exec replaces this shell.
# --force-renderer-accessibility exposes the DOM to AT-SPI so onboard
# can detect focused text fields and auto-show.
exec google-chrome \
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
  --force-renderer-accessibility \
  http://localhost:3000

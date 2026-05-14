#!/usr/bin/env bash
export DISPLAY=:0
LOGFILE="$HOME/.kiosk-init.log"
exec >> "$LOGFILE" 2>&1
echo "[$(date)] kiosk-init starting"

xset s off
xset s noblank
xset -dpms
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-timeout 0
gsettings set org.gnome.desktop.a11y.applications screen-keyboard-enabled true

# Rotate display to portrait (right edge at top)
DISPLAY_NAME=$(xrandr | awk '/ connected/{print $1; exit}')
echo "[$(date)] rotating display: $DISPLAY_NAME"
xrandr --output "$DISPLAY_NAME" --rotate right

# Apply touch coordinate transformation AFTER xrandr rotation.
# CTM maps raw landscape ABS coords to portrait screen coords.
# Derived from corner touches: portrait_x=ABS_Y, portrait_y=1-ABS_X
sleep 1
xinput set-prop "Melfas LGDisplay Incell Touch" \
  "Coordinate Transformation Matrix" \
  0 1 0 -1 0 1 0 0 1
echo "[$(date)] touch CTM applied"

# Wait for Nestor server then launch Chromium in kiosk mode
echo "[$(date)] waiting for Nestor server..."
until curl -sf http://localhost:3000 > /dev/null 2>&1; do sleep 1; done
echo "[$(date)] server ready, launching kiosk"
chromium-browser \
  --kiosk \
  --no-first-run \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --noerrdialogs \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  http://localhost:3000 &

echo "[$(date)] kiosk-init done"

#!/usr/bin/env bash
set -euo pipefail
export DISPLAY="${DISPLAY:-:0}"

# Wait for Nestor server health
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  echo "Waiting for Nestor server..."
  sleep 2
done

# Rotate display and apply touch CTM.
# The Melfas controller re-enumerates several times on boot, so we watch in the
# background and reapply whenever the device ID changes.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/rotate-display.sh" right || true

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

# Hide cursor after 0.5s idle
command -v unclutter >/dev/null 2>&1 && unclutter -idle 0.5 -root &

# On-screen keyboard (optional — ignore if not installed)
command -v onboard >/dev/null 2>&1 && \
  onboard --layout=Compact --theme=Nightshade --xid 2>/dev/null &

exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-translate \
  --no-first-run \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --app=http://localhost:3000

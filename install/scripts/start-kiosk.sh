#!/usr/bin/env bash
set -euo pipefail
export DISPLAY="${DISPLAY:-:0}"

# Wait for Nestor server health
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  echo "Waiting for Nestor server..."
  sleep 2
done

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

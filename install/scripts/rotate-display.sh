#!/usr/bin/env bash
# Hardware-agnostic display rotation for Nestor kiosk
# Usage: rotate-display.sh [normal|right|inverted|left] [--dry-run]
set -euo pipefail

ROTATION="${1:-normal}"
DRY_RUN=false
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN=true

# Coordinate Transformation Matrices for each rotation
declare -A CTM
CTM[normal]="1 0 0 0 1 0 0 0 1"
CTM[right]="0 1 0 -1 0 1 0 0 1"
CTM[inverted]="-1 0 1 0 -1 1 0 0 1"
CTM[left]="0 -1 1 1 0 0 0 0 1"

if [[ -z "${CTM[$ROTATION]+_}" ]]; then
  echo "Error: Unknown rotation '$ROTATION'. Use: normal, right, inverted, left"
  exit 1
fi

# Auto-detect display name
get_display_name() {
  xrandr 2>/dev/null | awk '/ connected/{print $1; exit}'
}

# Auto-detect touchscreen device
get_touch_device() {
  xinput list --name-only 2>/dev/null | grep -i "touch" | head -1 || echo ""
}

DISPLAY_NAME=$(get_display_name)
TOUCH_DEVICE=$(get_touch_device)
MATRIX="${CTM[$ROTATION]}"

echo "Rotation:    $ROTATION"
echo "Display:     ${DISPLAY_NAME:-not detected}"
echo "Touchscreen: ${TOUCH_DEVICE:-not detected}"
echo "CTM:         $MATRIX"

if $DRY_RUN; then
  echo "[dry-run] Would run: xrandr --output $DISPLAY_NAME --rotate $ROTATION"
  [[ -n "$TOUCH_DEVICE" ]] && echo "[dry-run] Would run: xinput set-prop '$TOUCH_DEVICE' 'Coordinate Transformation Matrix' $MATRIX"
  exit 0
fi

if [[ -z "$DISPLAY_NAME" ]]; then
  echo "Error: No display detected. Is X running?"
  exit 1
fi

xrandr --output "$DISPLAY_NAME" --rotate "$ROTATION"
echo "Display rotated."

if [[ -n "$TOUCH_DEVICE" ]]; then
  sleep 1
  # shellcheck disable=SC2086
  xinput set-prop "$TOUCH_DEVICE" "Coordinate Transformation Matrix" $MATRIX
  echo "Touch CTM applied."
fi

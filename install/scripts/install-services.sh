#!/usr/bin/env bash
# Substitutes placeholders in service templates and installs to systemd.
# Usage: install-services.sh [--voice]
set -euo pipefail

NESTOR_USER="${NESTOR_USER:-nestor}"
INSTALL_DIR="${INSTALL_DIR:-/opt/nestor}"
SERVICES_DIR="$(cd "$(dirname "$0")/../services" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"
INSTALL_VOICE=false

for arg in "$@"; do
  [[ "$arg" == "--voice" ]] && INSTALL_VOICE=true
done

install_service() {
  local svc="$1"
  sed -e "s|{{NESTOR_USER}}|$NESTOR_USER|g" \
      -e "s|{{INSTALL_DIR}}|$INSTALL_DIR|g" \
      "$SERVICES_DIR/$svc.service" > "$SYSTEMD_DIR/$svc.service"
  echo "Installed $svc.service"
}

install_service nestor-server

# The kiosk browser runs as a GDM X session (see install-kiosk-session.sh), not
# a systemd unit, so rotation and the touch matrix loop live in one place.
# Retire the legacy unit names from earlier installs so only one server binds :3000.
for legacy in nestor nestor-kiosk; do
  if [[ -f "$SYSTEMD_DIR/$legacy.service" ]]; then
    systemctl disable --now "$legacy.service" 2>/dev/null || true
    rm -f "$SYSTEMD_DIR/$legacy.service"
    echo "Removed legacy $legacy.service"
  fi
done

if $INSTALL_VOICE; then
  install_service nestor-voice
  echo "Installed nestor-voice.service"
fi

systemctl daemon-reload
systemctl enable --now nestor-server.service

if $INSTALL_VOICE; then
  systemctl enable --now nestor-voice.service
fi

echo "Services installed and started."

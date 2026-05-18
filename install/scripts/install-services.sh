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
install_service nestor-kiosk

if $INSTALL_VOICE; then
  install_service nestor-voice
  echo "Installed nestor-voice.service"
fi

systemctl daemon-reload
systemctl enable --now nestor-server.service nestor-kiosk.service

if $INSTALL_VOICE; then
  systemctl enable --now nestor-voice.service
fi

echo "Services installed and started."

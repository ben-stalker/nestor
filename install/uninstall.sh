#!/usr/bin/env bash
# Nestor uninstaller
set -euo pipefail

NESTOR_USER="${NESTOR_USER:-nestor}"
INSTALL_DIR="${INSTALL_DIR:-/opt/nestor}"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash uninstall.sh"
  exit 1
fi

echo "Stopping and disabling Nestor services..."
systemctl stop nestor-server nestor-kiosk nestor-voice 2>/dev/null || true
systemctl disable nestor-server nestor-kiosk nestor-voice 2>/dev/null || true

echo "Removing service files..."
rm -f /etc/systemd/system/nestor-server.service
rm -f /etc/systemd/system/nestor-kiosk.service
rm -f /etc/systemd/system/nestor-voice.service
systemctl daemon-reload

echo "Removing install directory..."
rm -rf "$INSTALL_DIR"

echo "Removing nestor user..."
userdel -r "$NESTOR_USER" 2>/dev/null || true

echo "Nestor uninstalled."

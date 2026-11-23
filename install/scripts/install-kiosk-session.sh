#!/usr/bin/env bash
# Installs the Nestor kiosk X session (GDM auto-login -> openbox -> Chrome kiosk,
# with display rotation and the touch coordinate-matrix loop in kiosk-session.sh).
# Idempotent. Must run as root.
# Usage: NESTOR_USER=nestor INSTALL_DIR=/opt/nestor install-kiosk-session.sh
set -euo pipefail

NESTOR_USER="${NESTOR_USER:-nestor}"
INSTALL_DIR="${INSTALL_DIR:-/opt/nestor}"
INSTALL_SRC="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "install-kiosk-session.sh must run as root" >&2
  exit 1
fi

log() { echo "[kiosk-session] $*"; }

chmod +x "$INSTALL_SRC/kiosk-session.sh"

# 1. X session entry that GDM can launch. Exec points at the script in the repo
#    checkout so a `git pull` updates the kiosk without reinstalling.
log "Installing /usr/share/xsessions/nestor-kiosk.desktop"
sed -e "s|{{INSTALL_DIR}}|$INSTALL_DIR|g" \
  "$INSTALL_SRC/nestor-kiosk.desktop" > /usr/share/xsessions/nestor-kiosk.desktop

# 2. Xorg input rule so the Melfas/iiyama touch panel uses evdev.
log "Installing Xorg touch rule"
mkdir -p /etc/X11/xorg.conf.d
install -m 0644 "$INSTALL_SRC/90-touch-rotation.conf" /etc/X11/xorg.conf.d/90-touch-rotation.conf

# 3. GDM: auto-login and force X11 (the touch matrix and xrandr need Xorg).
GDMCFG=/etc/gdm3/custom.conf
if [[ -f "$GDMCFG" ]]; then
  log "Configuring GDM auto-login and X11 in $GDMCFG"
  grep -q "^AutomaticLoginEnable=" "$GDMCFG" \
    || sed -i '/^\[daemon\]/a AutomaticLoginEnable=true' "$GDMCFG"
  grep -q "^AutomaticLogin=" "$GDMCFG" \
    || sed -i "/^\[daemon\]/a AutomaticLogin=$NESTOR_USER" "$GDMCFG"
  if grep -q "^#\?\s*WaylandEnable=" "$GDMCFG"; then
    sed -i 's|^#\?\s*WaylandEnable=.*|WaylandEnable=false|' "$GDMCFG"
  else
    sed -i '/^\[daemon\]/a WaylandEnable=false' "$GDMCFG"
  fi
else
  log "WARNING: $GDMCFG not found (GDM not installed?). Auto-login not configured."
fi

# 4. Make GDM pick the kiosk session for the user.
ACCOUNTS=/var/lib/AccountsService/users/$NESTOR_USER
log "Setting default session for $NESTOR_USER to nestor-kiosk"
mkdir -p "$(dirname "$ACCOUNTS")"
if [[ -f "$ACCOUNTS" ]]; then
  if grep -q "^Session=" "$ACCOUNTS"; then
    sed -i 's|^Session=.*|Session=nestor-kiosk|' "$ACCOUNTS"
  else
    sed -i '/^\[User\]/a Session=nestor-kiosk' "$ACCOUNTS"
  fi
else
  printf '[User]\nSession=nestor-kiosk\nSystemAccount=false\n' > "$ACCOUNTS"
fi
chmod 0600 "$ACCOUNTS"

log "Done. Reboot (or restart gdm3) to enter the kiosk session."

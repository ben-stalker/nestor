#!/usr/bin/env bash
# Nestor NUC Setup Script
# Hardware: Intel NUC7i3DNK, iiyama ProLite T2454MSC (touch), JABRA Speak 510
# OS: Ubuntu 24.04 LTS Desktop
set -euo pipefail

NESTOR_USER="${SUDO_USER:-$(logname)}"
NESTOR_HOME="/home/$NESTOR_USER"
LOG="/var/log/nestor-setup.log"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash setup-nuc.sh"
  exit 1
fi

log "=== Nestor NUC Setup starting for user: $NESTOR_USER ==="

# ── 1. System update ──────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  intel-microcode \
  linux-firmware \
  curl wget git unzip \
  software-properties-common \
  apt-transport-https ca-certificates gnupg

# ── 2. Intel graphics (NUC7 = Kaby Lake / HD Graphics 620) ───────────────────
log "Installing Intel graphics stack..."
apt-get install -y -qq \
  mesa-utils \
  mesa-vulkan-drivers \
  libgl1-mesa-dri \
  vainfo \
  intel-gpu-tools \
  xserver-xorg-video-intel

# ── 3. Wi-Fi (Intel Wireless-AC 8265) ─────────────────────────────────────────
log "Installing wireless drivers..."
apt-get install -y -qq \
  firmware-iwlwifi \
  network-manager \
  network-manager-gnome || true   # firmware-iwlwifi may not exist on Ubuntu (included in linux-firmware)

# ── 4. Audio – JABRA Speak 510 (USB) ─────────────────────────────────────────
log "Installing audio stack..."
apt-get install -y -qq \
  pipewire pipewire-pulse pipewire-alsa \
  wireplumber \
  pavucontrol \
  alsa-utils

# ── 5. Touch screen – iiyama ProLite T2454MSC ─────────────────────────────────
# USB HID multitouch works natively; we add calibration + gesture tools
log "Installing touch screen support..."
apt-get install -y -qq \
  xinput \
  xserver-xorg-input-evdev \
  xserver-xorg-input-multitouch \
  libinput-tools \
  evtest

# ── 6. On-screen keyboard ────────────────────────────────────────────────────
log "Installing on-screen keyboard..."
apt-get install -y -qq \
  onboard          # primary: settings-aware, touch-friendly
# squeekboard is Wayland-native; onboard is X11. Both installed for fallback.
apt-get install -y -qq squeekboard || true

# ── 7. Kiosk / display management ────────────────────────────────────────────
log "Installing kiosk and display tools..."
apt-get install -y -qq \
  chromium-browser \
  xdotool \
  wmctrl \
  unclutter \
  x11-xserver-utils \
  xscreensaver

# ── 8. Node.js 20 LTS (for Nestor app) ───────────────────────────────────────
if ! command -v node &>/dev/null; then
  log "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
else
  log "Node.js already installed: $(node --version)"
fi

# ── 9. Docker (for Nestor containers) ────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  usermod -aG docker "$NESTOR_USER"
  log "Docker installed; $NESTOR_USER added to docker group"
else
  log "Docker already installed: $(docker --version)"
fi

# ── 10. Auto-login for kiosk user ────────────────────────────────────────────
log "Configuring auto-login for $NESTOR_USER..."
GDMCFG=/etc/gdm3/custom.conf
if [[ -f "$GDMCFG" ]]; then
  # Idempotent: only write if not already set
  if ! grep -q "^AutomaticLogin=" "$GDMCFG"; then
    sed -i '/^\[daemon\]/a AutomaticLoginEnable=true\nAutomaticLogin='"$NESTOR_USER" "$GDMCFG"
  fi
fi

# ── 11. Disable sleep / screensaver for kiosk ────────────────────────────────
log "Disabling power management for kiosk mode..."
mkdir -p /etc/systemd/sleep.conf.d
cat > /etc/systemd/sleep.conf.d/nosleep.conf <<'EOF'
[Sleep]
AllowSuspend=no
AllowHibernation=no
AllowSuspendThenHibernate=no
AllowHybridSleep=no
EOF

# GNOME gsettings applied at user session start (see autostart below)
mkdir -p "$NESTOR_HOME/.config/autostart"
cat > "$NESTOR_HOME/.config/autostart/kiosk-init.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Nestor Kiosk Init
Exec=/opt/nestor/kiosk-init.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

mkdir -p /opt/nestor
cat > /opt/nestor/kiosk-init.sh <<'EOF'
#!/usr/bin/env bash
# Disable screensaver and power blanking
xset s off
xset s noblank
xset -dpms
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-timeout 0
# Show on-screen keyboard by default
gsettings set org.gnome.desktop.a11y.applications screen-keyboard-enabled true

# ── Screen rotation ───────────────────────────────────────────────────────────
# Options: normal | left | right | inverted
# Change ROTATION below if the display is physically mounted in portrait/inverted.
# Leave as "normal" for standard landscape.
ROTATION="right"

if [[ "$ROTATION" != "normal" ]]; then
  DISPLAY_NAME=$(xrandr | awk '/ connected/{print $1; exit}')
  xrandr --output "$DISPLAY_NAME" --rotate "$ROTATION"

  # Rotate the touch input matrix to match the display orientation
  TOUCH_DEVICE=$(xinput list --name-only | grep -iE 'iiyama|eGalax|ILITEK|EETI|touch' | head -1)
  if [[ -n "$TOUCH_DEVICE" ]]; then
    case "$ROTATION" in
      left)     MATRIX="0 -1 1 1 0 0 0 0 1" ;;
      right)    MATRIX="0 1 0 -1 0 1 0 0 1" ;;
      inverted) MATRIX="-1 0 1 0 -1 1 0 0 1" ;;
    esac
    xinput set-prop "$TOUCH_DEVICE" "Coordinate Transformation Matrix" $MATRIX
  fi
fi
EOF
chmod +x /opt/nestor/kiosk-init.sh
chown -R "$NESTOR_USER:$NESTOR_USER" "$NESTOR_HOME/.config/autostart"

# ── 12. JABRA default audio device (udev rule) ───────────────────────────────
log "Adding JABRA Speak 510 udev rule..."
cat > /etc/udev/rules.d/89-jabra.rules <<'EOF'
# JABRA Speak 510 – set as default PipeWire sink/source on plug
ACTION=="add", SUBSYSTEM=="usb", ATTRS{idVendor}=="0b0e", \
  RUN+="/usr/local/bin/jabra-default.sh"
EOF

cat > /usr/local/bin/jabra-default.sh <<'EOF'
#!/usr/bin/env bash
sleep 2   # let PipeWire enumerate device
pactl set-default-sink   $(pactl list short sinks   | grep -i jabra | awk '{print $2}' | head -1) 2>/dev/null || true
pactl set-default-source $(pactl list short sources | grep -i jabra | awk '{print $2}' | head -1) 2>/dev/null || true
EOF
chmod +x /usr/local/bin/jabra-default.sh
udevadm control --reload-rules

# ── 13. Touch screen calibration helper ──────────────────────────────────────
log "Writing touch calibration helper..."
cat > /usr/local/bin/calibrate-touch.sh <<'EOF'
#!/usr/bin/env bash
# Run once after first boot if touch coordinates are off
# Usage: sudo calibrate-touch.sh
DEVICE=$(xinput list --name-only | grep -i 'iiyama\|eGalax\|ILITEK\|touch' | head -1)
if [[ -z "$DEVICE" ]]; then
  echo "No touch device found. Run: xinput list"
  exit 1
fi
echo "Found touch device: $DEVICE"
xinput_calibrator --device "$DEVICE"
EOF
chmod +x /usr/local/bin/calibrate-touch.sh

# install xinput_calibrator if available
apt-get install -y -qq xinput-calibrator 2>/dev/null || true

# ── 14. Useful system tools ───────────────────────────────────────────────────
log "Installing misc utilities..."
apt-get install -y -qq \
  htop \
  net-tools \
  openssh-server \
  ufw

ufw allow OpenSSH
ufw --force enable

# ── 15. Clean up ─────────────────────────────────────────────────────────────
log "Cleaning up..."
apt-get autoremove -y -qq
apt-get autoclean -qq

log ""
log "=== Setup complete ==="
log "Next steps:"
log "  1. Reboot: sudo reboot"
log "  2. If touch coords are off: sudo calibrate-touch.sh"
log "  3. Check JABRA audio: pavucontrol"
log "  4. SSH access enabled on port 22"
log "  5. Deploy Nestor app to /opt/nestor/"
log ""
log "SSH into this machine: ssh $NESTOR_USER@<ip-address>"

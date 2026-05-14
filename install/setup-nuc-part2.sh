#!/usr/bin/env bash
set -euo pipefail
NESTOR_USER="nestor"
NESTOR_HOME="/home/nestor"

# ── 11. Disable sleep / screensaver ──────────────────────────────────────────
mkdir -p /etc/systemd/sleep.conf.d
cat > /etc/systemd/sleep.conf.d/nosleep.conf <<'EOF'
[Sleep]
AllowSuspend=no
AllowHibernation=no
AllowSuspendThenHibernate=no
AllowHybridSleep=no
EOF

mkdir -p "$NESTOR_HOME/.config/autostart"
cat > "$NESTOR_HOME/.config/autostart/kiosk-init.desktop" <<'EOF'
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
xset s off
xset s noblank
xset -dpms
gsettings set org.gnome.desktop.screensaver lock-enabled false
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-timeout 0
gsettings set org.gnome.desktop.a11y.applications screen-keyboard-enabled true

ROTATION="right"
if [[ "$ROTATION" != "normal" ]]; then
  DISPLAY_NAME=$(xrandr | awk '/ connected/{print $1; exit}')
  xrandr --output "$DISPLAY_NAME" --rotate "$ROTATION"
  TOUCH_DEVICE=$(xinput list --name-only | grep -iE 'iiyama|eGalax|ILITEK|EETI|touch' | head -1)
  if [[ -n "$TOUCH_DEVICE" ]]; then
    case "$ROTATION" in
      right) MATRIX="0 1 0 -1 0 1 0 0 1" ;;
    esac
    xinput set-prop "$TOUCH_DEVICE" "Coordinate Transformation Matrix" $MATRIX
  fi
fi
EOF
chmod +x /opt/nestor/kiosk-init.sh
chown -R "$NESTOR_USER:$NESTOR_USER" "$NESTOR_HOME/.config/autostart"
echo "Step 11 done: power management and kiosk init"

# ── 12. JABRA udev rule ───────────────────────────────────────────────────────
cat > /etc/udev/rules.d/89-jabra.rules <<'EOF'
ACTION=="add", SUBSYSTEM=="usb", ATTRS{idVendor}=="0b0e", \
  RUN+="/usr/local/bin/jabra-default.sh"
EOF

cat > /usr/local/bin/jabra-default.sh <<'EOF'
#!/usr/bin/env bash
sleep 2
pactl set-default-sink   $(pactl list short sinks   | grep -i jabra | awk '{print $2}' | head -1) 2>/dev/null || true
pactl set-default-source $(pactl list short sources | grep -i jabra | awk '{print $2}' | head -1) 2>/dev/null || true
EOF
chmod +x /usr/local/bin/jabra-default.sh
udevadm control --reload-rules
echo "Step 12 done: JABRA udev rule"

# ── 13. Touch calibration helper ─────────────────────────────────────────────
cat > /usr/local/bin/calibrate-touch.sh <<'EOF'
#!/usr/bin/env bash
DEVICE=$(xinput list --name-only | grep -iE 'iiyama|eGalax|ILITEK|touch' | head -1)
if [[ -z "$DEVICE" ]]; then echo "No touch device found. Run: xinput list"; exit 1; fi
echo "Found: $DEVICE"
xinput_calibrator --device "$DEVICE"
EOF
chmod +x /usr/local/bin/calibrate-touch.sh
apt-get install -y -qq xinput-calibrator 2>/dev/null || true
echo "Step 13 done: touch calibration helper"

# ── 14. Utilities + firewall ──────────────────────────────────────────────────
apt-get install -y -qq htop net-tools ufw
ufw allow OpenSSH
ufw --force enable
echo "Step 14 done: utilities and firewall"

# ── 15. Cleanup ───────────────────────────────────────────────────────────────
apt-get autoremove -y -qq
apt-get autoclean -qq

echo ""
echo "=== Setup complete. Please reboot: sudo reboot ==="

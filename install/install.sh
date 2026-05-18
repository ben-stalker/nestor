#!/usr/bin/env bash
# Nestor single-line installer
# Usage: curl -fsSL https://get.nestor.app/install.sh | bash
set -euo pipefail

NESTOR_USER="${NESTOR_USER:-nestor}"
INSTALL_DIR="${INSTALL_DIR:-/opt/nestor}"
LOG="/tmp/nestor-install.log"
REPO_URL="${REPO_URL:-https://github.com/benstalker/nestor.git}"

trap 'echo "Install failed at line $LINENO. Check $LOG for details."; tail -20 "$LOG"' ERR

exec > >(tee -a "$LOG") 2>&1

log() { echo "[$(date '+%H:%M:%S')] $*"; }

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "Please run as root: sudo bash install.sh"
    exit 1
  fi
}

detect_distro() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck source=/dev/null
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]] || [[ "${VERSION_ID%%.*}" -lt 22 ]]; then
      echo "Unsupported OS: $PRETTY_NAME. Ubuntu 22+ required."
      exit 1
    fi
    log "Detected: $PRETTY_NAME"
  else
    echo "Cannot detect OS. Aborting."
    exit 1
  fi
}

install_deps() {
  log "Installing system dependencies..."
  apt-get update -qq
  apt-get install -y -qq \
    curl wget git unzip build-essential \
    sqlite3 \
    chromium-browser \
    onboard \
    unclutter \
    ffmpeg \
    xdotool \
    alsa-utils \
    python3-pip \
    jq
}

install_node() {
  if command -v node >/dev/null 2>&1 && node --version | grep -q "v2[0-9]"; then
    log "Node $(node --version) already installed — skipping"
    return
  fi
  log "Installing Node.js 20 via nvm..."
  export NVM_DIR="/opt/nvm"
  mkdir -p "$NVM_DIR"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | NVM_DIR="$NVM_DIR" bash
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
  # Symlink to system PATH
  ln -sf "$(which node)" /usr/local/bin/node
  ln -sf "$(which npm)" /usr/local/bin/npm
}

create_user() {
  if id "$NESTOR_USER" &>/dev/null; then
    log "User $NESTOR_USER already exists — skipping"
    return
  fi
  log "Creating user $NESTOR_USER..."
  useradd --system --shell /bin/bash --home-dir "/home/$NESTOR_USER" --create-home "$NESTOR_USER"
}

install_app() {
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    log "Repo already at $INSTALL_DIR — pulling latest..."
    git -C "$INSTALL_DIR" pull --rebase
  else
    log "Cloning Nestor to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
  chown -R "$NESTOR_USER:$NESTOR_USER" "$INSTALL_DIR"

  log "Installing npm dependencies..."
  cd "$INSTALL_DIR"
  npm install --silent
  log "Building app..."
  npm run build
}

detect_audio() {
  log "Checking for USB audio..."
  if aplay -l 2>/dev/null | grep -qi usb; then
    log "USB audio detected."
    return 0
  else
    log "WARNING: No USB audio device detected. Voice features will be unavailable."
    return 1
  fi
}

detect_orientation() {
  log "Detecting display orientation..."
  if command -v xrandr >/dev/null 2>&1 && xrandr 2>/dev/null | grep -q " connected"; then
    # Check if the first connected display is portrait (height > width)
    GEOMETRY=$(xrandr 2>/dev/null | awk '/ connected /{found=1} found && /[0-9]+x[0-9]+/{print $1; exit}')
    if [[ -n "$GEOMETRY" ]]; then
      W=$(echo "$GEOMETRY" | cut -dx -f1)
      H=$(echo "$GEOMETRY" | cut -dx -f2 | cut -d+ -f1)
      if [[ "$H" -gt "$W" ]]; then
        echo "portrait"
      else
        echo "landscape"
      fi
      return
    fi
  fi
  echo "portrait"  # safe default for typical Nestor hardware
}

install_services() {
  log "Installing systemd services..."
  NESTOR_USER="$NESTOR_USER" INSTALL_DIR="$INSTALL_DIR" \
    bash "$INSTALL_DIR/install/scripts/install-services.sh"
}

main() {
  require_root
  detect_distro
  install_deps
  install_node
  create_user
  install_app

  if detect_audio; then
    log "Enabling voice service..."
    NESTOR_USER="$NESTOR_USER" INSTALL_DIR="$INSTALL_DIR" \
      bash "$INSTALL_DIR/install/scripts/install-services.sh" --voice
  else
    install_services
  fi

  log "Nestor installation complete!"
  log "Access at: http://localhost:3000"
  log "View logs: journalctl -u nestor-server -f"
}

main "$@"

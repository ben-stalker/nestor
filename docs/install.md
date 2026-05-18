# Installation

## Prerequisites

- Ubuntu 22.04 LTS or later (Ubuntu 24.04 recommended)
- Node.js 20 LTS (the installer will install this automatically via nvm if absent)
- `git`
- Root / sudo access for the automated installer

## Single-command install

```bash
curl -fsSL https://raw.githubusercontent.com/benstalker/nestor/main/install/install.sh | sudo bash
```

The script:

1. Detects the OS and aborts on unsupported versions.
2. Installs system packages: `curl`, `wget`, `git`, `sqlite3`, `chromium-browser`, `onboard`, `unclutter`, `ffmpeg`, `xdotool`, `alsa-utils`, `python3-pip`, `jq`.
3. Installs Node.js 20 LTS via nvm (skipped if a v20+ node is already present).
4. Creates a dedicated `nestor` system user.
5. Clones the repo to `/opt/nestor`, runs `npm install` and `npm run build`.
6. Detects USB audio — if found, installs the voice service; otherwise installs the server and kiosk services only.

Installation log is written to `/tmp/nestor-install.log`.

Environment variables that customise the install:

| Variable | Default | Description |
|---|---|---|
| `NESTOR_USER` | `nestor` | System user to run services |
| `INSTALL_DIR` | `/opt/nestor` | Directory to clone/run from |
| `REPO_URL` | `https://github.com/benstalker/nestor.git` | Git repository URL |

## Manual install

```bash
# Clone
git clone https://github.com/benstalker/nestor.git /opt/nestor
cd /opt/nestor

# Install dependencies and build
npm install
npm run build

# Copy and configure environment
cp /etc/nestor.env.example /etc/nestor.env  # edit as needed

# Install services (run as root)
NESTOR_USER=nestor INSTALL_DIR=/opt/nestor \
  bash install/scripts/install-services.sh
```

## Systemd services

Three services are installed under systemd:

| Service | Description |
|---|---|
| `nestor-server` | Node.js/Express HTTP server. Serves the React SPA and REST API on port 3000. |
| `nestor-kiosk` | Launches Chromium in kiosk mode on the attached display. Depends on `nestor-server`. |
| `nestor-voice` | Voice pipeline (OpenWakeWord + Whisper STT + Piper TTS). Only installed when USB audio is detected. Depends on `nestor-server`. |

Common service commands:

```bash
# Status
systemctl status nestor-server

# Live logs
journalctl -u nestor-server -f
journalctl -u nestor-voice -f

# Restart
sudo systemctl restart nestor-server
```

## Post-install

Once the server is running, open a browser at:

```
http://localhost:3000
```

The Setup Wizard runs automatically on first boot and walks through:

1. Language and locale
2. Household name and timezone
3. Family profiles
4. Calendar connections
5. Feature selection (voice, meals, finance, etc.)
6. Plugin installation
7. Display and kiosk settings

To re-run the wizard at any time, go to **Admin → Setup Wizard** in the app.

## Updating

```bash
cd /opt/nestor
git pull --rebase
npm install
npm run build
sudo systemctl restart nestor-server
```

## Uninstalling

```bash
sudo bash /opt/nestor/install/uninstall.sh
```

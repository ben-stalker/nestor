# Nestor systemd Service Templates

This directory contains systemd unit file templates for the three Nestor services.
They use placeholder tokens that are substituted by `install/scripts/install-services.sh`
before being copied to `/etc/systemd/system/`.

## Services

### `nestor-server.service`
The main Node.js backend server. Starts after `network.target` so the network is
available before the server tries to connect to external APIs or the local SQLite
database. Watches the process with `WatchdogSec=30` and restarts automatically on
any exit. Loads optional runtime environment variables from `/etc/nestor.env`
(the `-` prefix means the file is silently skipped if it does not exist).

### `nestor-kiosk.service`
Launches Chromium in kiosk mode after both `nestor-server.service` and
`graphical.target` are ready. Depends on (and requires) the server service so that
systemd will not start the browser unless the backend is running. Runs as the kiosk
user with `DISPLAY=:0` so it attaches to the physical screen managed by the X server.

### `nestor-voice.service`
Runs the voice pipeline subprocess. Like the server service it loads `/etc/nestor.env`
and restarts on failure. It is optional — the install script only installs it when
a USB audio device is detected (or when `--voice` is passed explicitly).

## Placeholders

| Placeholder       | Meaning                                          | Default        |
|-------------------|--------------------------------------------------|----------------|
| `{{NESTOR_USER}}` | System user that owns and runs the Nestor process | `nestor`       |
| `{{INSTALL_DIR}}` | Absolute path where the Nestor repo is installed  | `/opt/nestor`  |

## How placeholders are substituted

`install/scripts/install-services.sh` uses `sed` to replace both tokens before
writing the file to `/etc/systemd/system/`:

```bash
sed -e "s|{{NESTOR_USER}}|$NESTOR_USER|g" \
    -e "s|{{INSTALL_DIR}}|$INSTALL_DIR|g" \
    services/nestor-server.service > /etc/systemd/system/nestor-server.service
```

The values come from environment variables (`NESTOR_USER`, `INSTALL_DIR`) which the
top-level `install/install.sh` sets before calling the script, or which can be
overridden on the command line:

```bash
sudo NESTOR_USER=pi INSTALL_DIR=/home/pi/nestor bash install/scripts/install-services.sh
```

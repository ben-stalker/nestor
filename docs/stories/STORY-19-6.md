# STORY-19.6: systemd service templates

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 1 — Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** templated service files in `install/services/`
**So that** the install script can install them

---

## Acceptance Criteria

- [ ] `install/services/nestor-server.service` defines `Restart=always`, `WatchdogSec=30`, environment loaded from `/etc/nestor.env`
- [ ] `install/services/nestor-kiosk.service` depends on (`After=`/`Requires=`) `nestor-server.service`, runs the Chromium kiosk launcher
- [ ] `install/services/nestor-voice.service` is optional, `Requires=nestor-server.service`, started only if voice hardware detected
- [ ] `journalctl -u nestor-server -f` shows the structured Pino JSON logs from STORY-1.4
- [ ] Each service uses an unprivileged `nestor` user (created by the install script)
- [ ] `WorkingDirectory` and `ExecStart` reference the canonical install path (default `/opt/nestor`)
- [ ] Service files are templates — placeholders (`{{NESTOR_USER}}`, `{{INSTALL_DIR}}`) substituted by the install script

---

## Technical Implementation

### Files to create / modify

- `install/services/nestor-server.service`
- `install/services/nestor-kiosk.service`
- `install/services/nestor-voice.service`
- `install/services/README.md` — explains placeholders + install/uninstall lifecycle
- `install/scripts/install-services.sh` — copies templates into `/etc/systemd/system/` after substitution

### Implementation steps

1. Author `nestor-server.service` with `Type=simple`, `Restart=always`, `RestartSec=5`, `WatchdogSec=30`, `EnvironmentFile=-/etc/nestor.env`, `ExecStart=/usr/bin/node {{INSTALL_DIR}}/server/dist/index.js`, `User={{NESTOR_USER}}`, `WorkingDirectory={{INSTALL_DIR}}`, `StandardOutput=journal`, `StandardError=journal`.
2. Add `[Install] WantedBy=multi-user.target`.
3. Author `nestor-kiosk.service` with `After=nestor-server.service graphical.target`, `Requires=nestor-server.service`, `ExecStart={{INSTALL_DIR}}/install/scripts/start-kiosk.sh`, `Type=simple`, `Restart=always`. Run as the kiosk user with proper `Environment=DISPLAY=:0`/`XDG_RUNTIME_DIR`.
4. Author `nestor-voice.service` with `Requires=nestor-server.service`, `ExecStart=/usr/bin/node {{INSTALL_DIR}}/server/dist/voice/process.js`, conditional start (the install script only enables it if USB audio is detected).
5. `install-services.sh`:
   - `sed`-substitute placeholders.
   - Copy to `/etc/systemd/system/`.
   - `systemctl daemon-reload`.
   - `systemctl enable --now nestor-server.service`.
6. Test on a clean Ubuntu 24 container: services start, watchdog kicks in if process hangs, `journalctl` shows structured logs.

### Key technical details

- Architecture §"Component 1: Express HTTP Server" requires watchdog — Express must call `process.send('READY=1')` after `app.listen()`; `WatchdogSec` then triggers restart if Pino health pings stop.
- Use `EnvironmentFile=-/etc/nestor.env` (the `-` makes it optional so first boot doesn't fail).
- Placeholders are simple `{{NAME}}` so the install script can do simple `sed` replacement.
- The kiosk service has to wait for X/Wayland — `After=graphical.target` plus `start-kiosk.sh` retries `xdpyinfo` until display is up.

---

## Dependencies

- **Blocked by:** none (parallelisable with foundation work)
- **Blocks:** STORY-19.5 (install script invokes these), STORY-19.7 (kiosk launcher script wiring), STORY-19.8 (in-app updater calls `systemctl restart`)

---

## Test Checklist

- [ ] Manual: install templates on a clean Ubuntu 24 container, services start
- [ ] Manual: kill the server process; systemd restarts it within 5s
- [ ] Manual: hang the server (no watchdog ping); systemd restarts via WatchdogSec
- [ ] Manual: `journalctl -u nestor-server -f` shows JSON Pino lines
- [ ] Manual: disable nestor-voice if no audio hardware; nestor-server still runs
- [ ] Manual: `systemctl restart nestor-server` cleanly drains and restarts

---

## Notes

- These templates are referenced by STORY-19.5 (install script) and STORY-19.8 (in-app updates that call `systemctl restart`).
- A future hardening pass should add `ProtectSystem=strict`, `NoNewPrivileges=yes`, `PrivateTmp=true` once paths are settled.

# STORY-19.5: Single-line install script

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** XL (5d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** user
**I want** `curl -fsSL https://get.nestor.app/install.sh | bash` to install everything
**So that** setup is one line

---

## Acceptance Criteria

- [ ] `install/install.sh` is idempotent (re-running on a configured machine does not break it)
- [ ] Installs: nvm + Node 20, SQLite, Chromium, Onboard, Piper, Whisper, OpenWakeWord, Python, ffmpeg
- [ ] Clones repo to `/opt/nestor`, builds, installs systemd services (STORY-19.6)
- [ ] Detects USB audio; warns if absent
- [ ] Detects orientation; sets `app_settings.orientation`
- [ ] Launches kiosk on success
- [ ] Tested in CI against fresh Ubuntu 24 container
- [ ] Helpful error messages with exit codes

---

## Technical Implementation

### Files to create / modify

- `install/install.sh`
- `install/lib/*.sh` (helpers split into modules: deps.sh, build.sh, services.sh, detect.sh)
- `install/uninstall.sh`
- `.github/workflows/install-test.yml`

### Implementation steps

1. Top of script:
```bash
#!/usr/bin/env bash
set -euo pipefail
NESTOR_DIR=${NESTOR_DIR:-/opt/nestor}
NESTOR_USER=${NESTOR_USER:-nestor}
LOG=/tmp/nestor-install.log
trap 'echo "Install failed at line $LINENO"; tail -50 "$LOG"' ERR
```
2. Phase: detect distro, ensure root.
3. Phase: install deps (`apt-get install -y curl gpg sqlite3 chromium-browser onboard ffmpeg python3-pip`).
4. Phase: install nvm + Node 20.
5. Phase: install voice deps (Piper binary, whisper.cpp build, OpenWakeWord pip).
6. Phase: create user `nestor`; clone repo.
7. Phase: `npm install && npm run build`.
8. Phase: install systemd templates (substituted).
9. Phase: detect USB audio (`aplay -l`); warn if missing.
10. Phase: detect orientation via `xrandr` if X is up, else default portrait; set `app_settings.orientation`.
11. Phase: enable + start `nestor-server.service`; on success launch kiosk.
12. Idempotency: each step checks "already installed" markers.
13. CI test: GitHub Actions job runs the script in a `ubuntu:24.04` container.

### Key technical details

- Architecture NFR-007.
- Use `set -euo pipefail`; trap ERR to print last 50 log lines.
- Detect distro: only `ubuntu` 22+/24+ supported in MVP; fail with helpful message otherwise.
- Voice deps download via curl with SHA256 verification.
- Risk R-10: heavy CI investment; idempotency limits damage on failure.

---

## Dependencies

- **Blocked by:** STORY-19.6, STORY-19.7
- **Blocks:** STORY-20.8 (release pipeline distributes the script)

---

## Test Checklist

- [ ] Manual: fresh Ubuntu 24 container → script completes
- [ ] CI: install-test workflow passes
- [ ] Manual: re-run is idempotent
- [ ] Manual: missing USB audio gracefully warns
- [ ] Manual: kiosk launches on success
- [ ] Manual: errors during install show meaningful message
- [ ] Manual: uninstall script reverses

---

## Notes

- The script is the linchpin of onboarding — heavy CI is justified.
- Voice deps are the largest install footprint; in MVP a `--no-voice` flag could skip them.

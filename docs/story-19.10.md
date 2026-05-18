# STORY-19.10: Robust screen rotation for kiosk displays

**Status:** complete

## Overview

The current install scripts hardcode rotation and touch calibration for a single specific device (iiyama/Melfas). This story replaces that with a robust, hardware-agnostic rotation solution that works across X11 and Wayland, auto-detects displays and touchscreens, and exposes a simple in-app UI so contributors and end-users never need to edit config files manually.

## Tasks

### Detection & backend abstraction
- [ ] Create `install/scripts/rotate-display.sh` — detects X11 vs Wayland, routes to the correct backend
- [ ] X11 path: `xrandr` to rotate display + `xinput` to auto-apply the correct Coordinate Transformation Matrix for any paired touch device
- [ ] Wayland path: `wlr-randr` (wlroots compositors) or `kscreen-doctor` (KDE) with graceful fallback messaging
- [ ] Auto-detect the connected display name (first connected output from `xrandr`/`wlr-randr`)
- [ ] Auto-detect the paired touchscreen (match `xinput list` against known touchscreen keywords; fall back to prompting)
- [ ] Pre-compute CTM for all four rotations (normal / right / inverted / left) so no manual matrix arithmetic is needed

### Xorg config generation
- [ ] Replace hardcoded `install/10-display-rotation.conf` and `install/90-touch-rotation.conf` with a generator script `install/scripts/gen-xorg-rotation.sh`
- [ ] Generator writes `/etc/X11/xorg.conf.d/10-display-rotation.conf` and `90-touch-rotation.conf` using the detected display identifier and touch device, for the chosen rotation
- [ ] Generated files include comments explaining each field so contributors can read and modify them

### In-app settings UI
- [ ] Add `app_settings.display_rotation` key (`'normal'|'right'|'inverted'|'left'`, default `'normal'`) to `settings-keys.ts`
- [ ] Settings page (Admin → Display) gains a Rotation selector: four labelled buttons with a simple arrow-icon preview
- [ ] On change: POST to new `POST /api/v1/admin/display/rotate` endpoint with `{ rotation: string }`
- [ ] Server endpoint shells out to `rotate-display.sh <rotation>` and persists to `app_settings.display_rotation`
- [ ] Immediate live feedback — the UI re-renders after the rotation is applied (CSS `transform` preview before committing)

### Setup wizard integration
- [ ] STORY-19.4 orientation wizard step calls `rotate-display.sh` for the live-preview rotate prompt (replaces the current placeholder)
- [ ] Wizard detects current rotation on load and pre-selects the matching button

### Persistence & boot
- [ ] `kiosk-init.sh` reads `app_settings.display_rotation` (via a small Node helper or sqlite3 CLI) and calls `rotate-display.sh` instead of hardcoded `xrandr --rotate right`
- [ ] Touch CTM applied from the same script using the precomputed matrix for the active rotation

### Documentation
- [ ] `install/DISPLAY-ROTATION.md` — setup guide covering: tested hardware list, how to add a new display, how to add a new touch device, Wayland notes, troubleshooting common failures (no xrandr, wrong CTM)

### Tests
- [ ] Unit tests for CTM matrix values for all four rotations
- [ ] Shell script integration test (bats or plain bash) for `rotate-display.sh --dry-run` output
- [ ] CI job runs the dry-run test on ubuntu-latest

## Notes

**Supported rotation values and their CTMs:**
- `normal` → identity matrix: `1 0 0 0 1 0 0 0 1`
- `right` (90° CW, portrait with right edge at top): `0 1 0 -1 0 1 0 0 1`
- `inverted` (180°): `-1 0 1 0 -1 1 0 0 1`
- `left` (270° CW / 90° CCW): `0 -1 1 1 0 0 0 0 1`

The Wayland path cannot always exec a live rotation from a subprocess spawned by Node — document that the generated Xorg conf is the reliable fallback for reboot-persistence, and that the live-rotate path requires the compositor to be running with appropriate permissions.

Contributors adding a new display hardware combo should add an entry to the tested hardware table in `DISPLAY-ROTATION.md` and, if the device requires a non-standard CTM, add it to the device overrides map in `rotate-display.sh`.

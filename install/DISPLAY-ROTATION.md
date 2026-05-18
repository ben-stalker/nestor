# Display Rotation Guide

`install/scripts/rotate-display.sh` is the single entry point for rotating the
Nestor kiosk display and its matched touchscreen. It auto-detects both devices at
runtime, so no device names need to be hardcoded anywhere.

## Supported rotations

| Value      | Physical orientation         | Coordinate Transformation Matrix (CTM) |
| ---------- | ---------------------------- | -------------------------------------- |
| `normal`   | Landscape (default)          | `1 0 0  0 1 0  0 0 1`                  |
| `right`    | Portrait — right edge at top | `0 1 0  -1 0 1  0 0 1`                 |
| `inverted` | Upside-down landscape        | `-1 0 1  0 -1 1  0 0 1`                |
| `left`     | Portrait — left edge at top  | `0 -1 1  1 0 0  0 0 1`                 |

The CTM is a 3x3 matrix that maps raw touch coordinates (which always come from
the sensor in its physical orientation) onto the rotated logical screen.

## Usage

```bash
# Rotate to portrait (right edge up) — standard Nestor wall-panel orientation
bash install/scripts/rotate-display.sh right

# Preview the commands without applying them
bash install/scripts/rotate-display.sh right --dry-run

# Restore landscape
bash install/scripts/rotate-display.sh normal
```

The script is also called automatically by `install/kiosk-init.sh` on every
X session start.

## How to add a new display

No change to the script is needed. `rotate-display.sh` uses `xrandr` to find the
first connected display output (e.g. `HDMI-1`, `DP-1`, `eDP-1`) automatically.

If your system has multiple connected displays and you want to target a specific
one, set `DISPLAY_NAME` before calling the script or edit the `get_display_name`
function to select the correct output.

## How to add a new touchscreen

No change is needed for most USB HID touchscreens. `rotate-display.sh` searches
for a device whose name contains "touch" (case-insensitive) via `xinput list`.

If your device uses a different naming convention, edit the `get_touch_device`
function in `rotate-display.sh`:

```bash
get_touch_device() {
  xinput list --name-only 2>/dev/null | grep -i "your-device-keyword" | head -1 || echo ""
}
```

To find your device name, run:

```bash
xinput list --name-only
```

## Wayland notes

`xrandr` and `xinput` are X11 tools. Under Wayland (e.g. GNOME on Wayland) they
are not available or have limited effect.

For Wayland use `wlr-randr` (wlroots compositors) or `gnome-randr` / `kscreen-doctor`
depending on your compositor, and set touch mapping via the compositor's input
configuration (e.g. `/etc/libinput/` or `swaymsg input`).

Nestor's kiosk service currently targets X11 (`DISPLAY=:0`). If you migrate to
Wayland, update the `[Service]` environment in `install/services/nestor-kiosk.service`
and replace calls to `rotate-display.sh` with the appropriate Wayland tool.

## Troubleshooting

**"No display detected. Is X running?"**
The script must run inside an X session. If called from a systemd service, ensure
`DISPLAY=:0` is set in the `[Service]` environment and the service depends on
`graphical.target`.

**Touch coordinates are wrong after rotation**
Run the script with `--dry-run` to verify which CTM would be applied, then apply
it manually with `xinput set-prop` to test. If the matrix looks correct but touch
is still wrong, your sensor may report coordinates differently — derive the correct
CTM by touching each corner and comparing reported vs expected values.

**Multiple touch devices**
`get_touch_device` returns the first match. If you have more than one touchscreen,
call `xinput set-prop` manually for each device with the same CTM.

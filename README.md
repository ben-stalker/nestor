# Nestor

A self-hosted family dashboard for the home.

> Full documentation coming in a later release. See `docs/` for architecture and planning docs.

## Getting Started

Requirements: Node 20 LTS (see `.nvmrc`)

```bash
npm install
npm run build
```

## Kiosk Hardware Setup (NUC)

Scripts for deploying Nestor as a touchscreen kiosk are in `install/`. Tested hardware:

- **NUC**: Intel NUC7i3DNK
- **Display**: iiyama ProLite T2454MSC (24" touch, portrait-mounted, right edge up)
- **Audio**: JABRA Speak 510 USB speakerphone

Run `sudo bash install/setup-nuc.sh` on a fresh Ubuntu 24.04 Desktop install.

### Touchscreen notes (iiyama ProLite T2454MSC)

The touch controller identifies as `Melfas LGDisplay Incell Touch` (USB `1fd2:8102`).

**Driver**: must use `xf86-input-evdev`, not libinput. With libinput the device is registered as an XI2 TOUCHSCREEN type and cursor does not respond to touch. The file `install/90-touch-rotation.conf` forces evdev for this device.

**Portrait rotation + coordinate mapping**: the display is rotated at runtime via `xrandr --rotate right` in `kiosk-init.sh`. Because evdev maps raw ABS coordinates to the post-xrandr logical screen, a Coordinate Transformation Matrix (CTM) must be applied _after_ `xrandr` to remap touch axes to the rotated display:

```
xinput set-prop "Melfas LGDisplay Incell Touch" \
  "Coordinate Transformation Matrix" \
  0 1 0 -1 0 1 0 0 1
```

This maps portrait X → raw ABS_Y and portrait Y → (1 − raw ABS_X), matching the physical orientation where the monitor's right landscape edge is at the top in portrait mode. The `sleep 1` before the CTM in `kiosk-init.sh` ensures xrandr has finished before the matrix is applied.

**Do not** use evdev `SwapAxes`/`InvertY` in `xorg.conf.d` — this conflicts with the runtime xrandr rotation and produces incorrect motion direction.

## License

MIT — see [LICENSE](LICENSE).

# Hardware

Nestor runs on a mini PC or Raspberry Pi connected to a touchscreen. The install script targets Ubuntu 22+; the kiosk service launches Chromium in kiosk mode on the attached display.

## Recommended configurations

### Option 1 — Intel NUC (primary reference platform)

| Component | Recommendation | Approx cost |
|---|---|---|
| Mini PC | Intel NUC 6th/7th-gen i3 (refurbished, e.g. NUC7i3DNK) | £50–£70 |
| Display | iiyama ProLite T2454MSC 24" or T2756MSC 27" (capacitive touch, HDMI, VESA) | £350–£550 |
| OS | Ubuntu 24.04 LTS Desktop | Free |
| Storage | 120 GB+ SSD (already in most NUCs) | — |
| Audio | Jabra Speak 410 or 510 (USB, bus-powered) | £40–£80 used |

### Option 2 — Raspberry Pi 5

| Component | Recommendation | Approx cost |
|---|---|---|
| SBC | Raspberry Pi 5 8 GB | ~£80 |
| Display | Raspberry Pi 7" Official Touchscreen (capacitive, DSI) | ~£55 |
| Storage | 64 GB+ microSD (Class 10 / A2) or USB SSD | £10–£30 |
| Case | Official Pi 5 case with fan | ~£12 |
| Audio | USB speakerphone (see above) | £40–£80 |
| OS | Ubuntu 24.04 LTS (64-bit, arm64) | Free |

## Audio

Voice features (wake word, speech-to-text, text-to-speech) require a USB audio device with a microphone. Tested with:

- **Jabra Speak 410** — USB, bus-powered, excellent pickup range
- **Jabra Speak 510** — USB + Bluetooth, similar performance

The installer auto-detects USB audio via `aplay -l`. If no USB audio is found, `nestor-voice` is not installed and voice features are disabled in the UI. You can install the voice service later by re-running the service installer with `--voice`.

## Network

Ethernet is recommended for reliable CalDAV sync and plugin API calls. WiFi works but can cause intermittent sync delays.

For remote access from outside the home network, Nestor supports Tailscale (VPN). See Admin → Remote Access in the app.

## Portrait rotation (iiyama ProLite T2454MSC)

The iiyama T2454MSC is typically mounted in portrait orientation (right landscape edge at the top). Rotation is handled at runtime in `install/kiosk-init.sh`:

```bash
xrandr --rotate right
```

Because evdev maps raw absolute coordinates to the post-xrandr logical screen, a Coordinate Transformation Matrix (CTM) must be applied after `xrandr`:

```bash
xinput set-prop "Melfas LGDisplay Incell Touch" \
  "Coordinate Transformation Matrix" \
  0 1 0 -1 0 1 0 0 1
```

The `sleep 1` before the CTM in `kiosk-init.sh` ensures xrandr has completed before the matrix is applied.

The file `install/90-touch-rotation.conf` forces `xf86-input-evdev` for the iiyama touch controller (`USB 1fd2:8102`). **Do not** use libinput for this device — it registers as an XI2 TOUCHSCREEN type and the cursor does not respond to touch.

**Do not** use evdev `SwapAxes`/`InvertY` in `xorg.conf.d` — this conflicts with the runtime xrandr rotation.

## Raspberry Pi display rotation

For the official 7" DSI display, add to `/boot/firmware/config.txt`:

```
display_rotate=1
```

Then configure the touch CTM as above, substituting your device name from `xinput list`.

## Minimum hardware requirements

| | Minimum | Recommended |
|---|---|---|
| RAM | 2 GB | 4 GB+ |
| Storage | 32 GB | 64 GB+ |
| CPU | Dual-core 1.5 GHz | Quad-core 2 GHz+ |
| Display | Any HDMI with USB touch | Capacitive multi-touch, 1080p+ |

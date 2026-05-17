# STORY-17.5: Display & behaviour admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household admin
**I want** to configure orientation, idle timeouts, night mode, screensaver
**So that** the screen behaves as I want

---

## Acceptance Criteria

- [ ] Display section at `/admin/display`
- [ ] Orientation: auto/portrait/landscape with live preview
- [ ] Idle dim timeout (default 90s)
- [ ] Sleep timeout (default 10min) — triggers DPMS off
- [ ] Night mode: dark theme + auto-dim window (e.g. 22:00–07:00)
- [ ] Screensaver: photo folder picker, transition speed
- [ ] Renter mode toggle (used by STORY-8.6)
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/DisplayPanel.tsx`
- `client/src/admin/OrientationPicker.tsx`
- `server/src/routes/system.ts` — `POST /api/v1/system/dpms` admin endpoint shells out to `xset dpms force off`
- `server/src/services/SystemControl.ts`
- `client/tests/admin/DisplayPanel.test.tsx`

### Implementation steps

1. Form fields:
   - Orientation segmented control.
   - Idle dim slider (seconds).
   - Sleep timeout slider (minutes).
   - Night mode start/end (time pickers).
   - Screensaver: folder path input + transition speed slider.
   - Renter mode toggle.
2. On save: PATCH `app_settings`; dispatch updates so `<AppShell>` re-evaluates orientation; idle timer hook (STORY-2.12) reads new values.
3. Server `system/dpms` shells out via `child_process.exec('xset dpms force off')`; fails gracefully if not available.
4. Live preview pane: iframe-style mock device showing portrait/landscape rotation.
5. Tests: form persists; orientation change reflects in shell; renter mode toggle propagates.

### Key technical details

- PRD §8 screen sleep & brightness.
- DPMS shell command runs as nestor user; on Wayland `xset` may not work — also try `swaymsg output *_dpms off`. Fail gracefully; document in hardware guide.
- Brightness control via `ddcutil` if present (nice-to-have; gracefully fall back to CSS overlay dim).

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-2.6
- **Blocks:** STORY-2.12 (idle timer P2 reads settings here)

---

## Test Checklist

- [ ] RTL: orientation toggle changes preview
- [ ] RTL: idle/sleep sliders persist
- [ ] RTL: night mode time pickers persist
- [ ] RTL: renter mode toggle persists
- [ ] Unit: DPMS endpoint shells out (mock exec)
- [ ] Unit: DPMS gracefully handles missing `xset`

---

## Notes

- The screensaver (P2) only enabled when a folder is set; otherwise UI hides it.
- Brightness via `ddcutil` is best-effort; documented in hardware guide.

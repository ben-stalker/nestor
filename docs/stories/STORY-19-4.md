# STORY-19.4: Wizard step content — display, orientation, voice, features, plugins

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** new user
**I want** to confirm orientation, optionally set up voice, choose nav modes, browse plugins
**So that** I finish setup with a configured Nestor

---

## Acceptance Criteria

- [ ] Display step: brightness/idle/night-mode/screensaver folder
- [ ] Orientation step: live preview rotate prompt; auto-detect via screen aspect
- [ ] Voice step: optional; record wake-word samples (link to flow STORY-15.2)
- [ ] Features step: nav-mode toggles
- [ ] Plugins step: list official plugins with one-tap install
- [ ] Done step: summary + "Finish" button

---

## Technical Implementation

### Files to create / modify

- `client/src/wizard/steps/DisplayStep.tsx`
- `client/src/wizard/steps/OrientationStep.tsx`
- `client/src/wizard/steps/VoiceStep.tsx`
- `client/src/wizard/steps/FeaturesStep.tsx`
- `client/src/wizard/steps/PluginsStep.tsx`
- `client/src/wizard/steps/DoneStep.tsx`

### Implementation steps

1. `<DisplayStep>`: reuse `<DisplayPanel>` (STORY-17.5) inline.
2. `<OrientationStep>`:
   - Auto-detect via `window.innerWidth/innerHeight`.
   - Live preview asking "Rotate the screen so this face is up".
   - Save to `app_settings.orientation`.
3. `<VoiceStep>`:
   - "Detect audio hardware" check via `/api/v1/voice/status`.
   - If detected: optional — Skip or "Train wake word now" (jumps to STORY-15.2 flow).
   - If not detected: shows "No audio device" message.
4. `<FeaturesStep>`: nav-mode toggles (subset of STORY-17.6 navigation panel).
5. `<PluginsStep>`:
   - Lists official plugins (Tesla, Eufy, AI Assistant, Garden Pal stub) — Phase 2 in MVP, so panel reads "Plugins arrive in Phase 2; check back after the next update". Or hides itself for MVP.
6. `<DoneStep>`: summary card with completed/skipped step list; "Finish" sets `setup_complete=true`.
7. Tests: each step persists to settings; auto-detect orientation works.

### Key technical details

- Voice hardware detection: hits voice service health (STORY-15.1); offline → graceful skip.
- Plugins step: for MVP (16.1, 16.4 only), display "coming soon" cards. Real plugin install lives in Phase 2 (STORY-16.3).
- Orientation auto-detect: `mediaQueryList('(orientation: portrait)')`.

---

## Dependencies

- **Blocked by:** STORY-19.1, STORY-15.2, STORY-16.3
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: display step persists
- [ ] RTL: orientation auto-detected
- [ ] RTL: voice step shows "no audio" when offline
- [ ] RTL: features step toggles persist
- [ ] RTL: plugins step lists officials
- [ ] RTL: Finish sets setup_complete

---

## Notes

- Voice training is optional; full pipeline lands in Phase 2 (Sprint 12-13). For MVP, the voice step is "I'll set this up later".
- Plugins listing is a placeholder for MVP — real install workflow is Phase 2.

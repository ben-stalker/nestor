# STORY-17.7: Voice & Audio admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P2
**Status:** completed

---

## User Story

**As a** household admin
**I want** a Voice & Audio settings panel
**So that** I can configure wake word, TTS, quiet hours, and audio chimes

---

## Acceptance Criteria

- [x] Voice enable/disable toggle; shows hardware-not-found warning when unavailable
- [x] Hub name input (max 50 chars)
- [x] STT model selector (tiny/base/small)
- [x] TTS voice input and speed slider (0.5–2.0×)
- [x] "Retrain wake word" button triggers `POST /api/v1/voice/wakeword/start-training`
- [x] Quiet hours toggle with start/end time pickers
- [x] Audio chimes volume slider and per-module enable toggles
- [x] All changes saved via `PATCH /api/v1/settings`

---

## Technical Implementation

### Files created / modified

- `client/src/admin/VoicePanel.tsx` — complete voice & audio settings panel
- `client/src/admin/AdminPage.tsx` — lazy-loads VoicePanel as 'voice' section

### Key implementation details

- Detects audio hardware via `GET /api/v1/voice/status`; shows warning banner if unavailable
- Reuses `audioChime.ts` (Web Audio API) for chimes preview in admin panel
- TTS speed slider 0.5–2.0× step 0.1, stored as `voice_tts_speed` setting
- Hub name stored as `voice_hub_name`, wake word model as `voice_wakeword_model_path`
- Quiet hours stored as `voice_quiet_hours_enabled`, `voice_quiet_hours_start`, `voice_quiet_hours_end`
- Form fields accessed as `f.voice_hub_name` etc. (not destructured) to satisfy naming-convention lint
- Wake word retrain sends `POST /api/v1/voice/wakeword/start-training` and shows feedback toast

---

## Dependencies

- **Blocked by:** STORY-17.1 (admin shell), STORY-15.x (voice pipeline)
- **Blocks:** None

---

## Test Checklist

- [x] VoicePanel renders without errors
- [x] All form fields update local state
- [x] Save dispatches PATCH /api/v1/settings with correct keys
- [x] Retrain button calls wakeword training endpoint
- [x] Lint + typecheck clean

---

## Notes

- Quiet hours gate is also enforced server-side in TtsQueue.ts (STORY-15.6)
- Audio chimes volume/categories are stored as `audio_chime_volume` / `audio_chime_categories`

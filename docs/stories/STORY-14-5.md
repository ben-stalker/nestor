# STORY-14.5: Audio chime per alert category

**Epic:** EPIC-14: Alert System
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P2
**Status:** pending

---

## User Story

**As a** household admin
**I want** optional audio chimes per alert category
**So that** important alerts are audible

---

## Acceptance Criteria

- [ ] Per-category toggle in Settings → House → Notifications (or Audio admin)
- [ ] Chime plays in browser via Web Audio API for clients in foreground
- [ ] Audio respects quiet hours (`app_settings.quiet_hours`)
- [ ] Different chime per severity (urgent / warning / info / success)
- [ ] Volume slider in admin

---

## Technical Implementation

### Files to create / modify

- `client/src/alerts/audioChime.ts`
- `client/src/alerts/wsListener.ts` — extend to play chime
- `client/public/audio/chime-{urgent,warning,info,success}.mp3`
- `client/src/admin/sections/AudioPanel.tsx` — toggles per category
- `client/tests/alerts/audioChime.test.ts`

### Implementation steps

1. Pre-load audio buffers via Web Audio API:
```ts
const ctx = new AudioContext();
const buffers = {};
async function load() {
  for (const sev of ['urgent','warning','info','success']) {
    const arr = await fetch(`/audio/chime-${sev}.mp3`).then(r => r.arrayBuffer());
    buffers[sev] = await ctx.decodeAudioData(arr);
  }
}
```
2. On `alert:new` WS frame:
```ts
function play(severity) {
  if (isQuietHours()) return;
  if (!isCategoryEnabled(alert.source_module)) return;
  const src = ctx.createBufferSource();
  src.buffer = buffers[severity];
  const gain = ctx.createGain();
  gain.gain.value = volumeFromSettings();
  src.connect(gain).connect(ctx.destination);
  src.start();
}
```
3. `isQuietHours()` reads `app_settings.quiet_hours` { start: 'HH:mm', end: 'HH:mm' }.
4. Admin toggles persist `app_settings.audio_chime_categories`.
5. Tests: WS frame plays sound; quiet hours suppresses; category toggle suppresses.

### Key technical details

- Web Audio API requires user gesture before first play — consume a tap to "unlock" the audio context at app boot (kiosk autoplays after first interaction).
- Chime files are short (~0.5s) WAV/MP3.
- Volume slider scales the gain node.

---

## Dependencies

- **Blocked by:** STORY-14.4
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: WS alert:new triggers play (mock AudioContext)
- [ ] Unit: quiet hours suppress
- [ ] Unit: category disabled suppresses
- [ ] Unit: volume slider scales gain
- [ ] Manual: real audio playback test

---

## Notes

- Bin `audio_chime` flag (STORY-8.3) is fed via the alert payload.
- Tesla "fully charged" (STORY-16.8) plays the success chime.

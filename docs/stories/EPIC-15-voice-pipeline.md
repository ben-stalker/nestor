# EPIC-15: Voice Pipeline

Separate voice process with OpenWakeWord + Whisper + Piper, voice command router, IPC to Express, quiet hours.

## Stories

- [x] STORY-15.1: Voice process bootstrap + systemd service
- [x] STORY-15.2: OpenWakeWord integration with custom wake-word training
- [x] STORY-15.3: Whisper STT integration
- [x] STORY-15.4: Voice command router (core built-ins)
- [x] STORY-15.5: Piper TTS integration + queue
- [x] STORY-15.6: Voice listening indicator over WebSocket
- [x] STORY-15.7: Quiet hours enforcement
- [x] STORY-15.8: Voice command history admin view
- [x] STORY-15.9: Voice fallback when hardware missing

## Architecture

```
[USB Mic] → OpenWakeWord (Python) → Whisper.cpp → transcript
    ↓
voice/process.ts (port 3001)
    ↓ POST /internal/voice/command
main Express server → VoiceRouter → nav:goto / nav:date WS events
    ↓
clients ← WebSocket broadcast
```

IPC auth: `voice_internal_token` setting (shared secret).

Voice process also exposes:
- `GET /internal/voice/status` — health
- `POST /internal/voice/tts` — TTS queue input
- `POST /internal/voice/wakeword/samples` — upload training sample
- `POST /internal/voice/wakeword/train` — trigger training

## Implementation Notes

- Voice is fully optional; graceful degradation throughout (STORY-15.9)
- Quiet hours gate both TTS and audio chimes (reuses existing quiet_hours setting)
- Voice command log stored in `voice_command_log` table (migration 022)
- Settings added: `voice_wakeword_model_path`, `voice_stt_model`, `voice_enabled`

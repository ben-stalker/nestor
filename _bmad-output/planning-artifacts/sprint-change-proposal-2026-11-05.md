# Sprint Change Proposal — Integration Onboarding & Deployment Reliability

Date: 2026-11-05 · Project: nestor · Mode: incremental · Scope: **Major** (new epics, replan)

## 1. Issue summary

First NUC deploy produced a flat/unstyled UI and no working integrations. Investigation (see `docs/integration-audit-2026-11-05.md`) found:

- Deployment defects (fixed in f1b7f67): server unit missing `NODE_ENV=production`, bogus watchdog, wrong node path/version.
- Integrations were built against mocks. Several have real code but **no way to configure them** (no UI for weather location, Google OAuth client, etc.), the installer provisions none of the voice binaries, Tesla needs a hand-pasted expiring token, and Eufy / Garden Pal / journey time are stubs.
- 188 stories were marked done on the strength of mocked tests; the tests do not prove integrations work.

## 2. Impact analysis

- **Epics:** 3, 4, 15, 16, 19 reopened (done → in-progress/backlog). Epics 23, 24, 26, 27 (all backlog, never started) are superseded by new epics 33, 36, 37, 38. Epic 20-osk renumbered to 39.
- **Stories:** 25 stories reopened in sprint-status (see audit doc); old stories remain as history, new stories carry the work.
- **PRD:** unchanged in intent; journey time (§9, §12) moves to phase 2; Garden Pal to an "eventually" list; voice stack choice (§22 / architecture AD-06) becomes spike-dependent.
- **Architecture:** add an Integrations hub (credential store + test-connection contract) as a first-class concept; voice stack may change from whisper.cpp to whichever the spike selects.
- **UX:** no UX artifact exists; onboarding flows are UI work and should get a short `bmad-ux` pass before epic 32.2.
- **Technical risks:** Google's device-code OAuth flow likely disallows Calendar scopes (to be confirmed in 33.1); Eufy client is unofficial (possible Node 24 requirement vs project Node 22); Tesla Fleet API needs a registered developer app; free-tier Gemini limits and model names are in flux.

## 3. Recommended approach

**Direct adjustment with replan.** Keep working code; add a foundation epic first (hub, location, smoke test), run three risk spikes early (Google OAuth, voice stack, Eufy), then build each integration with an explicit **live-verification** story as its definition of done. No story in epics 33-38 is `done` until verified on real accounts/hardware.

Effort: large (7 epics, ~35 stories). Risk: medium-high, concentrated in the three spikes. Order: 32 → {33.1, 34.1, 38.1 spikes} → 33, 35 → 34 → 36, 37 → 38.

## 4. Detailed stories

### Epic 32: Deploy & first-run foundation

- **32.1 Fresh-install smoke test.** Script run after `install.sh`: services active, `/` returns HTML, the CSS asset returns 200 `text/css`, `/api/v1/health` ok, journal has no errors. Run on the NUC before any other work.
- **32.2 Integrations hub.** Admin → Integrations page: one card per integration with status (not configured / connected / error), credential fields stored encrypted (existing AES helper), a "Test connection" button backed by a common server contract, last-error display.
- **32.3 Location setup.** Place search (Open-Meteo geocoding), saves the `location` setting, triggers an immediate weather refresh; weather widget shows data. Wizard step uses it.
- **32.4 Wizard → hub integration.** Wizard steps for calendars and plugins deep-link to the hub; every step skippable.
- **32.5 Repair stale tests.** Fix 7 client tests (NavBar, HomePage) and 5 e2e failures (02-profile-switch, 06-vehicle-booking).

### Epic 33: Calendars (Google, Apple, Yahoo)

- **33.1 Spike: Google OAuth for Calendar.** Confirm whether device-code flow allows Calendar scope; choose between loopback/code flow via the kiosk browser, a QR hand-off to a phone, or CalDAV with app credentials. Output: decision note.
- **33.2 Google onboarding.** In-app guide for creating the Google Cloud OAuth client (test-mode caveats), client id/secret via hub, chosen flow, token refresh.
- **33.3 Apple iCloud onboarding.** App-specific-password guide, CalDAV discovery, test connection.
- **33.4 Yahoo onboarding.** App-password guide, CalDAV discovery, test connection.
- **33.5 Sync status & errors.** Per-account last-sync/error in UI, manual "sync now", failures raise an alert.
- **33.6 Live verification** against real Google, iCloud and Yahoo accounts (create/edit/recurring events round-trip).

### Epic 34: Voice v2

- **34.1 Spike: voice stack benchmark on the NUC.** Compare whisper.cpp, faster-whisper (int8), Moonshine and Parakeet for latency/accuracy/RAM; confirm openWakeWord and Piper still fit. Output: decision note with numbers.
- **34.2 Installer provisions voice stack.** Idempotent install of chosen binaries and models with checksums; USB audio detection.
- **34.3 Integrate chosen engine** into the voice pipeline behind the existing runner interface.
- **34.4 Voice diagnostics UI.** Mic level check, test utterance, per-component status (wake/STT/TTS) so failures are visible.
- **34.5 Live verification** on the NUC with the real USB speakerphone.

### Epic 35: AI assistant (Gemini Flash)

- **35.1 Gemini client with configurable model id and API key** via the hub; default is a current Flash model verified at implementation time.
- **35.2 Voice → AI routing.** Transcripts not matched by built-in commands go to the assistant; spoken reply through TTS.
- **35.3 Quota handling and privacy notice.** Graceful 429 handling, per-day usage counter, clear note that free-tier prompts may be used by Google.
- **35.4 Live verification** with a real key.

### Epic 36: Tesla

- **36.1 Developer-app setup guide** and client id/secret stored via the hub; region (NA/EU) selection.
- **36.2 OAuth authorization + token refresh** replacing the pasted token.
- **36.3 Re-wire existing plugin** (battery widget, low-battery and charge-complete alerts, TTS) onto refreshed tokens; respect API cost (poll interval, wake-ups avoided).
- **36.4 Virtual key pairing guide and commands** (optional, after read-only works).
- **36.5 Live verification** on a real vehicle.

### Epic 37: Octopus Energy

- **37.1 Onboarding:** API key + account number, auto-discover MPAN/serial/tariff, test connection via hub.
- **37.2 Live verification** with a real account: consumption sync, tariff display, alerts.

### Epic 38: Eufy

- **38.1 Spike: `eufy-security-client`.** Node version requirement, 2FA/captcha login flow, event support, maintenance state. Go/no-go.
- **38.2 Login onboarding** including 2FA/captcha challenge UI.
- **38.3 Doorbell ring → alert + TTS.**
- **38.4 Camera snapshots/feeds.**
- **38.5 Spike: RoboVac control** (separate library; not part of the security client).
- **38.6 Live verification** with real devices.

### Housekeeping

- Renumber `docs/stories/EPIC-20-osk.md` → epic 39 (backlog, untouched).
- Superseded (marked, not deleted): epics 23, 24, 26, 27.
- Deferred: journey time (3.7, 31.1) → phase 2; Garden Pal (16.11) → eventually list. Epics 25, 28, 29, 30, 31 stay backlog.

## 5. Implementation handoff

Scope **Major**: Architect (Winston) to confirm the Integrations hub design before 32.2; UX (Sally) for onboarding flows; then Developer (Amelia) via `bmad-build`. Success criteria: fresh NUC install passes 32.1; every day-one integration has a passing live-verification story before it is marked done.

## 6. Research notes (2026-11-05, web search; verify before relying)

- **Day-one scope (decided by owner):** Google, Apple and Yahoo calendars; Tesla; Octopus; Eufy; voice with an AI assistant using Gemini Flash on the free tier. Journey time is phase 2; Garden Pal is an "eventually" item.
- **Speech-to-text:** Whisper no longer leads on every axis. Parakeet is fast but needs ~16 GB RAM and covers fewer languages; Moonshine suits constrained hardware like a Raspberry Pi; faster-whisper / whisper.cpp (int8) are the safe CPU choices for the NUC. No source benchmarked NUC or Pi hardware, so story 34.1 must measure. Sources: https://www.assemblyai.com/blog/top-open-source-stt-options-for-voice-applications , https://www.onresonant.com/resources/local-stt-models-2026 , https://localaimaster.com/blog/best-local-speech-to-text-models
- **Wake word:** openWakeWord remains the standard server-side option; microWakeWord targets ESP32-class devices. Nothing found on Piper alternatives. Source: https://home-assistant.io/voice_control/about_wake_word
- **Gemini free tier:** sources disagree on current Flash model names (2.5 / 3.5 / 3.8) and limits (~10-15 req/min, 250-1,500 req/day); free-tier prompts may be used by Google; Pro models removed from the free tier. Model id must be a setting. Check ai.google.dev. Sources: https://www.morphllm.com/gemini-api-pricing , https://yingtu.ai/en/blog/google-gemini-api-free-tier-limits-2026
- **Tesla Fleet API:** personal use has a monthly credit (~EUR 10) then pay-per-use; requires a registered developer app and OAuth; commands need a virtual key paired in the car, read-only data does not. Source: https://docs.evcc.io/de/vehicles/tesla.md . Check developer.tesla.com for current pricing.
- **Eufy:** `eufy-security-client` supports 2FA/captcha login and doorbell events but is an unofficial spare-time project; one source says it needs Node 24 (project targets Node 22). Vacuum control is not part of it. Source: https://www.npmjs.com/package/@rfnovo/eufy-security-client
- **Google Calendar OAuth (unverified belief):** Google's device-code flow is believed not to allow Calendar scopes, which would make the existing flow unworkable. Not confirmed by search; story 33.1 must check Google's docs.

# Integration & Deployment Audit — 2026-11-05

Purpose: first NUC deploy had a flat/unstyled UI and no working integrations. This records what the code actually contains, so stories can be re-planned (`bmad-correct-course`). Evidence is from reading the code and running the test suites on a dev box, not from hardware.

## Test baseline (Node 24, dev box)

| Suite | Result |
|---|---|
| typecheck | clean |
| lint | 0 errors, 1459 warnings (i18n literal strings) |
| server (jest) | 1170/1170 pass |
| client (vitest) | 684/691 pass. Failing: 6 in `tests/core/NavBar.test.tsx`, 1 in `tests/features/home/HomePage.test.tsx` (stale vs recent UI commits) |
| e2e (playwright) | 28 pass, 5 fail (4 in `02-profile-switch`, 1 in `06-vehicle-booking`), 2 skipped |

All server tests use mocks, so passing says nothing about real integrations.

## Deployment defects (fixed in f1b7f67)

- `nestor-server.service` lacked `NODE_ENV=production`; Express only serves `client/dist` in production.
- `WatchdogSec=30` with no sd_notify in the server.
- ExecStart path `/usr/bin/node` vs installer's `/usr/local/bin/node` link; installer installed Node 20 and accepted v20/21, but engines require >=22; silent `npm install`.
- Still unverified on hardware. A production build from the repo renders correctly in headless Chromium, so the flat UI was a deploy problem, not a build problem.

## Integration status

| Area | Code state | Why it would not work out of the box |
|---|---|---|
| Weather (Open-Meteo) | Real client (`WeatherService`) | Scheduler reads app setting `location`; no client UI sets it, so refresh is skipped forever |
| Google Calendar | Real device-flow OAuth + CalDAV provider | Needs `google_oauth_client_id`/`secret` (setting or env); no UI to enter them, no docs on creating a Google Cloud OAuth client; unverified against real Google |
| Apple iCloud / Yahoo calendar | Real basic-auth CalDAV provider | Unverified against real services; needs app-specific passwords, not documented in UI |
| Term dates | Real service | Unverified |
| Journey time | Only a no-op stub adapter (`isStub`, fixed mock time) | No real adapter (TfL / National Rail); EPIC-31.1 covers it |
| Octopus Energy | Real client, sync job, settings UI (`OctopusSettings.tsx`) | Unverified with a real API key/account; later epic 26 is backlog |
| Voice (wake word / STT / TTS) | Real runners shelling out to `whisper-cli`, `piper`, OpenWakeWord | Installer does not install any of these binaries or models (only `python3-pip`); falls back silently |
| Tesla plugin | Real fleet-API polling | Requires a hand-pasted access token (expires, no refresh/OAuth flow), North-America API host only, needs Tesla developer app registration |
| Eufy plugin | Stub: `init` logs "live client integration not yet implemented"; `eufy-security-client` not a dependency | No integration exists |
| AI assistant plugin | Real Gemini call | Uses retired-style `gemini-pro` model id; needs API key; unverified |
| Garden Pal plugin | Stub (`status: 'stub'`, empty events) | No integration exists |
| YouTube player plugin | Real | Unverified |
| In-app updates | `UpdateService` exists | Scheduler `github-update-poll` and `vacuum-db` jobs are placeholders; `POST /system/rollback` returns 501 |
| Community plugin install | `POST /plugins/community/install` placeholder | Not implemented |

## Sprint-status changes made

Reopened to `backlog` (code missing/stub): 3-7, 16-9, 16-11.
Reopened to `in-progress` (code exists but unreachable/unverified): 3-1, 4-5, 4-6, 4-11, 15-1, 15-2, 15-3, 15-5, 16-7, 16-8, 16-10, 16-12, 16-13, 19-5, 19-6, 19-7, 19-8 and epics 3, 4, 15, 16, 19.

Not yet re-planned: epics 23-31 (all backlog, unverified), the stale client/e2e tests, and the epic-20 numbering collision with `docs/stories/EPIC-20-osk.md`.

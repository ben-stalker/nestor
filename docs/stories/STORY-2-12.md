---
id: STORY-2.12
title: Idle timer, screen dim and DPMS sleep
epic: EPIC-2
status: completed
---

## User Story
As a household, I want the screen to dim after idle and sleep after extended idle,
so that the screen doesn't burn in or distract at night.

## Acceptance Criteria
- [x] `useIdleTimer` hook detects no touch for configurable durations (defaults: 90s, 10min)
- [x] At first threshold: CSS overlay dims to ~10% (or DDC/CI brightness via server endpoint if available)
- [x] At second threshold: server triggers OS DPMS off via `xset dpms force off` (admin-only endpoint)
- [x] Any touch wakes immediately
- [x] Night mode (configurable hours): dark theme + dimmer dim level
- [x] All thresholds configurable via Settings

## Tasks
- [x] Add idle/night-mode settings keys (server + client types)
- [x] `POST /api/v1/admin/dpms-off` endpoint (shells xset, fail gracefully)
- [x] `POST /api/v1/admin/brightness` endpoint (shells ddcutil, fail gracefully)
- [x] `useIdleTimer` hook (dim + sleep thresholds, reset on any activity)
- [x] `IdleOverlay` component (CSS dim layer + night mode)
- [x] Night mode: apply dark theme + dimmer opacity level
- [x] Wire `IdleOverlay` into `AppShell`
- [x] Server tests (dpms-off + brightness endpoints)
- [x] Client tests (useIdleTimer + IdleOverlay)

## Implementation Notes
Server: 7 new idle/night-mode settings keys added to `settings-keys.ts`.
`POST /api/v1/admin/dpms-off` shells `xset dpms force off`; `POST /api/v1/admin/brightness`
shells `ddcutil setvcp 10 <level>`. Both respond 204 immediately and log+ignore errors
gracefully if the tool is absent.

Client: `useIdleTimer` hook tracks pointer/touch/keyboard/scroll events on `window`; fires
`setIdleState('dim')` at `dimAfterMs` and `setIdleState('sleep')` at `sleepAfterMs` (from
first inactivity). Any activity event calls `wake()` which resets both timers. `IdleOverlay`
reads all thresholds from `useAppSettings()`, determines whether current time falls in the
configured night window (`isInNightWindow` handles midnight-crossing ranges), and sets
`--idle-opacity` CSS custom property on a `position:fixed; z-index:60` overlay. `onSleep`
callback fires `triggerDpmsOff()` and, during night mode, sets `data-theme=dark` on `<html>`;
`useEffect` removes it on wake.

Tests: 7 new server tests (211 total); 19 new client tests — 8 `useIdleTimer` unit tests
(timer firing, reset, cleanup) + 11 `IdleOverlay` rendering tests (dim levels, night mode,
wake, a11y, settings pass-through). `useIdleTimer` mocked in `IdleOverlay` tests to avoid
React 18 concurrent-scheduler / fake-timer interaction issues. lint + typecheck clean.

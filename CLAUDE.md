# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Nestor is a self-hosted household dashboard for a touchscreen kiosk (Chromium loads the React SPA served by a single Node process; data lives in local SQLite). Target hardware is an Intel NUC or a Raspberry Pi 5 on Ubuntu. See `README.md` and `docs/architecture-nestor-2026-05-08.md` for the full picture.

## Commands

npm workspaces monorepo (`server`, `client`, `plugins/*`). Node >=22 (`.nvmrc`; CONTRIBUTING/README still say 20, which is stale). Run from the repo root unless noted.

```bash
npm install
npm run dev            # server (tsx watch, :3000, override with NESTOR_PORT) + Vite client (:5173, proxies /api to :3000)
npm run typecheck      # tsc -b --noEmit
npm run lint           # eslint in every workspace
npx prettier --check . # CI runs this too
npm run test           # jest (server) + vitest (client)
npm run build
npm run e2e            # Playwright (chromium only, 1 worker); global-setup seeds a test DB and starts the server via tsx
```

Single tests:

```bash
npm test -w @nestor/server -- tests/path/to/file.test.ts     # jest; also: -t "name pattern"
npm test -w @nestor/client -- tests/appStore.test.ts         # vitest run
npx playwright test e2e/03-add-event.spec.ts
```

Server coverage (CI enforces 80% lines/functions on `src/services` and `src/repositories`): `cd server && npx jest --coverage`.
`npm run db:reset -w @nestor/server` deletes the dev DB (`NESTOR_DB_PATH` or `~/.nestor/nestor.db`).

Pre-commit (husky + lint-staged) runs eslint --fix and prettier on staged files. CONTRIBUTING.md mentions an `npm run test:e2e` script that does not exist; use `npm run e2e`.

## Architecture

**Server (`server/src`)** — Express 5 modular monolith, layered as `routes/` → `services/` → `repositories/` → better-sqlite3. One `*Repository` per table group, all extending `BaseRepository`. `app.ts` wires everything together (repositories, services, routers, plugin manager). Other pieces:

- `db/migrationRunner.ts` applies `server/migrations/NNN_name.sql` in order (filename must match `^\d{3}_[a-z0-9_]+\.sql$` or it is skipped with a warning); `000_applied_migrations.sql` bootstraps the tracking table. Add schema changes as a new numbered migration, never edit applied ones.
- `middleware/` handles per-profile auth and permissions (`requireProfile`, `requirePermission`, `requireAdminPin`, `kioskLock`).
- `core/eventBus.ts` is an in-process event bus; `scheduler/` runs node-cron jobs (calendar sync, alert generation); `ws/` is the WebSocket server.
- `services/*AlertService.ts` feed a central alert aggregator.
- Calendar sync (CalDAV via tsdav, ical.js) lives in `services/calendar` and `CalendarService.ts`.
- `voice/` is the voice pipeline (OpenWakeWord, Whisper STT, Piper TTS), designed to run as a separate child process talking to Express over IPC so native-module crashes don't take down the server.

**Plugins (`plugins/<id>/`)** — plain Node modules loaded at startup by `services/pluginLoader.ts` and `pluginManager.ts`. Each needs `manifest.json` (id must equal directory name; declares `capabilities`, `settingsFields`, `apiRisk`, `entry`) and an entry file that receives a context object (`ctx.registerWidget`, `ctx.pushAlert`, `ctx.speak`, ...). Plugin settings are stored via `PluginSettingsRepository`. Details in `docs/plugin-dev.md`. Core must never contain brand-specific integrations; they belong in plugins (Tesla, Eufy, garden-pal, ai-assistant, youtube-player).

**Client (`client/src`)** — React 19 + Vite + Tailwind 4 + Zustand + react-router 7, organised by feature folder (calendar, food, finance, pets, vehicles, ...). `@/` aliases `client/src`. Dev server proxies `/api` to the Express server.

**i18n** — all user-visible strings go through `t()` (react-i18next) with keys added to `client/public/locales/en/translation.json`; the ESLint rule `i18next/no-literal-string` flags hardcoded JSX text. Server has its own `i18n.ts`.

**Install/deploy** — `install/` holds the NUC/kiosk setup scripts and systemd unit; `scripts/build-release.sh` and `.github/workflows/release.yml` produce releases.

## Project process (BMAD v7)

Planning used the BMAD method. Installed via the Claude Code plugin marketplace (`bmad-method` + `bmad-toolbox` from `bmad-code-org/bmad-plugins`, user scope); `bmad setup` created `_bmad/` (config in `_bmad/config.toml`). Update through the marketplace, then run `bmad setup` again. Skills are `bmad-*` (e.g. `bmad-build`, `bmad-sprint-planning`, `bmad-correct-course`).

- Planning docs: `nestor-prd.md`, `docs/architecture-nestor-2026-05-08.md`, `docs/sprint-plan-nestor-2026-05-08.md`. BMAD `project_knowledge` points at `docs/`.
- **Tracking:** `_bmad-output/implementation-artifacts/sprint-status.yaml` is the source of truth for story status (rerun `bmad-sprint-planning` to refresh it). It is generated from `_bmad-output/planning-artifacts/epics.md`. Epics 1-31 in that file were derived from the sprint plan and `docs/stories/EPIC-21..31`; **epics 32+ are authored directly in `epics.md`** (from `sprint-change-proposal-2026-11-05.md`), so edit it there. Do not hand-edit statuses elsewhere.
- **Replan (2026-11-05):** first NUC deploy showed integrations were built against mocks and had no onboarding. Read `docs/integration-audit-2026-11-05.md` and `_bmad-output/planning-artifacts/sprint-change-proposal-2026-11-05.md` before touching integrations. Rule: no integration story in epics 33-38 is `done` until its live-verification story passes on real accounts/hardware. Epics 23, 24, 26, 27 are superseded by 33, 36, 37, 38.
- Detailed story specs live in `docs/stories/` (`STORY-<epic>-<n>.md`; some older files use `story-<epic>.<n>.md`). Create/update the story file before and during implementation and tick tasks off.
- The on-screen-keyboard epic was renumbered to Epic 39 (`docs/stories/EPIC-39-osk.md`) to resolve a collision with Epic 20.
- The former `docs/bmm-workflow-status.yaml` (per-epic implementation notes) was removed; read it from git history (before the BMAD v7 migration commit) if needed.
- Commit messages reference the story ID, e.g. `feat: add X (STORY-1.2)`. Branch from `main`.

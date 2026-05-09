# Sprint Plan: Nestor

**Date:** 2026-05-08
**Author:** Scrum Master (BMAD)
**Version:** 1.0
**Project Type:** web-app
**Project Level:** 3
**Status:** Draft — ready for development

---

## 1. Executive Summary

This document breaks the Nestor PRD and architecture down into a complete, implementation-ready backlog of user stories, organised into 20 epics, scheduled into 14 two-week sprints. Each story is written so a developer can pick it up and begin work without further clarification.

**Headline numbers:**

| Metric | Value |
|---|---|
| Total epics | 20 |
| Total stories | 178 |
| Total estimate (story-days) | 312.5 |
| Sprint length | 2 weeks (10 working days) |
| Assumed velocity | ~22 story-days per sprint (single developer) |
| Total sprints planned | 14 |
| MVP (Phase 1) sprints | 1 — 8 |
| Phase 2 sprints | 9 — 12 |
| Stretch / Polish sprints | 13 — 14 |
| MVP story count | 112 stories |
| MVP estimate | ~190 story-days |
| Estimated MVP delivery | ~16 weeks (Sprint 8) |

**Estimate scale:** XS = 0.5d · S = 1d · M = 2d · L = 3d · XL = 5d.

**Priority scale:** P1 = MVP must-have · P2 = Phase 2 important · P3 = Stretch / nice-to-have.

**MVP scope (Phase 1)** is the smallest functional Nestor that a household can switch on and live with: a working server + DB, profiles + PIN auth, day carousel home screen, calendar with CalDAV sync, food/meal planner, vehicles, family (children/chores/health), house (bin day/maintenance), finance commitments, pets, EV charging log, board, contacts, alert engine, setup wizard, install script, kiosk service, and the official Tesla, Eufy, and AI Assistant plugins behind the plugin system. Voice (full pipeline), polish, advanced finance, baby tracking depth, and stretch features sit in Phase 2 / Stretch.

---

## 2. Epic Overview

| # | Epic | Stories | Est. (days) | Phase |
|---|---|---|---|---|
| 1 | Project Foundation & Dev Environment | 11 | 14.5 | MVP |
| 2 | App Shell, Navigation & Profile System | 12 | 21 | MVP |
| 3 | Home Screen & Day Carousel | 9 | 17 | MVP |
| 4 | Calendar Module | 12 | 25 | MVP |
| 5 | Food / Meal Planner Module | 10 | 19 | MVP |
| 6 | Vehicles & Travel Module | 8 | 14.5 | MVP |
| 7 | Family Module | 12 | 22 | MVP / P2 |
| 8 | House Module | 10 | 19 | MVP |
| 9 | Finance Module | 7 | 11 | MVP |
| 10 | Pets Module | 6 | 9 | MVP |
| 11 | Board Module | 6 | 9 | MVP |
| 12 | Contacts Module | 4 | 5 | MVP |
| 13 | EV & Energy Module | 5 | 7 | MVP |
| 14 | Alert System | 7 | 11 | MVP |
| 15 | Voice Pipeline | 9 | 17 | P2 |
| 16 | Plugin System & Official Plugins | 12 | 28 | MVP / P2 |
| 17 | Admin & Settings | 10 | 16 | MVP |
| 18 | Internationalisation & Accessibility | 9 | 15 | MVP / P2 |
| 19 | Setup Wizard & Installation | 9 | 15 | MVP |
| 20 | Testing, Polish & Release | 11 | 18.5 | MVP / P2 |
| | **Totals** | **178** | **312.5** | |

---

## 3. Stories

> Conventions: `STORY-{Epic}.{n}`. Backend = server/Express/SQLite. Frontend = client/React. Shared = both.

---

### EPIC-1: Project Foundation & Dev Environment

The base on which everything else is built. Repository, build tooling, server bootstrap, database migrations, repository pattern, logging, error handling, health endpoint, encryption helper, app settings store. Nothing UI-facing.

#### STORY-1.1: Initialise repository structure and tooling
**As a** developer
**I want** a working monorepo with `server/`, `client/`, `plugins/`, `install/`, `docs/` directories and shared tooling
**So that** all subsequent work has a consistent home and consistent linting

**Acceptance Criteria:**
- [ ] Top-level `package.json` workspaces configured for `server`, `client`, and `plugins/*`
- [ ] `tsconfig.base.json` with strict mode and project references for server/client
- [ ] ESLint (Airbnb base + TypeScript), Prettier, EditorConfig, `.gitignore`, `.nvmrc` (Node 20 LTS)
- [ ] Husky + lint-staged pre-commit hook running `eslint --fix` and `prettier --write`
- [ ] `LICENSE` (MIT), `README.md` with placeholder, `CHANGELOG.md`, `CONTRIBUTING.md`
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all defined and passing on empty repo

**Technical Notes:**
- Use npm workspaces (not pnpm/yarn) for the broadest contributor compatibility
- Do not set up Vite or Express bootstrap here — that is in 1.4 / 1.6
- Architecture doc §"Code Organisation" is the source of truth for folder structure

**Dependencies:** none
**Estimate:** S
**Priority:** P1

---

#### STORY-1.2: GitHub repository and CI pipeline
**As a** maintainer
**I want** a public GitHub repository with CI running on every PR
**So that** quality gates are enforced and the project is open to contribution

**Acceptance Criteria:**
- [ ] GitHub repo created (MIT licence, README, issue templates, PR template)
- [ ] GitHub Actions workflow `ci.yml` runs on PR: `typecheck`, `eslint`, `prettier --check`, `jest`
- [ ] Required checks configured on `main` branch protection
- [ ] Dependabot enabled for npm and GitHub Actions
- [ ] Issue templates: bug, feature, plugin proposal
- [ ] PR template with checklist (tests added, i18n updated, docs updated)

**Technical Notes:**
- Playwright job is added in 20.4 once E2E tests exist
- Architecture §"CI/CD Pipeline"

**Dependencies:** STORY-1.1
**Estimate:** S
**Priority:** P1

---

#### STORY-1.3: SQLite database wrapper and migration runner
**As a** developer
**I want** a single SQLite connection helper and a numbered-SQL migration runner that runs on startup
**So that** the schema can evolve safely without breaking existing installs

**Acceptance Criteria:**
- [ ] `server/src/db/connection.ts` exports a singleton `better-sqlite3` instance
- [ ] On open: `PRAGMA journal_mode=WAL`, `PRAGMA foreign_keys=ON`, `PRAGMA synchronous=NORMAL`
- [ ] DB file path: `~/.nestor/nestor.db` (created if missing); overridable via `NESTOR_DB_PATH`
- [ ] Migration runner reads `server/migrations/*.sql` (numbered `001_*.sql`, `002_*.sql`, ...)
- [ ] `applied_migrations` table tracks which files have been applied
- [ ] On startup: any not-yet-applied files run in order, in a transaction each
- [ ] Unit tests with an in-memory SQLite verify ordering, idempotency, and failure behaviour

**Technical Notes:**
- Architecture §"Database Design"; migrations are append-only — never edit a previously-released migration
- Provide a `npm run db:reset` script (dev only) that deletes the DB file

**Dependencies:** STORY-1.1
**Estimate:** M
**Priority:** P1

---

#### STORY-1.4: Express server bootstrap with structured logging
**As a** developer
**I want** an Express HTTP server with a logger, health endpoint, and graceful shutdown
**So that** every domain feature can plug into a production-ready scaffold

**Acceptance Criteria:**
- [ ] `server/src/index.ts` bootstraps Express on port 3000 (configurable via `NESTOR_PORT`)
- [ ] JSON body parsing, request ID middleware, error middleware returning `{ error, code, details? }`
- [ ] Pino logger with structured JSON to stdout; `NESTOR_LOG_LEVEL` env override
- [ ] `GET /health` returns `{ status: 'ok', db: 'ok'|'fail', uptime: <seconds>, version: <pkg> }`
- [ ] SIGTERM/SIGINT handler drains in-flight requests then closes DB cleanly
- [ ] `process.on('uncaughtException')` and `unhandledRejection` log and exit non-zero (let systemd restart)
- [ ] Supertest integration test asserts `/health` returns 200

**Technical Notes:**
- Architecture §"Component 1: Express HTTP Server" and NFR-002

**Dependencies:** STORY-1.3
**Estimate:** M
**Priority:** P1

---

#### STORY-1.5: Repository pattern base + app_settings repository
**As a** developer
**I want** a base repository class and an `app_settings` repository with in-memory cache
**So that** all feature work has a consistent persistence pattern

**Acceptance Criteria:**
- [ ] `migrations/001_app_settings.sql` creates `app_settings(key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`
- [ ] `BaseRepository` abstract class with `db` reference and helpers for `get`, `all`, `run`
- [ ] `AppSettingsRepository`: `getAll()`, `get(key)`, `set(key, value)`, `setMany({})`, `delete(key)`
- [ ] Settings cached in memory on first `getAll()`; cache invalidated on any write
- [ ] Values JSON-serialised on write, parsed on read; type-safe via Zod schema for known keys
- [ ] Unit tests cover get/set/cache invalidation

**Technical Notes:**
- Architecture §"Component 8: Data Layer" and §"Caching Strategy"
- Known settings keys catalogued in `server/src/db/settings-keys.ts`

**Dependencies:** STORY-1.3
**Estimate:** M
**Priority:** P1

---

#### STORY-1.6: Vite + React + Tailwind frontend bootstrap
**As a** developer
**I want** a working Vite-built React SPA served by Express in production and via Vite dev server in development
**So that** UI work can begin

**Acceptance Criteria:**
- [ ] Vite config with React + TypeScript, alias `@/` → `client/src/`
- [ ] Tailwind CSS configured with content paths and PostCSS pipeline
- [ ] `client/src/main.tsx` mounts a placeholder `<App />` showing "Nestor" splash
- [ ] Dev: `npm run dev` runs Express on 3000 + Vite on 5173 with proxy to API
- [ ] Production: `npm run build` outputs static files; Express serves from `client/dist/`
- [ ] React Router v6 installed with empty router placeholder
- [ ] Lighthouse score on placeholder: Performance > 90 on localhost

**Technical Notes:**
- Architecture §"Frontend" key libraries list

**Dependencies:** STORY-1.4
**Estimate:** M
**Priority:** P1

---

#### STORY-1.7: TanStack Query + Zustand setup
**As a** developer
**I want** TanStack Query and Zustand wired into the React shell with a global error boundary
**So that** every module has a consistent data-fetching and client-state foundation

**Acceptance Criteria:**
- [ ] `QueryClientProvider` at app root with sensible defaults (30s stale, retry 1, refetchOnWindowFocus=false)
- [ ] DevTools enabled in development only
- [ ] `useAppStore` Zustand slice scaffold (active profile, alert count, voice status placeholders)
- [ ] Global `<ErrorBoundary>` catches render errors, shows recovery card, logs to server via `POST /api/v1/client-errors`
- [ ] `client/src/api/client.ts` thin fetch wrapper that adds `X-Profile-Id` and `X-Admin-Pin` headers from store

**Technical Notes:**
- Architecture §"Frontend"

**Dependencies:** STORY-1.6
**Estimate:** M
**Priority:** P1

---

#### STORY-1.8: AES-256-GCM encryption helper for credentials at rest
**As a** developer
**I want** a tested encryption helper that derives a key from `/etc/machine-id` + a salt in `app_settings`
**So that** plugin API keys and CalDAV credentials can be stored encrypted

**Acceptance Criteria:**
- [ ] `server/src/utils/crypto.ts` exports `encrypt(plaintext): string` and `decrypt(ciphertext): string`
- [ ] Key derivation: HKDF-SHA256 of `/etc/machine-id` + `app_settings.encryption_salt` (auto-generated 32B if missing on first call)
- [ ] AES-256-GCM with random 12-byte IV per encryption; output format `v1:<iv_b64>:<tag_b64>:<ciphertext_b64>`
- [ ] Unit tests: round-trip, IV uniqueness, tampered ciphertext throws, missing machine-id falls back to a generated machine ID file
- [ ] No secrets ever logged

**Technical Notes:**
- Architecture §"Data Encryption"
- For dev/macOS: fall back to `~/.nestor/machine-id` (UUID) if `/etc/machine-id` not found

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-1.9: Internal event bus
**As a** developer
**I want** a typed event bus shared across services
**So that** modules can publish/subscribe without circular imports

**Acceptance Criteria:**
- [ ] `server/src/core/eventBus.ts` exposes a typed `EventEmitter` with declared event names: `alert:new`, `alert:dismissed`, `calendar:synced`, `plugin:enabled`, `plugin:disabled`, `plugin:error`, `voice:status`, `settings:updated`
- [ ] Type-safe `emit` and `on` via a generic event-map interface
- [ ] Documented in code comments

**Technical Notes:**
- Architecture §"Message / Event Architecture"

**Dependencies:** STORY-1.4
**Estimate:** XS
**Priority:** P1

---

#### STORY-1.10: WebSocket server scaffold
**As a** developer
**I want** a WebSocket endpoint at `/ws` that broadcasts JSON frames to all connected clients
**So that** alerts and voice status can push to the UI

**Acceptance Criteria:**
- [ ] `ws` package mounted on the Express HTTP server at `/ws`
- [ ] `server/src/ws/server.ts` exposes `broadcast(msg)` and `send(clientId, msg)`
- [ ] Subscribes to `alert:new`, `alert:dismissed`, `voice:status`, `calendar:synced` from the event bus
- [ ] Heartbeat ping every 30 seconds; dead clients pruned
- [ ] Client-side `useWebSocket()` hook reconnects with exponential back-off

**Technical Notes:**
- Architecture §"API Architecture"

**Dependencies:** STORY-1.9, STORY-1.7
**Estimate:** M
**Priority:** P1

---

#### STORY-1.11: Job scheduler base
**As a** developer
**I want** a cron-driven job scheduler that registers handlers and survives restarts
**So that** sync, reminder, and maintenance jobs have a single home

**Acceptance Criteria:**
- [ ] `server/src/scheduler/index.ts` wraps `node-cron`
- [ ] `Scheduler.register(name, cron, handler)` registers and starts a job
- [ ] Each handler wrapped in try/catch with structured error logging
- [ ] In-memory job registry; `Scheduler.list()` for diagnostics
- [ ] Built-in jobs registered at startup with placeholders: weather refresh, CalDAV sync, reminder eval, GitHub poll, weekly VACUUM
- [ ] Unit tests with fake timers verify registration and isolation of failing jobs

**Technical Notes:**
- Architecture §"Component 6: Job Scheduler"

**Dependencies:** STORY-1.4
**Estimate:** M
**Priority:** P1

---

### EPIC-2: App Shell, Navigation & Profile System

The shell that every nav module plugs into. Profiles, PIN auth, profile switching, navbar (portrait + landscape), permissions middleware, sidebar filters, design system primitives.

#### STORY-2.1: Profiles schema and repository
**As a** developer
**I want** the `profiles` table and a repository for all profile CRUD
**So that** every other module can scope data by profile

**Acceptance Criteria:**
- [ ] Migration creates `profiles` per architecture data model (id, name, type, colour, pin_hash, avatar_path, accessibility_json, permissions_json, text_size, simplified_nav, created_at)
- [ ] `ProfileRepository` with `list`, `get`, `create`, `update`, `delete`, `verifyPin`
- [ ] `pin_hash` written via `bcrypt` cost 10
- [ ] `verifyPin(profileId, pin)` returns boolean
- [ ] Validation via Zod: type enum, colour hex format, name required
- [ ] Unit tests for all methods

**Technical Notes:**
- Architecture data model section

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-2.2: Profile API endpoints with rate-limited PIN verification
**As a** developer
**I want** REST endpoints for profile CRUD and PIN verification
**So that** the React app can manage profiles

**Acceptance Criteria:**
- [ ] `GET /api/v1/profiles` — list (no `pin_hash` in response)
- [ ] `POST /api/v1/profiles` — create (admin only)
- [ ] `PATCH /api/v1/profiles/:id` — update (admin only)
- [ ] `DELETE /api/v1/profiles/:id` — delete (admin only; cannot delete last admin)
- [ ] `POST /api/v1/profiles/:id/verify-pin` — `{ valid: boolean }` rate-limited 5/15min/IP
- [ ] `GET /api/v1/profiles/:id/permissions` — full permissions object
- [ ] Zod input validation; tests cover happy path + permission denials + rate limit

**Technical Notes:**
- Architecture §"Authentication & Authorization"
- Use `express-rate-limit`

**Dependencies:** STORY-2.1
**Estimate:** M
**Priority:** P1

---

#### STORY-2.3: Profile and admin-PIN middleware
**As a** developer
**I want** Express middleware that resolves the active profile and gates admin operations
**So that** every protected endpoint can rely on `req.profile`

**Acceptance Criteria:**
- [ ] `requireProfile` reads `X-Profile-Id`, loads profile, attaches `req.profile`; 401 if missing/invalid
- [ ] `requirePermission(permKey)` checks `req.profile.permissions[permKey]`; 403 if missing
- [ ] `requireAdminPin` reads `X-Admin-Pin`, bcrypt-compares against profile's pin_hash; 403 if invalid
- [ ] Centralised `permissions.ts` declares all permission keys (≈25, derived from PRD §5 matrix)
- [ ] Tests: each middleware tested in isolation against Supertest

**Technical Notes:**
- Architecture §"Authentication & Authorization"

**Dependencies:** STORY-2.2
**Estimate:** M
**Priority:** P1

---

#### STORY-2.4: Permission matrix defaults per profile type
**As a** household admin
**I want** sensible default permissions assigned automatically when I create a profile of a given type
**So that** I don't have to configure 25 permission keys per child manually

**Acceptance Criteria:**
- [ ] `server/src/services/permissionDefaults.ts` exports a function `defaultsFor(type)` returning a permission set per PRD §5 matrix
- [ ] On `POST /api/v1/profiles`, if `permissions_json` not provided, defaults applied
- [ ] Admin can override any individual permission via `PATCH`
- [ ] Snapshot tests verify defaults match the PRD matrix exactly

**Technical Notes:**
- PRD §5 "Profile Permission Matrix"

**Dependencies:** STORY-2.3
**Estimate:** S
**Priority:** P1

---

#### STORY-2.5: Design system tokens and core primitives
**As a** developer
**I want** Tailwind tokens (colours, spacing, type scale, radii, shadows) and a small set of primitive components
**So that** all modules look and feel consistent and meet readability/accessibility targets

**Acceptance Criteria:**
- [ ] Tailwind config defines: 9 mode accent colours, 12 profile colours, alert colours, warm-white/dark-warm-grey background tokens
- [ ] Type scale: display 48–72px, h1 32px, h2 24px, body 18px, caption 14px (driven by CSS custom property `--base-font-size`)
- [ ] Card radius `--radius-card: 24px`, button radius `--radius-button: 16px`
- [ ] Primitive components in `client/src/shared/ui/`: `<Card>`, `<Button>`, `<TouchTarget>` (enforces 44×44 min), `<Modal>`, `<Pill>`, `<Avatar>`, `<IconButton>`, `<Skeleton>`, `<EmptyState>`
- [ ] Storybook (or a `/ui` dev route) showcases each primitive
- [ ] All primitives respect `prefers-reduced-motion`

**Technical Notes:**
- PRD §6 "UI Style Direction"; NFR-008
- Inter as primary typeface (self-hosted in `client/public/fonts/`)

**Dependencies:** STORY-1.6
**Estimate:** L
**Priority:** P1

---

#### STORY-2.6: App shell with portrait/landscape layout
**As a** household member
**I want** the app to render with a navbar in the right place for the screen orientation
**So that** the layout is purposeful, not rotated

**Acceptance Criteria:**
- [ ] `<AppShell>` detects orientation via `matchMedia('(orientation: portrait)')`
- [ ] Portrait: bottom horizontal navbar; Landscape: left vertical icon rail
- [ ] Orientation overridable via `app_settings.orientation` ('auto'|'portrait'|'landscape')
- [ ] Layout reflows live without restart on settings change
- [ ] CSS Grid: `[sidebar/topstrip] [main]` with sensible breakpoints
- [ ] Visual regression snapshot at 1080×1920 and 1920×1080

**Technical Notes:**
- PRD §7 and §8
- Use CSS logical properties to ease later RTL

**Dependencies:** STORY-2.5
**Estimate:** L
**Priority:** P1

---

#### STORY-2.7: Bottom navbar / side rail with mode buttons
**As a** household member
**I want** a navbar with the 10 default modes, configurable layout
**So that** I can navigate to any section in one tap

**Acceptance Criteria:**
- [ ] Navbar reads `app_settings.enabled_nav_modes` (JSON array of mode IDs in order)
- [ ] Default modes per PRD §8 table: Home, Calendar, Food, Vehicles, Family, House, Finance, Pets, EV, Board
- [ ] Each button: large icon + label, mode accent colour on active state
- [ ] Unread alert badge on each button (driven by Zustand store)
- [ ] Portrait: layout options "single", "double", "scrollable", "hamburger" stored in `app_settings.nav_layout`
- [ ] Tap → React Router navigation
- [ ] Hidden modes simply omitted from list

**Technical Notes:**
- PRD §8

**Dependencies:** STORY-2.6, STORY-1.7
**Estimate:** M
**Priority:** P1

---

#### STORY-2.8: Profile context + profile switcher avatar strip
**As a** household member
**I want** to tap an avatar at the top of the home screen to switch profile (PIN if required)
**So that** I see my view of the household

**Acceptance Criteria:**
- [ ] `<ProfileProvider>` exposes `useActiveProfile()`; persisted to `localStorage`
- [ ] Avatar strip component renders all profiles with avatar, colour border, name
- [ ] Tap → if PIN-required, prompt for PIN modal; else switch immediately
- [ ] PIN modal calls `POST /profiles/:id/verify-pin` and on failure shakes
- [ ] Switching updates Zustand store; all data hooks re-fetch with new profile ID
- [ ] Per-profile `text_size` and `simplified_nav` applied as CSS custom properties on root

**Technical Notes:**
- PRD §5 "Profile Switching UX"

**Dependencies:** STORY-2.4, STORY-2.5, STORY-2.7
**Estimate:** L
**Priority:** P1

---

#### STORY-2.9: Sidebar filter panel (portrait) / top filter strip (landscape)
**As a** household member
**I want** a persistent filter strip with profile, pet, and vehicle toggles
**So that** I can scope what is visible across calendar/home

**Acceptance Criteria:**
- [ ] `<FilterPanel>` driven by Zustand `filtersStore` with `profiles[]`, `pets[]`, `vehicles[]`, `pluginFilters[]`
- [ ] "All" toggle resets filters
- [ ] Toggle pills colour-coded per profile
- [ ] Plugin-registered filters slot in dynamically (via plugin registry hook)
- [ ] Portrait: left sidebar 88px wide; Landscape: top strip
- [ ] Filter state persisted to `localStorage` per profile

**Technical Notes:**
- PRD §9 sidebar; pets and vehicles populated empty until those modules exist

**Dependencies:** STORY-2.6
**Estimate:** M
**Priority:** P1

---

#### STORY-2.10: Kiosk-child mode
**As a** parent
**I want** to lock the screen into a child's view, requiring an admin PIN to exit
**So that** my 5-year-old can use the screen alone without breaking anything

**Acceptance Criteria:**
- [ ] `app_settings.kiosk_lock` set with the locked profile ID
- [ ] When set, profile switcher disabled, admin routes return 403, only child-permitted nav modes visible
- [ ] Long-press hidden corner triple-tap → admin PIN prompt → unlock
- [ ] Visual indicator (small icon) that the screen is locked

**Technical Notes:**
- PRD §5 "Kiosk child mode"

**Dependencies:** STORY-2.8
**Estimate:** M
**Priority:** P1

---

#### STORY-2.11: Guest lock-screen overlay
**As a** household admin
**I want** a babysitter to access a guest profile from a lock-screen overlay without entering the main app
**So that** they only see today's schedule, contacts, and child routines

**Acceptance Criteria:**
- [ ] Guest-mode overlay accessible from profile switcher with optional PIN gate
- [ ] Renders a stripped-down screen: today's events, child routines (view only), emergency contacts, today's meal
- [ ] "Exit guest mode" requires admin PIN

**Technical Notes:**
- PRD §5 "Guest mode"

**Dependencies:** STORY-2.10
**Estimate:** M
**Priority:** P2

---

#### STORY-2.12: Idle timer, screen dim and DPMS sleep
**As a** household
**I want** the screen to dim after idle and sleep after extended idle
**So that** the screen doesn't burn in or distract at night

**Acceptance Criteria:**
- [ ] `useIdleTimer` hook detects no touch for configurable durations (defaults: 90s, 10min)
- [ ] At first threshold: CSS overlay dims to ~10% (or DDC/CI brightness via server endpoint if available)
- [ ] At second threshold: server triggers OS DPMS off via `xset dpms force off` (admin-only endpoint)
- [ ] Any touch wakes immediately
- [ ] Night mode (configurable hours): dark theme + dimmer dim level
- [ ] All thresholds configurable via Settings

**Technical Notes:**
- PRD §8 "Screen Sleep & Brightness"
- Brightness via `ddcutil` shelled out, fail gracefully if not present

**Dependencies:** STORY-2.6
**Estimate:** M
**Priority:** P2

---

### EPIC-3: Home Screen & Day Carousel

The default landing screen — alerts strip, day carousel, mini weather, journey time widget, plugin widget strip.

#### STORY-3.1: Open-Meteo weather service + cache
**As a** developer
**I want** a server-side weather service that fetches Open-Meteo and caches the result
**So that** the home screen and calendar can render weather without hammering the API

**Acceptance Criteria:**
- [ ] `WeatherService.getForLocation(lat, lon)` returns `{ current, hourly, daily }` for the next 7 days
- [ ] Cached in memory; refreshed by scheduler every 30 minutes
- [ ] Coordinates from `app_settings.location` (`{lat, lon, label}` set during wizard)
- [ ] `GET /api/v1/weather` returns the cached object
- [ ] Graceful failure: stale cache served if refresh fails; alert pushed if down > 6h
- [ ] Unit tests with mocked HTTP

**Technical Notes:**
- Architecture §"Third-Party Services" — Open-Meteo, no key

**Dependencies:** STORY-1.5, STORY-1.11
**Estimate:** M
**Priority:** P1

---

#### STORY-3.2: Home route layout
**As a** household member
**I want** the Home screen with alerts strip, day carousel area, journey widget area, and plugin strip area
**So that** all home-screen widgets have their place

**Acceptance Criteria:**
- [ ] `home/index.tsx` route mounted at `/`
- [ ] Sections: header (greeting + date/time + weather) → alerts strip → day carousel → journey widget → plugin strip
- [ ] Header reads active profile to greet by name ("Good morning, Sarah") with i18n string
- [ ] Live clock updating each minute (`HH:mm` in locale time format)
- [ ] Date in locale long format
- [ ] Mock data acceptable for sub-widgets until later stories complete
- [ ] Matches design `home_.png` layout

**Technical Notes:**
- Design ref: `home_.png`

**Dependencies:** STORY-2.6, STORY-3.1
**Estimate:** M
**Priority:** P1

---

#### STORY-3.3: Day carousel — read-only render
**As a** household member
**I want** a horizontal day carousel showing yesterday + today (large) + next 4 days
**So that** I can see what is coming at a glance

**Acceptance Criteria:**
- [ ] `<DayCarousel>` renders day cards from a `[start, end]` date range
- [ ] Today card ~50% width; flanking cards thin
- [ ] Each card shows: date, day name, mini weather (high/low/icon/precip%), event list colour-coded by profile
- [ ] Smooth scroll-snap horizontal scroll, 200–300ms
- [ ] Tap thin card → animate to focal
- [ ] Tap focal card → full-screen day view modal
- [ ] Long-press empty area → quick-add event modal
- [ ] "↩ Back to Today" pill appears when not on today
- [ ] Reduced-motion users see instant transitions

**Technical Notes:**
- PRD §9 "Main Pane — Day Carousel"
- Use Framer Motion `LayoutGroup` and `AnimatePresence`

**Dependencies:** STORY-3.2, STORY-2.5
**Estimate:** L
**Priority:** P1

---

#### STORY-3.4: Day card details — WFH / school drop / vehicle / pet markers
**As a** household admin
**I want** day cards to display per-day badges: WFH/in-office, nursery drop, vehicle bookings, pet vet
**So that** the day's logistics are visible without opening anything

**Acceptance Criteria:**
- [ ] Day card displays icon strip below date: WFH/office per adult, nursery drop, school pickup, vehicle bookings, vet appointments
- [ ] Each badge linked to its source (tap → opens detail)
- [ ] Bin icons appear on collection days with the configured colour (driven by `bin_schedules` from House module)
- [ ] Filter panel toggles affect what is shown
- [ ] Rendered from a server `GET /api/v1/home/day-summary?date=` endpoint that aggregates events, vehicle bookings, bin schedules, pet care due dates, WFH status

**Technical Notes:**
- This is the keystone aggregation endpoint — many modules feed it; depends on those modules' data being present

**Dependencies:** STORY-3.3, STORY-4.4 (events), STORY-6.4 (vehicle bookings), STORY-8.3 (bin schedules), STORY-10.3 (pet health)
**Estimate:** L
**Priority:** P1

---

#### STORY-3.5: Mini weather widget on home header
**As a** household member
**I want** the home header to show current weather and key metrics
**So that** I can see conditions without opening anything

**Acceptance Criteria:**
- [ ] Header weather: condition icon, current temp, high/low, precip %, UV index — pulled from `/api/v1/weather`
- [ ] Tap → modal with 7-day forecast
- [ ] Locale-aware temperature unit (°C/°F)
- [ ] Loading skeleton while fetching

**Technical Notes:**
- PRD §9 weather mini-widget

**Dependencies:** STORY-3.2, STORY-3.1
**Estimate:** S
**Priority:** P1

---

#### STORY-3.6: Alerts strip on home
**As a** household member
**I want** a horizontal strip of dismissible alerts above the carousel
**So that** I see urgent things first

**Acceptance Criteria:**
- [ ] `<AlertsStrip>` reads from `useAlerts()` hook (TanStack Query against `/api/v1/alerts`)
- [ ] Each alert: severity colour, icon, message, dismiss "×" button
- [ ] Tap alert → optional deep link (e.g. bin alert → House)
- [ ] Dismiss → optimistic remove + `POST /alerts/:id/dismiss`
- [ ] WebSocket `alert_update` triggers refetch
- [ ] Empty state: hides itself

**Technical Notes:**
- PRD §21; depends on Alert Engine in EPIC-14

**Dependencies:** STORY-3.2, STORY-14.4
**Estimate:** M
**Priority:** P1

---

#### STORY-3.7: Journey time widget
**As a** commuting adult
**I want** a "Home → King's Cross 38 min" widget per saved route
**So that** I can plan my commute

**Acceptance Criteria:**
- [ ] `journeys` table: id, profile_id, label, origin, destination, transport_mode, days_active (bitmask), provider_id
- [ ] CRUD endpoints under `/api/v1/journeys`
- [ ] Server-side `TransportAdapter` interface; UK default no-op stub returns mocked time (real adapters added in P2 / community)
- [ ] Widget renders journey rows with live ETA per active profile, only on relevant days
- [ ] Empty state: "Add a saved journey in Settings"

**Technical Notes:**
- PRD §12 "Commute & Travel"; transport adapter interface defined here

**Dependencies:** STORY-3.2, STORY-2.4
**Estimate:** L
**Priority:** P1 (stub OK for MVP; real National Rail adapter P2)

---

#### STORY-3.8: Plugin widget strip on home
**As a** plugin author
**I want** my plugin to register a home-screen widget that renders alongside core widgets
**So that** the home screen extends without core changes

**Acceptance Criteria:**
- [ ] `<PluginWidgetStrip>` queries `pluginRegistry` for components with capability `home_screen_widget`
- [ ] Renders each in a sandboxed `<ErrorBoundary>` — a broken widget doesn't take out the strip
- [ ] Hidden if no active plugins register widgets
- [ ] Drag-to-reorder (Phase 2) optional — for MVP, render in order plugins were enabled

**Technical Notes:**
- Depends on plugin manager in EPIC-16

**Dependencies:** STORY-3.2, STORY-16.3
**Estimate:** M
**Priority:** P1

---

#### STORY-3.9: "Coming Up" widget
**As a** household member
**I want** a small "Coming Up" card showing the next ~3 notable items (birthdays, MOTs, holidays)
**So that** longer-term events are surfaced

**Acceptance Criteria:**
- [ ] Server endpoint `/api/v1/home/coming-up` aggregates: upcoming countdowns, finance end dates, MOT/insurance dates, birthdays from contacts
- [ ] Widget shows up to 3 items with day-count chips (matches `home_.png` "Coming up")
- [ ] Tap an item → navigates to its source

**Technical Notes:**
- Visual reference: `home_.png` "COMING UP" card

**Dependencies:** STORY-3.2, multiple modules (calendar, finance, vehicles, board countdowns)
**Estimate:** M
**Priority:** P2

---

### EPIC-4: Calendar Module

CalDAV sync, event CRUD, day/week/month views, recurring events, special entry types.

#### STORY-4.1: Calendar accounts and events schema
**As a** developer
**I want** the `calendar_accounts` and `calendar_events` tables with indexes
**So that** events can be stored and queried efficiently

**Acceptance Criteria:**
- [ ] Migration creates `calendar_accounts` and `calendar_events` per architecture data model
- [ ] Indexes: `idx_events_profile_date`, `idx_events_account`, `idx_events_caldav_uid`
- [ ] Repositories `CalendarAccountRepository` and `EventRepository` with all CRUD methods
- [ ] `EventRepository.findInRange(start, end, profileIds[])` returns expanded events
- [ ] Encrypted columns: `credentials_encrypted` via crypto helper
- [ ] Unit tests

**Technical Notes:**
- Architecture data model

**Dependencies:** STORY-1.5, STORY-1.8
**Estimate:** M
**Priority:** P1

---

#### STORY-4.2: Local event CRUD endpoints
**As a** household member
**I want** to add, edit, and delete events that live only in Nestor
**So that** I can capture household items not in any cloud calendar

**Acceptance Criteria:**
- [ ] `POST/PATCH/DELETE /api/v1/calendar/events`
- [ ] `GET /api/v1/calendar/events?start=&end=&profileIds=` with date filters
- [ ] All-day toggle, recurrence (RRULE string)
- [ ] Source = `local`; CalDAV-synced events become read-only for non-admins
- [ ] Permission middleware: only admin/teen can create per matrix
- [ ] Validation via Zod
- [ ] Unit + integration tests

**Technical Notes:**
- Architecture API design

**Dependencies:** STORY-4.1, STORY-2.3
**Estimate:** M
**Priority:** P1

---

#### STORY-4.3: Recurring event expansion via ical.js
**As a** developer
**I want** RRULE strings expanded into individual occurrences server-side
**So that** week and month views render without each client computing recurrences

**Acceptance Criteria:**
- [ ] Helper `expandRecurring(event, rangeStart, rangeEnd)` returns N event instances
- [ ] Supports DAILY, WEEKLY, MONTHLY, YEARLY with `BYDAY`, `INTERVAL`, `COUNT`, `UNTIL`, `EXDATE`
- [ ] `EventRepository.findInRange` calls expansion for each recurring event
- [ ] Time zone correct (events stored in UTC, expanded in display tz)
- [ ] Unit tests cover edge cases (DST boundary, month-end, EXDATEs)

**Technical Notes:**
- Use `ical.js` recur iterator

**Dependencies:** STORY-4.2
**Estimate:** L
**Priority:** P1

---

#### STORY-4.4: Calendar service module skeleton + sync interface
**As a** developer
**I want** a `CalendarService` with `syncAccount()` interface and a no-op default provider
**So that** sync can be plugged in per provider without changing the schedule wiring

**Acceptance Criteria:**
- [ ] `CalendarService.syncAccount(accountId)` looks up provider, runs adapter, upserts events by `caldav_uid`
- [ ] Provider adapter interface: `pull(account): Event[]`, `push(account, event)`, `testCredentials(account)`
- [ ] Default `LocalProvider` is a no-op (used as a fallback)
- [ ] `last_sync_at` updated on success; `last_sync_error` populated on failure
- [ ] Scheduler job triggers `syncAllAccounts` at configurable interval (default 15 minutes)
- [ ] Emits `calendar:synced` event

**Technical Notes:**
- Architecture §"Component 3: Calendar Service"

**Dependencies:** STORY-4.1, STORY-1.11
**Estimate:** M
**Priority:** P1

---

#### STORY-4.5: Google Calendar CalDAV adapter with OAuth2 + QR pairing
**As a** household admin
**I want** to add my Google Calendar by scanning a QR code on my phone
**So that** I don't have to type a long OAuth URL on a touchscreen

**Acceptance Criteria:**
- [ ] OAuth2 PKCE flow; client ID via `app_settings.google_oauth_client_id` (or env)
- [ ] `POST /api/v1/calendar/accounts/google/start` returns `{ deviceCode, verificationUrl, qrPng }`
- [ ] Wizard polls `GET /api/v1/calendar/accounts/google/poll/:deviceCode`
- [ ] On success: tokens stored encrypted; CalDAV URL discovered via DAV principal
- [ ] First sync runs immediately
- [ ] Refresh token used to refresh access token before expiry
- [ ] Unit/integration tests with mocked Google endpoints

**Technical Notes:**
- Use `tsdav` for CalDAV
- Architecture §"External Integrations"

**Dependencies:** STORY-4.4, STORY-1.8
**Estimate:** XL
**Priority:** P1

---

#### STORY-4.6: Apple iCloud + Yahoo CalDAV adapters
**As a** household admin
**I want** to add my Apple iCloud or Yahoo calendar with an app-specific password
**So that** my non-Google calendar syncs too

**Acceptance Criteria:**
- [ ] Form: provider, username, app-specific password, optional CalDAV URL override
- [ ] `testCredentials` button verifies before saving
- [ ] Apple defaults: `https://caldav.icloud.com`
- [ ] Yahoo defaults: `https://caldav.calendar.yahoo.com`
- [ ] Tokens/passwords encrypted at rest

**Technical Notes:**
- Both use `tsdav`

**Dependencies:** STORY-4.5
**Estimate:** M
**Priority:** P1

---

#### STORY-4.7: Calendar — Day view
**As a** household member
**I want** a full-screen day view with timeline
**So that** I can see today's events with start/end times

**Acceptance Criteria:**
- [ ] `<DayView>` shows hours 06:00–22:00 (configurable) with events as time-positioned cards
- [ ] Events colour-coded by profile
- [ ] Tap event → detail modal
- [ ] Empty slot tap → quick-add modal
- [ ] All-day events stacked at top
- [ ] Locale-aware time format

**Technical Notes:**
- PRD §10

**Dependencies:** STORY-4.3
**Estimate:** L
**Priority:** P1

---

#### STORY-4.8: Calendar — Week view
**As a** household member
**I want** a 7-day week view with colour-coded events
**So that** I can plan the week

**Acceptance Criteria:**
- [ ] 7 columns of day timeline (matches `calendar_.png`)
- [ ] Filter pills along top (profile filters)
- [ ] Today column visually highlighted
- [ ] Tap event → detail modal
- [ ] Quick-add card bottom-right with "Event/All-day/Recurring" buttons
- [ ] Today summary at bottom-left (today's events list)

**Technical Notes:**
- Design ref: `calendar_.png`

**Dependencies:** STORY-4.7
**Estimate:** L
**Priority:** P1

---

#### STORY-4.9: Calendar — Month view
**As a** household member
**I want** a month grid with event dots
**So that** I can see density at a glance and jump to a day

**Acceptance Criteria:**
- [ ] 6×7 grid; first day of week from locale
- [ ] Each cell: date, up to 3 event dots colour-coded; "+N more" indicator
- [ ] Tap day → opens day view for that date
- [ ] Swipe left/right between months

**Technical Notes:**
- PRD §10

**Dependencies:** STORY-4.7
**Estimate:** M
**Priority:** P1

---

#### STORY-4.10: Event detail modal + quick-add modal
**As a** household member
**I want** a single modal for creating and viewing events
**So that** the experience is consistent

**Acceptance Criteria:**
- [ ] Fields: title, profile, start/end (date+time), all-day toggle, type (default/wfh/shift/vehicle/vet/custody), recurrence picker, notes, colour override
- [ ] Quick-add prepopulates from carousel/empty-slot context
- [ ] Save → POST/PATCH; cancel → close
- [ ] Delete confirmation for existing events
- [ ] On-screen keyboard friendly (Phase 1: triggers Onboard)

**Technical Notes:**
- PRD §10

**Dependencies:** STORY-4.2
**Estimate:** L
**Priority:** P1

---

#### STORY-4.11: Term dates iCal subscription
**As a** parent
**I want** to import school/nursery term dates from an iCal URL per child
**So that** inset days appear automatically

**Acceptance Criteria:**
- [ ] Per-child setting: `term_dates_ical_url`
- [ ] Scheduler: nightly fetch; events tagged `type=school_term`
- [ ] Inset day events surface as alerts
- [ ] Failure logs but does not block other modules

**Technical Notes:**
- PRD §10 special entry types

**Dependencies:** STORY-4.2, STORY-1.11
**Estimate:** M
**Priority:** P2

---

#### STORY-4.12: Custody schedule entry type
**As a** parent in a blended family
**I want** a sensitive "custody" event type for which child is with which household
**So that** the household can plan accordingly

**Acceptance Criteria:**
- [ ] Event type `custody`; only visible to admins by default (per-profile permission)
- [ ] Distinct visual style (subtle pattern)
- [ ] Configurable label per setup (e.g. "With Mum" / "With Dad")
- [ ] Recurring schedule supported

**Technical Notes:**
- PRD §10 / §28

**Dependencies:** STORY-4.10
**Estimate:** S
**Priority:** P2

---

### EPIC-5: Food / Meal Planner Module

Meal planner grid, recipe library, recipe URL import, shopping list.

#### STORY-5.1: Recipes and meal_plan schema + repos
**As a** developer
**I want** `recipes`, `recipe_ingredients`, `meal_plan`, and `shopping_items` tables and repositories
**So that** food features can persist data

**Acceptance Criteria:**
- [ ] Migrations per architecture data model
- [ ] Indexes on `meal_plan.plan_date`, `recipe_ingredients.recipe_id`, `shopping_items.ticked`
- [ ] Repositories with full CRUD + search (recipes by tag/ingredient)
- [ ] Unit tests

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-5.2: Recipe API endpoints + photo upload
**As a** developer
**I want** REST endpoints for recipe CRUD with photo upload
**So that** the React UI can manage the recipe library

**Acceptance Criteria:**
- [ ] `GET/POST/PATCH/DELETE /api/v1/recipes` with `?search=&tags=`
- [ ] `POST /api/v1/recipes/:id/photo` multer upload, max 10MB, resized to 1200px wide via `sharp`
- [ ] Photos stored in `~/.nestor/uploads/recipes/<uuid>.webp`
- [ ] Filename sanitised; UUID storage names
- [ ] Tests: happy path + oversize upload rejected

**Technical Notes:**
- Architecture §"Security Best Practices"

**Dependencies:** STORY-5.1
**Estimate:** M
**Priority:** P1

---

#### STORY-5.3: Recipe URL import via Schema.org JSON-LD
**As a** household member
**I want** to paste a recipe URL and have ingredients/method extracted
**So that** I don't have to retype recipes

**Acceptance Criteria:**
- [ ] `POST /api/v1/recipes/import-url` with `{ url }`
- [ ] Server fetches HTML (with reasonable timeout + UA), parses JSON-LD with cheerio/`schema-dts`
- [ ] Returns pre-filled recipe object: title, description, ingredients (parsed `{quantity, unit, ingredient}`), method, prep_mins, cook_mins, servings, photo URL
- [ ] If no JSON-LD: returns 200 with `{ partial: true, raw: {title, description} }` and user fills the rest
- [ ] User reviews and edits before saving
- [ ] Server-side warning: "Self-hosters responsible for source site ToS" once on first use

**Technical Notes:**
- PRD §11

**Dependencies:** STORY-5.2
**Estimate:** L
**Priority:** P1

---

#### STORY-5.4: Meal planner 7-day grid
**As a** household member
**I want** a 7-day grid of meal slots I can fill from recipes or free text
**So that** the week's food is planned

**Acceptance Criteria:**
- [ ] `<MealPlanner>` route renders Mon–Sun (or locale first-day) columns with configurable slots (default Breakfast, Lunch, Dinner)
- [ ] Slot count and names from `app_settings.meal_slots`
- [ ] Tap empty slot → recipe browse modal or free-text input
- [ ] Tap filled slot → full recipe view modal with ingredient checklist
- [ ] Today column visually highlighted (matches `food.png`)
- [ ] Drag-and-drop between slots flagged as Phase 2

**Technical Notes:**
- Design ref: `food.png`

**Dependencies:** STORY-5.2
**Estimate:** L
**Priority:** P1

---

#### STORY-5.5: Recipe library list and detail views
**As a** household member
**I want** to browse, search, and filter my recipe library
**So that** I can find and reuse recipes

**Acceptance Criteria:**
- [ ] List view: search by name, filter by tag, sort by recently added
- [ ] Detail view: hero photo, title, prep/cook/servings/calories chips, ingredient checklist, method steps, tags, "Add to meal plan", "Add ingredients to shopping list"
- [ ] Servings scaler: changing servings recalculates ingredient quantities
- [ ] Edit/delete (admin-permitted)
- [ ] Two-column landscape layout per PRD §7

**Technical Notes:**
- Design ref: `food.png` (recipe detail)

**Dependencies:** STORY-5.2
**Estimate:** L
**Priority:** P1

---

#### STORY-5.6: Add recipe ingredients to shopping list
**As a** household member
**I want** to add some/all of a recipe's ingredients to the shopping list with one tap
**So that** meal planning leads naturally to shopping

**Acceptance Criteria:**
- [ ] Recipe detail: per-ingredient checkbox + "Add N items" button
- [ ] On add: deduplicates against existing shopping items (same name + unit → quantities combined)
- [ ] Categorised using a built-in mapping (configurable in admin)
- [ ] Pending-approval flag set if added by Teen profile

**Technical Notes:**
- PRD §11

**Dependencies:** STORY-5.5, STORY-5.7
**Estimate:** M
**Priority:** P1

---

#### STORY-5.7: Shopping list module
**As a** household member
**I want** a shared shopping list with categories, ticking, and quick-add
**So that** anyone in the house can use it while shopping

**Acceptance Criteria:**
- [ ] Route `/food/shopping`
- [ ] Sections grouped by category (configurable via `app_settings.shopping_categories`)
- [ ] Tick item → fades and moves to "Ticked" section
- [ ] Add via input + autocomplete from common items + recent
- [ ] "Clear ticked" button removes all ticked items at once
- [ ] Real-time sync via WebSocket (other devices on network see ticks immediately)
- [ ] Pending-approval items shown to admin with approve/decline buttons

**Technical Notes:**
- PRD §11; uses `react-virtualized` for long lists

**Dependencies:** STORY-5.1, STORY-1.10
**Estimate:** L
**Priority:** P1

---

#### STORY-5.8: Pantry tab placeholder
**As a** household member
**I want** a Pantry tab in Food
**So that** future inventory tracking has a home

**Acceptance Criteria:**
- [ ] Tab visible in Food navigation (per design `food.png`: Plan | Recipes | Shopping list | Pantry)
- [ ] Renders "Coming soon" empty state for MVP

**Technical Notes:**
- Avoid scope creep — full pantry inventory is out-of-scope per PRD §35

**Dependencies:** STORY-5.4
**Estimate:** XS
**Priority:** P3

---

#### STORY-5.9: Servings calculator + portion-for-one mode
**As a** single-person household
**I want** to scale recipes to 1 portion
**So that** the shopping quantities are sane

**Acceptance Criteria:**
- [ ] Recipe header servings input editable; ingredients re-rendered scaled
- [ ] Quick "× 1 / × 2 / × 4" pills

**Technical Notes:**
- PRD §28 single-person households

**Dependencies:** STORY-5.5
**Estimate:** S
**Priority:** P2

---

#### STORY-5.10: Meal plan history and rotation suggestions
**As a** household admin
**I want** to see what I cooked recently
**So that** I don't repeat too often

**Acceptance Criteria:**
- [ ] Meal plan stores history (no auto-purge)
- [ ] "Cooked recently" indicator on recipe cards if cooked in last 14 days
- [ ] No suggestion engine in MVP — just visibility

**Dependencies:** STORY-5.4
**Estimate:** S
**Priority:** P3

---

### EPIC-6: Vehicles & Travel Module

Vehicle profiles, booking calendar, MOT/tax/service reminders, fuel log, transport adapter stub.

#### STORY-6.1: Vehicles + bookings + fuel logs schema
**As a** developer
**I want** `vehicles`, `vehicle_bookings`, `fuel_logs` tables and repositories
**So that** vehicle features can persist data

**Acceptance Criteria:**
- [ ] Migrations per architecture data model
- [ ] Repositories with full CRUD + booking-conflict query
- [ ] `findConflicts(vehicleId, start, end, excludeBookingId?)` returns overlapping bookings

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-6.2: Vehicles CRUD UI
**As a** household admin
**I want** to add and edit vehicles of any type with their renewal dates
**So that** the app knows about every household vehicle

**Acceptance Criteria:**
- [ ] List page with each vehicle's nickname, type, colour, registration, renewal countdown chips
- [ ] Add/edit form with type-specific fields (cars/vans show MOT/tax/service; bicycles hide MOT)
- [ ] Photo upload (optional)
- [ ] Delete confirmation

**Technical Notes:**
- PRD §12

**Dependencies:** STORY-6.1
**Estimate:** M
**Priority:** P1

---

#### STORY-6.3: Vehicle booking endpoints
**As a** developer
**I want** booking CRUD and conflict-detection endpoints
**So that** the vehicle calendar can prevent double-bookings

**Acceptance Criteria:**
- [ ] `GET/POST/DELETE /api/v1/vehicles/:id/bookings`
- [ ] POST returns 409 with conflict details if overlapping
- [ ] Bookings overlay-render in calendar via vehicle filter
- [ ] Tests cover overlap edge cases

**Dependencies:** STORY-6.1, STORY-2.3
**Estimate:** M
**Priority:** P1

---

#### STORY-6.4: Vehicle booking UI
**As a** household member
**I want** to book a vehicle for a date range
**So that** other family members can see it's taken

**Acceptance Criteria:**
- [ ] Vehicle detail page shows upcoming bookings list
- [ ] "Book" button → modal: profile, start, end, notes
- [ ] Conflict warning shown inline before save
- [ ] Booking shows on home carousel (per STORY-3.4) and calendar (filter overlay)

**Dependencies:** STORY-6.3
**Estimate:** M
**Priority:** P1

---

#### STORY-6.5: Fuel log + MPG tracking
**As a** vehicle owner
**I want** to log fuel fill-ups with mileage
**So that** I can see efficiency over time

**Acceptance Criteria:**
- [ ] `POST /api/v1/vehicles/:id/fuel-log` with date, litres, cost, mileage
- [ ] List of fill-ups with computed MPG/L per 100km (locale-aware)
- [ ] Hidden for EV (refers user to EV plugin / charging log)
- [ ] Simple line chart (last 12 fill-ups)

**Technical Notes:**
- PRD §12

**Dependencies:** STORY-6.2
**Estimate:** M
**Priority:** P2

---

#### STORY-6.6: Vehicle reminders (MOT, tax, insurance, service)
**As a** vehicle owner
**I want** alerts in advance of MOT, tax, insurance, service due
**So that** nothing lapses

**Acceptance Criteria:**
- [ ] Scheduler nightly job evaluates each vehicle's renewal dates against `app_settings.vehicle_reminder_days`
- [ ] AlertEngine.push() per due item; deduplicates daily
- [ ] Default windows: MOT 30/14/7/1d, insurance 28/14/3d, tax 14/3/1d, service when within 7d or 500mi of mileage
- [ ] Per-vehicle override possible

**Dependencies:** STORY-6.1, STORY-14.3
**Estimate:** M
**Priority:** P1

---

#### STORY-6.7: Transport adapter interface + UK National Rail stub
**As a** developer
**I want** a `TransportAdapter` interface and a default UK no-op stub
**So that** community plugins can register regional adapters later

**Acceptance Criteria:**
- [ ] Interface: `getJourneyTime({origin, destination, mode}) -> { mins, status, disruptions[] }`
- [ ] Adapter registry via plugin capability `transport_adapter`
- [ ] Default UK adapter stubbed (returns mocked times); flagged "stub" in admin
- [ ] Documented in `docs/plugins/transport-adapters.md`

**Technical Notes:**
- PRD §12 transport API layer

**Dependencies:** STORY-3.7, STORY-16.5
**Estimate:** M
**Priority:** P2

---

#### STORY-6.8: Mileage log for business travel (freelancer)
**As a** freelancer
**I want** to flag a journey as business and log mileage per vehicle
**So that** I have a record at tax time

**Acceptance Criteria:**
- [ ] Vehicle bookings have a "business" flag and miles field
- [ ] Aggregate report `GET /api/v1/vehicles/:id/business-mileage?from=&to=` returns total
- [ ] Visible only when "freelancer features" toggle on

**Technical Notes:**
- PRD §28 freelancers

**Dependencies:** STORY-6.4
**Estimate:** S
**Priority:** P3

---

### EPIC-7: Family Module — Children & Health

Child profiles, chores & rewards, health logs, baby tracking, routines, mood log.

#### STORY-7.1: Chores + completions + reward redemptions schema
**As a** developer
**I want** `chores`, `chore_completions`, `reward_redemptions`, and `health_logs` tables
**So that** family features can persist

**Acceptance Criteria:**
- [ ] Migrations per architecture data model
- [ ] Index `idx_chore_completions_profile`
- [ ] Repositories implemented
- [ ] Unit tests

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-7.2: Chore CRUD endpoints + complete endpoint
**As a** child
**I want** to mark my chores done and earn points
**So that** I can save up for rewards

**Acceptance Criteria:**
- [ ] `GET /api/v1/chores?profileId=`
- [ ] `POST /api/v1/chores` (admin)
- [ ] `PATCH /api/v1/chores/:id/complete` writes a `chore_completions` row, awards points to profile
- [ ] `GET /api/v1/rewards/:profileId` returns balance + recent completions/redemptions
- [ ] `POST /api/v1/rewards/:profileId/redeem` (admin) decrements points
- [ ] Permission middleware enforces "chore complete" per profile type matrix

**Dependencies:** STORY-7.1, STORY-2.3
**Estimate:** M
**Priority:** P1

---

#### STORY-7.3: Family hub page (admin view)
**As a** household admin
**I want** a Family overview with child cards showing chores done today, points balance, upcoming events
**So that** I can see at a glance how the kids are doing

**Acceptance Criteria:**
- [ ] Route `/family` with one card per child profile
- [ ] Card: avatar, name, today's chores (X/Y), points balance, next event chip
- [ ] Tap card → child detail (full chore list, health log, routines)

**Dependencies:** STORY-7.2
**Estimate:** M
**Priority:** P1

---

#### STORY-7.4: Child profile view (kid-friendly)
**As a** child
**I want** my own simplified view with today's events, chores, and star balance
**So that** I can use Nestor independently

**Acceptance Criteria:**
- [ ] When active profile type is `child` or `toddler`, root route is `/me` (not `/`)
- [ ] Big "My Day" card, large chore tiles with check buttons, star balance, current reward target
- [ ] Toddler variant: just star tap (per PRD §5)
- [ ] Reward burst animation on chore complete (Framer Motion)
- [ ] All chrome simplified — no settings, no admin

**Technical Notes:**
- PRD §5 child + toddler views

**Dependencies:** STORY-7.3, STORY-2.8
**Estimate:** L
**Priority:** P1

---

#### STORY-7.5: Reward star grid + streak tracking
**As a** child
**I want** to see a visual grid of stars filling up toward a reward
**So that** progress feels tangible

**Acceptance Criteria:**
- [ ] Grid renders empty stars; fills from completions
- [ ] Streak indicator (consecutive days with at least one chore done)
- [ ] Configurable target (5/10/20 stars per reward, configurable in admin)
- [ ] Burst animation when target hit

**Dependencies:** STORY-7.4
**Estimate:** M
**Priority:** P1

---

#### STORY-7.6: Health log endpoints + UI (general)
**As a** parent
**I want** to log medicine, temperature, and symptoms for any family member
**So that** I have a record to share with a GP

**Acceptance Criteria:**
- [ ] `GET/POST /api/v1/health-log/:profileId` with `log_type` enum
- [ ] UI: timeline view per profile, filter by type
- [ ] Add modal: type-specific fields (medicine: name+dose+reason; temperature: value+unit; symptom: free text)
- [ ] Export-as-PDF for last 30 days (admin only)
- [ ] Permission gates: only admin or self can view; cross-profile forbidden

**Dependencies:** STORY-7.1
**Estimate:** L
**Priority:** P1

---

#### STORY-7.7: Baby tracking — feeds, nappies, sleep
**As a** parent of a baby
**I want** to log feeds, nappies, and sleep with running totals for the day
**So that** I can answer "when did she last feed?"

**Acceptance Criteria:**
- [ ] Quick-log buttons on baby profile home: Feed (left/right/bottle/amount), Nappy (wet/dirty), Sleep (start/stop)
- [ ] Today summary: counts and last-event ago timers (e.g. "Last feed 1h 23m ago")
- [ ] Scrollable timeline
- [ ] Overdue alert if last feed > N hours (configurable per baby)

**Technical Notes:**
- PRD §13

**Dependencies:** STORY-7.6
**Estimate:** L
**Priority:** P2

---

#### STORY-7.8: Growth log + percentile chart
**As a** parent
**I want** to log baby weight, length, head circumference and see a percentile chart
**So that** I can track growth

**Acceptance Criteria:**
- [ ] Growth log entries with WHO percentile reference data bundled
- [ ] Chart shows percentile bands (3, 15, 50, 85, 97) and the baby's points
- [ ] Locale units (kg/lb, cm/in)

**Dependencies:** STORY-7.7
**Estimate:** L
**Priority:** P2

---

#### STORY-7.9: NHS / region vaccination reminders
**As a** parent of a baby
**I want** automatic vaccination reminders based on NHS schedule
**So that** I don't miss appointments

**Acceptance Criteria:**
- [ ] Bundled JSON of NHS infant vaccination schedule (8/12/16wk, 1y, etc.)
- [ ] On baby profile creation, schedule generated with due-date offsets from DOB
- [ ] Reminders pushed to alert engine 14d, 3d, day-of
- [ ] Mark as completed → moves into health log
- [ ] Region-swappable: `app_settings.vaccination_schedule_region` (NHS default)

**Dependencies:** STORY-7.7, STORY-14.3
**Estimate:** M
**Priority:** P2

---

#### STORY-7.10: Children's routines (morning/bedtime)
**As a** child
**I want** a morning and bedtime routine I can tick through
**So that** I don't forget steps

**Acceptance Criteria:**
- [ ] Per-child routines (uses Checklists system from STORY-19.x)
- [ ] Auto-resets daily
- [ ] Step-by-step UI with satisfying tick animation

**Technical Notes:**
- PRD §13 / §19

**Dependencies:** STORY-7.4, STORY-19.x (checklists; modeled in STORY-8.10)
**Estimate:** M
**Priority:** P2

---

#### STORY-7.11: Mood / wellbeing log (optional)
**As a** teen
**I want** a discreet daily mood check-in
**So that** I can track patterns

**Acceptance Criteria:**
- [ ] Simple 5-emoji scale + optional note
- [ ] Per-profile toggle to enable
- [ ] Not surfaced for younger children
- [ ] Trend chart (last 30 days)

**Dependencies:** STORY-7.6
**Estimate:** S
**Priority:** P3

---

#### STORY-7.12: Allowance/points-to-money tracker (teen)
**As a** teen
**I want** my points to convert into a money equivalent at a configurable rate
**So that** I can save up for things

**Acceptance Criteria:**
- [ ] Admin sets conversion rate per teen profile
- [ ] Teen view shows "Points: X = £Y"
- [ ] Redemption logs cash redemptions distinctly

**Technical Notes:**
- PRD §5 teen profile

**Dependencies:** STORY-7.5
**Estimate:** S
**Priority:** P2

---

### EPIC-8: House Module

Household chores rota, bin day with alternating cycle calculation, bills, subscriptions, maintenance, meter readings, budget.

#### STORY-8.1: House schema (bin_schedules, subscriptions, home_maintenance, meter_readings, budgets)
**As a** developer
**I want** the House domain tables and repositories
**So that** all house features can persist

**Acceptance Criteria:**
- [ ] Migrations per architecture data model
- [ ] Repositories with CRUD
- [ ] Tests

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-8.2: Bin schedule alternating-cycle calculator
**As a** developer
**I want** a pure function `nextCollections(binSchedule, fromDate, count) -> Date[]`
**So that** UI can render upcoming collections without per-date entry

**Acceptance Criteria:**
- [ ] Inputs: `day_of_week`, `frequency_weeks` (1/2/4), `anchor_date`, `bank_holiday_shift`
- [ ] Output: next N collection dates
- [ ] Bank holiday shift: shifts forward by 1 day if collection day is on a UK bank holiday (configurable region)
- [ ] Bundled UK bank holiday list (extendable per region)
- [ ] Unit tests for weekly, fortnightly, every-4-weeks, bank-holiday weeks

**Technical Notes:**
- PRD §14 "How alternating schedules work"

**Dependencies:** STORY-8.1
**Estimate:** M
**Priority:** P1

---

#### STORY-8.3: Bin schedule CRUD UI + day-card icons
**As a** household admin
**I want** to configure my bin schedule with colour, icon, frequency
**So that** the carousel shows bins on the right days

**Acceptance Criteria:**
- [ ] Bin admin page: add/edit/delete bin types
- [ ] Form: name, colour picker, icon picker, day, frequency, anchor date, bank-holiday-shift toggle
- [ ] Coloured icon shows on relevant home-carousel day cards
- [ ] Endpoint `GET /api/v1/bin-schedules/upcoming?days=14` returns rolling list
- [ ] House page shows next 14 days of collections

**Dependencies:** STORY-8.2, STORY-3.4
**Estimate:** L
**Priority:** P1

---

#### STORY-8.4: Bin day alerts
**As a** household member
**I want** a "bin out tomorrow" alert
**So that** I don't forget

**Acceptance Criteria:**
- [ ] Scheduler evaluates bin collections in next 24h
- [ ] Alerts pushed evening before / morning of (configurable per bin)
- [ ] Optional audio chime per bin
- [ ] Alert dismissed automatically after collection day passes

**Dependencies:** STORY-8.2, STORY-14.3
**Estimate:** S
**Priority:** P1

---

#### STORY-8.5: Subscription tracker
**As a** household admin
**I want** to log subscriptions with renewal dates and monthly cost
**So that** I see total monthly subscription spend

**Acceptance Criteria:**
- [ ] CRUD endpoints under `/api/v1/subscriptions`
- [ ] List view with running total
- [ ] Renewal alerts (default 7d before)
- [ ] Trial-end alert (3d before)
- [ ] Categories: streaming, software, services, other (configurable)

**Dependencies:** STORY-8.1
**Estimate:** M
**Priority:** P1

---

#### STORY-8.6: Home maintenance log
**As a** household admin
**I want** to log completed jobs, warranties, and scheduled maintenance
**So that** I keep the house in good shape

**Acceptance Criteria:**
- [ ] CRUD endpoints; types: `job` (completed), `warranty` (expiry tracker), `reminder` (next due)
- [ ] Renter mode flag: replaces "book tradesperson" with "report to landlord" UI
- [ ] Link to Contacts entry for tradesperson
- [ ] Reminder alerts via scheduler

**Technical Notes:**
- PRD §14

**Dependencies:** STORY-8.1, STORY-12.1
**Estimate:** M
**Priority:** P1

---

#### STORY-8.7: Meter readings log + chart
**As a** household admin
**I want** to log monthly gas/electricity readings
**So that** I can see usage over time and the EV plugin has a rate

**Acceptance Criteria:**
- [ ] CRUD endpoint per `fuel_type`
- [ ] Chart: cumulative usage over 12 months
- [ ] Configurable rate per fuel type (used by EV plugin)
- [ ] Monthly reminder on configurable date of month

**Dependencies:** STORY-8.1
**Estimate:** M
**Priority:** P1

---

#### STORY-8.8: Budget tracker
**As a** household admin
**I want** a monthly budget figure with quick-add expenses by category
**So that** I have basic spend awareness

**Acceptance Criteria:**
- [ ] `budget_categories` and `budget_expenses` tables
- [ ] Monthly budget figure; categories configurable
- [ ] Quick-add expense (amount, category, note)
- [ ] Spend-vs-budget bar per category + total
- [ ] Reset on month boundary (data preserved historically)

**Technical Notes:**
- PRD §14 budget tracker

**Dependencies:** STORY-8.1
**Estimate:** M
**Priority:** P2

---

#### STORY-8.9: Household chores rota (adults)
**As a** household admin
**I want** to assign recurring tasks to adults with due dates
**So that** the rota is visible

**Acceptance Criteria:**
- [ ] Reuses chores tables (filter by adult profiles)
- [ ] Frequency picker; overdue indicator
- [ ] Marked done by any adult
- [ ] Separate visual section in House page (not mixed with kid chores)

**Dependencies:** STORY-7.2
**Estimate:** S
**Priority:** P1

---

#### STORY-8.10: Checklists system foundation
**As a** developer
**I want** the unified `checklists` and `checklist_items` tables and a generic checklist UI
**So that** routines, packing lists, guest checklists all share the same engine

**Acceptance Criteria:**
- [ ] Schema per data model with auto-reset (cron expression in `auto_reset_cron`)
- [ ] Templates bundled: nursery bag, morning routine, bedtime routine, packing, day trip, guest arrival, guest departure
- [ ] Reset job runs nightly + on-demand
- [ ] CRUD endpoints
- [ ] Generic `<Checklist>` component used across modules

**Technical Notes:**
- PRD §19 checklists

**Dependencies:** STORY-8.1
**Estimate:** L
**Priority:** P1

---

### EPIC-9: Finance Module

Finance agreements, monthly commitments summary, savings goals, end-date alerts.

#### STORY-9.1: Finance schema + repositories
**As a** developer
**I want** `finance_agreements` and `savings_goals` tables and repositories
**So that** finance features can persist

**Acceptance Criteria:**
- [ ] Migrations per data model
- [ ] Repos with CRUD + monthly aggregation query
- [ ] Tests

**Dependencies:** STORY-1.5
**Estimate:** S
**Priority:** P1

---

#### STORY-9.2: Finance agreements CRUD
**As a** household admin
**I want** to record finance agreements (PCP, loans, BNPL, mortgage)
**So that** monthly commitments are visible

**Acceptance Criteria:**
- [ ] `GET/POST/PATCH/DELETE /api/v1/finance/agreements`
- [ ] Type-specific fields (mortgage shows fixed_rate_end_date; PCP shows balloon_payment)
- [ ] Per-agreement alert lead time
- [ ] Currency display via locale settings

**Dependencies:** STORY-9.1
**Estimate:** M
**Priority:** P1

---

#### STORY-9.3: Monthly commitments summary
**As a** household admin
**I want** a single summary of monthly committed outgoings (agreements + subscriptions + insurances + commitments)
**So that** I see total committed spend

**Acceptance Criteria:**
- [ ] `GET /api/v1/finance/summary` aggregates from `finance_agreements`, `subscriptions`, vehicle insurance dates, regular commitments table
- [ ] Per-category subtotals with expand/collapse
- [ ] Total committed at bottom
- [ ] Currency from locale

**Technical Notes:**
- PRD §15 monthly outgoings summary

**Dependencies:** STORY-9.2, STORY-8.5
**Estimate:** M
**Priority:** P1

---

#### STORY-9.4: Savings goals
**As a** household admin
**I want** named savings goals with progress bars
**So that** I can visualise targets

**Acceptance Criteria:**
- [ ] CRUD `/api/v1/finance/savings`
- [ ] Goal: name, target_amount, current_amount, currency, optional linked countdown
- [ ] Progress bar on the goal card; milestone alerts (25/50/75/100%)

**Dependencies:** STORY-9.1
**Estimate:** M
**Priority:** P1

---

#### STORY-9.5: End-date alerts (mortgage, agreements, insurance)
**As a** household admin
**I want** advance alerts when fixed rates / agreements / insurance are ending
**So that** I have time to shop around

**Acceptance Criteria:**
- [ ] Scheduler evaluates `fixed_rate_end_date`, `end_date`, vehicle insurance dates
- [ ] Default windows: mortgage 6mo, agreement 3mo, insurance 4wk
- [ ] Per-record override
- [ ] Alerts dismissed individually

**Dependencies:** STORY-9.2, STORY-14.3
**Estimate:** M
**Priority:** P1

---

#### STORY-9.6: Regular commitments + benefits/income reminders
**As a** household admin
**I want** to track standing commitments (rent, pension, childcare) and incoming benefits (UC, child benefit)
**So that** the rhythm is visible

**Acceptance Criteria:**
- [ ] `regular_commitments` table (name, amount, day_of_month, direction in/out)
- [ ] List view; included in monthly summary
- [ ] Day-of-month reminders via scheduler

**Technical Notes:**
- PRD §15 regular commitments + benefits

**Dependencies:** STORY-9.3
**Estimate:** M
**Priority:** P2

---

#### STORY-9.7: Debt paydown visualiser
**As a** household admin
**I want** to see finance balances reduce over time
**So that** I stay motivated

**Acceptance Criteria:**
- [ ] Per-agreement timeline chart based on monthly_payment and remaining_balance
- [ ] Snowball/avalanche method visualiser (stretch — basic ordering)

**Dependencies:** STORY-9.2
**Estimate:** S
**Priority:** P3

---

### EPIC-10: Pets Module

Pet profiles, health/vaccination logs, vet appointments, documents.

#### STORY-10.1: Pets schema + repositories
**As a** developer
**I want** `pets` and `pet_health_logs` tables and repos
**So that** pet features can persist

**Acceptance Criteria:**
- [ ] Migrations per data model
- [ ] Index `idx_pet_health_next_due` partial on `next_due_date IS NOT NULL`
- [ ] Repos with CRUD + upcomingCare query

**Dependencies:** STORY-1.5
**Estimate:** S
**Priority:** P1

---

#### STORY-10.2: Pets CRUD UI
**As a** pet owner
**I want** to add pets with photo, microchip, vet contact, feeding/grooming notes
**So that** the household has the pet's details handy

**Acceptance Criteria:**
- [ ] List + add/edit form per PRD §16
- [ ] Photo upload via shared upload helper
- [ ] Vet contact picker linked to Contacts

**Dependencies:** STORY-10.1, STORY-12.1
**Estimate:** M
**Priority:** P1

---

#### STORY-10.3: Pet health log + vaccination/flea/worming reminders
**As a** pet owner
**I want** to log vaccinations and flea/worming with next-due dates
**So that** I don't miss boosters

**Acceptance Criteria:**
- [ ] `GET/POST /api/v1/pets/:id/health-log` with type enum
- [ ] Each entry can set `next_due_date` and `reminder_days_before`
- [ ] Scheduler nightly: alerts at lead time
- [ ] Pet detail timeline view
- [ ] Active medication daily reminders

**Dependencies:** STORY-10.1, STORY-14.3
**Estimate:** M
**Priority:** P1

---

#### STORY-10.4: Vet appointments → calendar event with pet filter
**As a** pet owner
**I want** vet appointments to show on the calendar with the pet's filter
**So that** I see them in context

**Acceptance Criteria:**
- [ ] Adding a vet appointment creates a `calendar_events` row with `type=vet` and pet linkage
- [ ] Pet filter in sidebar shows/hides events
- [ ] Post-visit notes field on the appointment

**Dependencies:** STORY-10.2, STORY-4.10, STORY-2.9
**Estimate:** S
**Priority:** P1

---

#### STORY-10.5: Pet weight log + chart
**As a** pet owner
**I want** to log my pet's weight over time
**So that** I see trends

**Acceptance Criteria:**
- [ ] Weight log type entry; line chart on pet detail
- [ ] Locale units

**Dependencies:** STORY-10.3
**Estimate:** S
**Priority:** P2

---

#### STORY-10.6: Pet documents upload
**As a** pet owner
**I want** to attach vaccination certs, insurance, passport PDFs to a pet
**So that** they're easy to find

**Acceptance Criteria:**
- [ ] Upload endpoint accepts PDF/JPEG/PNG up to 10MB; UUID-named storage
- [ ] List with filename, type, size; download link
- [ ] Delete confirmation

**Dependencies:** STORY-10.2
**Estimate:** S
**Priority:** P2

---

### EPIC-11: Board Module

Family message board, whiteboard, countdown timers, general lists.

#### STORY-11.1: Board schema (messages, countdowns, whiteboard snapshots)
**As a** developer
**I want** `board_messages`, `countdown_timers`, `whiteboard_snapshots` tables and repos
**So that** Board can persist

**Acceptance Criteria:**
- [ ] Migrations per data model
- [ ] Repos with CRUD

**Dependencies:** STORY-1.5
**Estimate:** S
**Priority:** P1

---

#### STORY-11.2: Family message board UI
**As a** household member
**I want** sticky-note style messages colour-coded by author
**So that** quick household notes are visible

**Acceptance Criteria:**
- [ ] List of cards with author colour, content, timestamp
- [ ] Compose: text area, optional pin, save → POST
- [ ] Dismiss / archive
- [ ] Realtime push via WebSocket

**Dependencies:** STORY-11.1, STORY-1.10
**Estimate:** M
**Priority:** P1

---

#### STORY-11.3: Whiteboard freehand drawing
**As a** household member
**I want** a freehand drawing canvas
**So that** I can quickly sketch a note

**Acceptance Criteria:**
- [ ] HTML5 canvas with pressure-sensitive stroke (touch + Pointer Events)
- [ ] Colour palette, stroke width, eraser, clear, undo
- [ ] Save snapshot → PNG → uploaded to `~/.nestor/uploads/whiteboard/`
- [ ] Snapshot list with name + thumbnail

**Technical Notes:**
- PRD §18

**Dependencies:** STORY-11.1
**Estimate:** L
**Priority:** P2

---

#### STORY-11.4: Countdown timers
**As a** household member
**I want** named countdowns with days remaining
**So that** holidays/birthdays/Christmas are visible

**Acceptance Criteria:**
- [ ] CRUD endpoints
- [ ] List view with day-count chips
- [ ] Optional "show on home screen" flag → renders in home Coming Up widget
- [ ] Linkable from savings goals

**Dependencies:** STORY-11.1
**Estimate:** S
**Priority:** P1

---

#### STORY-11.5: General lists
**As a** household member
**I want** named tickable lists I can reuse
**So that** non-shopping lists also have a home

**Acceptance Criteria:**
- [ ] Reuses checklist engine (STORY-8.10) with `type=one_off|recurring`
- [ ] Listed under Board > Lists
- [ ] Templates support

**Dependencies:** STORY-8.10
**Estimate:** S
**Priority:** P2

---

#### STORY-11.6: Guest visit checklist
**As a** household member
**I want** a guest visit checklist auto-linked to a calendar event
**So that** the room is ready in time

**Acceptance Criteria:**
- [ ] Checklist with `guest_name` and `guest_arrival_date`
- [ ] Scheduler alerts N days before if incomplete
- [ ] Pre-arrival and post-departure built-in templates
- [ ] Multiple guest room profiles

**Technical Notes:**
- PRD §19 guest visitation checklist

**Dependencies:** STORY-8.10
**Estimate:** M
**Priority:** P2

---

### EPIC-12: Contacts Module

Categorised directory, tap-to-call placeholder, cross-linking from pets/maintenance.

#### STORY-12.1: Contacts schema + CRUD endpoints
**As a** developer
**I want** the `contacts` table with category enum and link fields
**So that** other modules can reference contacts

**Acceptance Criteria:**
- [ ] Migration + repository
- [ ] CRUD endpoints `/api/v1/contacts?category=`
- [ ] Permission: child can only view emergency contacts; teen sees full

**Dependencies:** STORY-1.5
**Estimate:** S
**Priority:** P1

---

#### STORY-12.2: Contacts list + categories UI
**As a** household member
**I want** a categorised contacts list (medical, school, pets, home services, emergency, family, tradespeople)
**So that** I can find any number quickly

**Acceptance Criteria:**
- [ ] List grouped by category with collapse
- [ ] Search by name/role
- [ ] Add/edit/delete (admin)

**Dependencies:** STORY-12.1
**Estimate:** M
**Priority:** P1

---

#### STORY-12.3: Tap-to-dial via tel: + audio hardware check
**As a** household member
**I want** to tap a contact's phone number to call (if a phone is paired)
**So that** the device acts as a phone book

**Acceptance Criteria:**
- [ ] Tap → triggers `tel:` link or shows "Call from your phone" if no audio device
- [ ] No actual telephony in MVP — relies on OS handler / paired phone
- [ ] Long-press → copy number to clipboard

**Dependencies:** STORY-12.2
**Estimate:** S
**Priority:** P2

---

#### STORY-12.4: Cross-linking from pets / maintenance
**As a** developer
**I want** Contact picker components used from Pets (vet) and Maintenance (tradesperson)
**So that** there is one source of truth for contacts

**Acceptance Criteria:**
- [ ] `<ContactPicker category="">` component
- [ ] Pet vet field uses `category=pets`
- [ ] Maintenance tradesperson uses `category=trade`
- [ ] Linked contacts appear in `linked_pet_id`/`linked_vehicle_id` columns where relevant

**Dependencies:** STORY-12.2, STORY-10.2, STORY-8.6
**Estimate:** S
**Priority:** P1

---

### EPIC-13: EV & Energy Module

Charging log, energy overview, monthly cost summary.

#### STORY-13.1: EV charging log schema + repo
**As a** developer
**I want** the `ev_charging_log` table and repo
**So that** charging sessions can be persisted

**Acceptance Criteria:**
- [ ] Migration per data model
- [ ] Repo with CRUD + monthly aggregation

**Dependencies:** STORY-1.5
**Estimate:** S
**Priority:** P1

---

#### STORY-13.2: Manual charging log endpoints + UI
**As a** EV owner
**I want** to log home charging sessions with date/kWh/cost
**So that** monthly cost is tracked even without a Tesla plugin

**Acceptance Criteria:**
- [ ] `GET/POST /api/v1/ev/charging-log`
- [ ] Per-vehicle filter
- [ ] List view + add modal
- [ ] Cumulative cost chart

**Dependencies:** STORY-13.1
**Estimate:** M
**Priority:** P1

---

#### STORY-13.3: Energy overview dashboard
**As a** household admin
**I want** a single page combining EV charging + meter readings + monthly cost
**So that** energy spend is visible

**Acceptance Criteria:**
- [ ] Cards: this month's electricity (from meter), home EV charging cost, gas/oil cost (if logged), total
- [ ] Cost calculations use rates from `app_settings.fuel_rates`
- [ ] 12-month chart of total energy spend

**Dependencies:** STORY-13.2, STORY-8.7
**Estimate:** M
**Priority:** P1

---

#### STORY-13.4: Configurable fuel/electricity rates
**As a** household admin
**I want** to set electricity/gas/oil rates so cost calculations are accurate
**So that** the energy overview is meaningful

**Acceptance Criteria:**
- [ ] Settings panel under Energy & Budget
- [ ] Per-fuel rate (with effective date for future rate change)
- [ ] Used by EV charging cost and meter reading consumption

**Technical Notes:**
- PRD §30 Energy & Budget

**Dependencies:** STORY-13.2, STORY-17.x
**Estimate:** S
**Priority:** P1

---

#### STORY-13.5: EV "not plugged in" alert (core, plugin-independent)
**As a** EV owner without the Tesla plugin
**I want** to set a reminder time to plug in
**So that** I remember overnight charging

**Acceptance Criteria:**
- [ ] Per-vehicle setting: `plug_in_reminder_time` (HH:mm, days)
- [ ] Scheduler pushes alert at that time on selected days
- [ ] Dismissible; mark "plugged in" suppresses for tonight

**Dependencies:** STORY-13.1, STORY-14.3
**Estimate:** S
**Priority:** P2

---

### EPIC-14: Alert System

Alert engine, badges, dismissal, audio chime, scheduler integration.

#### STORY-14.1: Alerts schema + repository
**As a** developer
**I want** the `alerts` table with dismissed/severity columns and an indexed query
**So that** alerts can be aggregated efficiently

**Acceptance Criteria:**
- [ ] Migration per data model
- [ ] Index `idx_alerts_dismissed`
- [ ] Repository with `push`, `findActive`, `dismiss`, `badgeCounts`
- [ ] `push()` deduplicates by `(source_module, alert_type, profile_id, day_bucket)` so the same alert doesn't fire twice in a day

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-14.2: Alert engine service
**As a** developer
**I want** an `AlertEngine` service that other modules call to push alerts
**So that** there is one alert pipeline

**Acceptance Criteria:**
- [ ] `AlertEngine.push({ source, type, severity, message, profileId?, navModeBadge? })`
- [ ] Persists, deduplicates, emits `alert:new` event → WebSocket broadcast
- [ ] `dismiss(id)` sets dismissed=true, broadcasts
- [ ] In-memory unread count cache for fast badge queries

**Technical Notes:**
- Architecture §"Component 5: Alert Engine"

**Dependencies:** STORY-14.1, STORY-1.9, STORY-1.10
**Estimate:** M
**Priority:** P1

---

#### STORY-14.3: Reminder evaluator scheduler job
**As a** developer
**I want** a nightly job that evaluates reminders across all modules
**So that** alerts are pushed proactively

**Acceptance Criteria:**
- [ ] Job registered (cron `5 0 * * *`)
- [ ] Each module exposes a `evaluateReminders(now)` hook (vehicles, pets, finance, subscriptions, maintenance, meter readings, bin schedules, baby tracking, guests)
- [ ] Engine calls each, catching exceptions
- [ ] Manual run endpoint `POST /api/v1/admin/run-reminder-eval` for diagnostics

**Dependencies:** STORY-14.2, STORY-1.11
**Estimate:** M
**Priority:** P1

---

#### STORY-14.4: Alerts API + WebSocket events
**As a** developer
**I want** REST and WS endpoints so the UI can render alerts in real time
**So that** dismissals reflect immediately

**Acceptance Criteria:**
- [ ] `GET /api/v1/alerts` returns active alerts (newest first)
- [ ] `POST /api/v1/alerts/:id/dismiss`
- [ ] `GET /api/v1/alerts/badge-counts` returns `{ home: 0, calendar: 1, ...}`
- [ ] WS broadcasts on push/dismiss

**Dependencies:** STORY-14.2
**Estimate:** S
**Priority:** P1

---

#### STORY-14.5: Audio chime per alert category
**As a** household admin
**I want** optional audio chimes per alert category
**So that** important alerts are audible

**Acceptance Criteria:**
- [ ] Per-category toggle in Settings → House → Notifications
- [ ] Chime plays in browser via Web Audio API for clients in foreground
- [ ] Audio respects quiet hours (`app_settings.quiet_hours`)

**Dependencies:** STORY-14.4
**Estimate:** S
**Priority:** P2

---

#### STORY-14.6: Severity colour coding + nav badges
**As a** household member
**I want** alerts visibly coloured by severity and reflected in nav-mode badges
**So that** urgency is obvious

**Acceptance Criteria:**
- [ ] Colour tokens: urgent (red), warning (amber), info (blue), success (green)
- [ ] Nav buttons show numeric badge for unread alerts in their mode
- [ ] Clicking nav mode marks alerts in that mode as "read" (not dismissed)

**Dependencies:** STORY-14.4, STORY-2.7
**Estimate:** S
**Priority:** P1

---

#### STORY-14.7: Plugin-source alerts
**As a** plugin author
**I want** to push alerts via `pluginContext.pushAlert(...)`
**So that** plugin alerts surface in the same strip

**Acceptance Criteria:**
- [ ] `NestorPluginContext.pushAlert(...)` proxies to `AlertEngine.push` with `source='plugin:<id>'`
- [ ] Disabling a plugin auto-dismisses its outstanding alerts
- [ ] Alert dismissal does not re-fire while plugin is enabled (dedup)

**Dependencies:** STORY-14.2, STORY-16.4
**Estimate:** S
**Priority:** P1

---

### EPIC-15: Voice Pipeline

Separate voice process with OpenWakeWord + Whisper + Piper, voice command router, IPC to Express, quiet hours.

#### STORY-15.1: Voice process bootstrap + systemd service
**As a** developer
**I want** a separate Node.js process that starts on boot if audio hardware is detected
**So that** voice runs in isolation

**Acceptance Criteria:**
- [ ] `server/src/voice/process.ts` is a separate entry point
- [ ] systemd service `nestor-voice.service` (template) — `Requires=nestor-server.service`
- [ ] Detects USB audio at startup; exits cleanly with logged message if none
- [ ] Health endpoint `GET /internal/voice/status` returns `{ status, wakewordModel, sttModel, ttsModel }`
- [ ] Internal shared secret in `app_settings.voice_internal_token` for IPC auth

**Technical Notes:**
- Architecture §"Component 4: Voice Pipeline Process"

**Dependencies:** STORY-1.4, STORY-1.5
**Estimate:** M
**Priority:** P2

---

#### STORY-15.2: OpenWakeWord integration with custom wake-word training
**As a** household admin
**I want** to record ~30 samples of a custom wake word during setup
**So that** I can wake Nestor with my chosen phrase

**Acceptance Criteria:**
- [ ] OpenWakeWord runs as a Python subprocess managed by the Node voice process
- [ ] Setup endpoint `POST /api/v1/voice/wakeword/start-training` returns recording session
- [ ] Samples uploaded to `~/.nestor/voice/wakeword-samples/`
- [ ] Training script invoked; produces a model file
- [ ] Active model path stored in `app_settings.voice_wakeword_model_path`
- [ ] Wake event sent over IPC to voice process triggers STT

**Technical Notes:**
- PRD §22 wake word

**Dependencies:** STORY-15.1
**Estimate:** XL
**Priority:** P2

---

#### STORY-15.3: Whisper STT integration
**As a** developer
**I want** local Whisper transcription triggered after wake event
**So that** speech is captured offline

**Acceptance Criteria:**
- [ ] After wake: 5-second audio buffer captured (configurable max 10s)
- [ ] Whisper.cpp invoked via child process; transcript returned to voice process
- [ ] Model selection in `app_settings.voice_stt_model` (`tiny|base|small`); default `base`
- [ ] Transcript POSTed to `/internal/voice/command`
- [ ] Cancellation if buffer is silent

**Technical Notes:**
- Architecture §"Voice Pipeline Process"; consider whisper.cpp for low resource

**Dependencies:** STORY-15.2
**Estimate:** L
**Priority:** P2

---

#### STORY-15.4: Voice command router (core built-ins)
**As a** household member
**I want** "Go to calendar", "Show today", "Back to home" to work
**So that** core navigation can be voice-driven

**Acceptance Criteria:**
- [ ] `VoiceRouter` matches transcript against rule set:
  - "go to (calendar|food|family|house|board|finance|pets|ev|vehicles)" → broadcast `nav:goto:{mode}` over WS
  - "show (today|tomorrow|this week)" → broadcast `nav:date:{date}`
  - "back to home" → broadcast `nav:goto:home`
  - "what time/day is it" → push TTS reply
- [ ] Unmatched transcripts pass to plugin handlers
- [ ] Logged to `voice_command_log`
- [ ] Unit tests cover all built-ins + fall-through

**Technical Notes:**
- PRD §22 voice command router

**Dependencies:** STORY-15.3
**Estimate:** M
**Priority:** P2

---

#### STORY-15.5: Piper TTS integration + queue
**As a** developer
**I want** TTS responses played via Piper with a queue
**So that** plugin and core TTS don't collide

**Acceptance Criteria:**
- [ ] `POST /internal/voice/tts` queues `{ text, voiceId }`
- [ ] Voice process synthesises and plays sequentially via aplay/sox
- [ ] Voice and speed configurable via settings
- [ ] Slow-plugin TTS doesn't block core (timeout per item 30s)

**Dependencies:** STORY-15.1
**Estimate:** M
**Priority:** P2

---

#### STORY-15.6: Voice listening indicator over WebSocket
**As a** household member
**I want** a visible "listening" indicator on the screen when Nestor wakes
**So that** I know it heard me

**Acceptance Criteria:**
- [ ] Voice process broadcasts `voice:status` over IPC → core forwards to WS
- [ ] Floating mic indicator on home header lights up
- [ ] States: idle / listening / processing / speaking

**Dependencies:** STORY-15.4
**Estimate:** S
**Priority:** P2

---

#### STORY-15.7: Quiet hours enforcement
**As a** night-shift worker
**I want** no TTS or audio chimes during quiet hours
**So that** I'm not woken

**Acceptance Criteria:**
- [ ] Voice process polls `app_settings.quiet_hours` before any TTS playback; if within window, swallow output (still log)
- [ ] Audio chimes also gated
- [ ] UI banner indicating quiet hours active

**Dependencies:** STORY-15.5
**Estimate:** S
**Priority:** P2

---

#### STORY-15.8: Voice command history admin view
**As a** household admin
**I want** a log of voice commands and matches
**So that** I can debug or audit

**Acceptance Criteria:**
- [ ] `GET /api/v1/admin/voice-commands?limit=` returns recent entries
- [ ] Admin UI table with timestamp, transcript, matched handler, response
- [ ] Clear button (admin)

**Dependencies:** STORY-15.4
**Estimate:** S
**Priority:** P2

---

#### STORY-15.9: Voice fallback when hardware missing
**As a** household member
**I want** the app to behave normally if there's no mic/speaker
**So that** voice being optional means optional

**Acceptance Criteria:**
- [ ] If voice service is offline, mic indicator hidden, voice settings show "No audio device detected"
- [ ] Health endpoint reports `voice: offline`
- [ ] No crash anywhere in the UI

**Dependencies:** STORY-15.1
**Estimate:** XS
**Priority:** P2

---

### EPIC-16: Plugin System & Official Plugins

Plugin manifest, capability registry, plugin manager, official plugins (Tesla, Eufy, AI Assistant, Garden Pal stub).

#### STORY-16.1: Plugin manifest schema + loader
**As a** developer
**I want** plugins discovered from `/plugins/*/manifest.json` at startup
**So that** core can validate and register them

**Acceptance Criteria:**
- [ ] Zod schema for manifest (id, name, version, author, description, capabilities[], settingsFields[], apiRisk)
- [ ] On startup, scan `/plugins/`, validate each manifest, log warnings for invalid
- [ ] In-memory registry with disabled plugins flagged
- [ ] `app_settings.plugins_enabled` JSON array of enabled plugin IDs

**Technical Notes:**
- Architecture §"Component 2: Plugin Manager"

**Dependencies:** STORY-1.5
**Estimate:** M
**Priority:** P1

---

#### STORY-16.2: NestorPluginContext + Plugin Manager runtime
**As a** plugin author
**I want** a `NestorPluginContext` with safe access to alert push, TTS queue, settings, calendar add, widget register
**So that** plugins can interact with core without direct DB access

**Acceptance Criteria:**
- [ ] `PluginManager.load(plugin)` `require`s plugin entry, calls `init(context)`, catches all errors
- [ ] Context API: `pushAlert`, `speak`, `addEvent`, `registerWidget`, `registerNavMode`, `registerVoiceHandler`, `registerSidebarFilter`, `registerTransportAdapter`, `registerCalendarSystem`, `getSetting`, `setSetting`, `httpRequest` (proxied with rate-limit)
- [ ] All context methods wrapped in try/catch; errors logged with plugin ID
- [ ] Plugin disable: deregister all capabilities, dismiss its alerts, remove its widgets
- [ ] Hot-reload not required (restart on enable/disable acceptable for MVP)

**Technical Notes:**
- Architecture §"Plugin Isolation" NFR-004

**Dependencies:** STORY-16.1, STORY-14.7
**Estimate:** XL
**Priority:** P1

---

#### STORY-16.3: Plugin admin page + enable/disable + settings panel
**As a** household admin
**I want** an admin page listing installed plugins with enable/disable + per-plugin settings
**So that** I can configure plugins safely

**Acceptance Criteria:**
- [ ] `GET/POST /api/v1/plugins/:id/(enable|disable)`
- [ ] Plugin admin route lists each plugin with manifest data, status, "Enable"/"Disable" toggle, "Configure" button
- [ ] Configure modal renders fields from manifest `settingsFields` (text/password/select/toggle)
- [ ] Plugin settings saved encrypted in `plugin_settings` (passwords/keys)
- [ ] Risk badge: "Official" / "Community" / "Unofficial API"

**Dependencies:** STORY-16.2
**Estimate:** L
**Priority:** P1

---

#### STORY-16.4: Plugin settings repository (encrypted)
**As a** developer
**I want** `plugin_settings` per-plugin key/value with AES-256-GCM encryption
**So that** plugin secrets are stored safely

**Acceptance Criteria:**
- [ ] Migration creates `plugin_settings(plugin_id, key, value_encrypted, updated_at)` PK (plugin_id, key)
- [ ] Repo `get(pluginId, key)`, `set(pluginId, key, value)`, `delete`
- [ ] Encryption applied to all values; transparent on read

**Dependencies:** STORY-1.8, STORY-16.1
**Estimate:** S
**Priority:** P1

---

#### STORY-16.5: Capability registries (widgets, nav modes, sidebar filters, transport adapters, calendar systems)
**As a** developer
**I want** typed registries that plugins populate via the context
**So that** UI and services can iterate them

**Acceptance Criteria:**
- [ ] `widgetRegistry`, `navModeRegistry`, `sidebarFilterRegistry`, `transportAdapterRegistry`, `calendarSystemRegistry`
- [ ] Each is observable (subscribe-on-change)
- [ ] React hooks for each: `usePluginWidgets()`, `usePluginNavModes()`, etc.

**Dependencies:** STORY-16.2
**Estimate:** M
**Priority:** P1

---

#### STORY-16.6: Plugin error isolation + chaos test
**As a** household member
**I want** a broken plugin to be marked errored without crashing the app
**So that** plugins are safe to install

**Acceptance Criteria:**
- [ ] Any throw from a plugin call sets `pluginRegistry[id].status='error'` and logs
- [ ] Errored plugin's capabilities removed from registries
- [ ] Errored plugin shown in admin with "Disable" / "Restart" buttons
- [ ] Chaos test plugin in `plugins/_test-chaos/` randomly throws — CI verifies core stays up

**Dependencies:** STORY-16.2
**Estimate:** M
**Priority:** P1

---

#### STORY-16.7: Tesla plugin — manifest + auth + battery widget
**As a** Tesla owner
**I want** the Tesla plugin to show battery, range, and charge status on home
**So that** I see EV state at a glance

**Acceptance Criteria:**
- [ ] `plugins/tesla/manifest.json` declares `home_screen_widget`, `alert_source`, `tts_announcements`, `settings_panel`, `apiRisk: unofficial`
- [ ] Auth: OAuth flow via Tesla; tokens encrypted in `plugin_settings`
- [ ] Polling job (every 10 min when active, every 60 min when sleeping) calls `teslajs`/`tesla-api`
- [ ] Widget: battery arc, range, charging status, climate button
- [ ] Climate pre-conditioning button
- [ ] Tests with mocked Tesla API

**Technical Notes:**
- PRD §32.1; risk R-01

**Dependencies:** STORY-16.2, STORY-3.8
**Estimate:** XL
**Priority:** P2

---

#### STORY-16.8: Tesla plugin — alerts + TTS announcements
**As a** Tesla owner
**I want** "Not plugged in" and "Fully charged" alerts/announcements
**So that** I notice without checking

**Acceptance Criteria:**
- [ ] Alert when home + below threshold + not plugged in (configurable threshold)
- [ ] TTS "Your car is fully charged" once per charge event
- [ ] User-configurable: enable alerts, threshold, TTS toggle

**Dependencies:** STORY-16.7
**Estimate:** M
**Priority:** P2

---

#### STORY-16.9: Eufy plugin — cameras + doorbell + vacuum
**As a** Eufy owner
**I want** doorbell rings, motion alerts, vacuum status, and a live camera feed
**So that** I can monitor home from the dashboard

**Acceptance Criteria:**
- [ ] Plugin manifest: `home_screen_widget`, `alert_source`, `tts_announcements`, `nav_mode`, `apiRisk: unofficial`
- [ ] `eufy-security-client` integration; credentials encrypted
- [ ] Doorbell ring → push alert + auto-open full-screen feed (configurable)
- [ ] Camera live view modal (HLS/RTSP via background streaming proxy)
- [ ] Vacuum status: idle/cleaning/docked/needs-emptying with control buttons
- [ ] TTS "Someone at the front door" / "The vacuum needs emptying"

**Technical Notes:**
- PRD §32.2; risk R-02

**Dependencies:** STORY-16.2
**Estimate:** XL
**Priority:** P2

---

#### STORY-16.10: AI Assistant plugin — Gemini integration
**As a** household member
**I want** to ask "What's for dinner?" and get a spoken answer
**So that** the dashboard answers context-aware questions

**Acceptance Criteria:**
- [ ] Plugin manifest: `voice_handler`, `settings_panel`
- [ ] Gemini API key in plugin settings (encrypted)
- [ ] Voice handler receives unmatched transcripts; builds context prompt with today's data (calendar, meal plan, vehicles, shopping list, pet meds, finance summary, chores)
- [ ] Calls Gemini; speaks response via TTS
- [ ] App-controlling commands (add to shopping list, book car) implemented as a small action grammar
- [ ] Command history logged

**Technical Notes:**
- PRD §32.4; first-run dialog discloses transcript-only data sent

**Dependencies:** STORY-16.2, STORY-15.4
**Estimate:** XL
**Priority:** P2

---

#### STORY-16.11: Garden Pal plugin stub
**As a** Garden Pal user
**I want** Garden Pal events visible in Nestor calendar
**So that** garden tasks live alongside other family events

**Acceptance Criteria:**
- [ ] Plugin manifest: `calendar_source`, `sidebar_filter`, `home_screen_widget`, `alert_source`
- [ ] API key + base URL in settings
- [ ] Polling pulls Garden Pal events into `calendar_events` with source `plugin:garden-pal`
- [ ] Sidebar filter toggle
- [ ] Home widget shows next 3 garden tasks
- [ ] Implementation deferred to plugin developer; framework + stubs in MVP

**Technical Notes:**
- PRD §32.3 — full spec written separately; deliver stub here

**Dependencies:** STORY-16.2
**Estimate:** L
**Priority:** P3

---

#### STORY-16.12: Community plugin directory loader
**As a** household admin
**I want** to browse community plugins from a GitHub-hosted JSON index
**So that** discovery is easy

**Acceptance Criteria:**
- [ ] `app_settings.community_plugin_index_url` (default `https://raw.githubusercontent.com/.../plugins.json`)
- [ ] Admin UI tab "Browse" lists entries with name, description, author, repo, risk badge
- [ ] Install: clone repo into `/plugins/<id>` (sandboxed in subdir), restart server
- [ ] Warning dialog before install: "Community plugin — review code before enabling"
- [ ] Manual install instructions documented for offline installs

**Dependencies:** STORY-16.3
**Estimate:** L
**Priority:** P2

---

### EPIC-17: Admin & Settings

All admin panels — profiles, localisation, calendar, display, navigation, food, household, vehicles, finance, energy, voice, accessibility, plugins, system.

#### STORY-17.1: Settings shell + section navigation
**As a** household admin
**I want** a single Settings hub with a left rail of sections
**So that** all configuration lives in one place

**Acceptance Criteria:**
- [ ] Route `/admin` (admin PIN required)
- [ ] Left rail per PRD §30 sections (15 sections)
- [ ] Each section is a separate React route loaded lazily
- [ ] Search bar filtering sections by keyword
- [ ] Returns to home with "Done" button

**Dependencies:** STORY-2.5
**Estimate:** M
**Priority:** P1

---

#### STORY-17.2: Profiles admin panel
**As a** household admin
**I want** to add/edit/remove all profiles with permissions overrides
**So that** my household reflects reality

**Acceptance Criteria:**
- [ ] List + add/edit/delete
- [ ] Permission matrix UI showing checkboxes per permission key
- [ ] Per-profile accessibility (text size, simplified nav)
- [ ] Per-profile colour picker (12 options minimum)
- [ ] Avatar upload

**Dependencies:** STORY-17.1, STORY-2.4
**Estimate:** M
**Priority:** P1

---

#### STORY-17.3: Localisation admin panel
**As a** household admin
**I want** to set language, date/time format, currency, units, first day of week, number format
**So that** Nestor matches my locale

**Acceptance Criteria:**
- [ ] All settings from PRD §26 table
- [ ] Live preview of formatted date/time/number/currency in panel
- [ ] On save: i18n re-initialised, all `format.ts` helpers honour new locale
- [ ] RTL toggle visible but flagged "Phase 2"

**Dependencies:** STORY-17.1, STORY-18.1
**Estimate:** M
**Priority:** P1

---

#### STORY-17.4: Calendar admin panel
**As a** household admin
**I want** to add/remove CalDAV accounts, set sync frequency, configure WFH/shift schedule per adult
**So that** calendar setup is centralised

**Acceptance Criteria:**
- [ ] Account list with provider/status/last-sync; "Add account" picker (Google/Apple/Yahoo/custom)
- [ ] Sync interval slider (5/15/30/60 min)
- [ ] WFH/shift weekly grid per adult profile

**Dependencies:** STORY-17.1, STORY-4.5, STORY-4.6
**Estimate:** M
**Priority:** P1

---

#### STORY-17.5: Display & behaviour admin panel
**As a** household admin
**I want** to configure orientation, idle timeouts, night mode, screensaver
**So that** the screen behaves as I want

**Acceptance Criteria:**
- [ ] Orientation: auto/portrait/landscape (live preview)
- [ ] Idle dim timeout, sleep timeout
- [ ] Night mode: dark theme + auto-dim window
- [ ] Screensaver: photo folder picker, transition speed

**Dependencies:** STORY-17.1, STORY-2.6
**Estimate:** M
**Priority:** P1

---

#### STORY-17.6: Navigation admin panel
**As a** household admin
**I want** to hide, reorder, or rename nav modes
**So that** unused features disappear

**Acceptance Criteria:**
- [ ] Drag-to-reorder list
- [ ] Visibility toggle per mode
- [ ] Rename per mode (label only — not ID)
- [ ] Layout (single/double/scrollable/hamburger) selector

**Dependencies:** STORY-17.1, STORY-2.7
**Estimate:** M
**Priority:** P1

---

#### STORY-17.7: Voice & audio admin panel
**As a** household admin
**I want** to set hub name, retrain wake word, choose TTS voice/speed, set volume, configure quiet hours
**So that** voice fits my household

**Acceptance Criteria:**
- [ ] All settings from PRD §30 voice section
- [ ] Volume slider tests immediately
- [ ] Voice retraining link to wake-word flow
- [ ] Disabled state if voice hardware missing

**Dependencies:** STORY-17.1, STORY-15.x
**Estimate:** M
**Priority:** P2

---

#### STORY-17.8: Accessibility admin panel
**As a** household admin
**I want** global accessibility settings: text size, high contrast, colour-blind palette, reduced motion, simplified nav
**So that** Nestor adapts to needs

**Acceptance Criteria:**
- [ ] All settings global; per-profile overrides via Profiles panel
- [ ] Live preview area
- [ ] Each setting persisted in `app_settings`

**Dependencies:** STORY-17.1, STORY-18.4
**Estimate:** M
**Priority:** P1

---

#### STORY-17.9: System admin panel (version, update, backup, factory reset)
**As a** household admin
**I want** to see version, available updates, export/import JSON backup, factory reset
**So that** I can manage the system

**Acceptance Criteria:**
- [ ] Version + update-available badge
- [ ] "Update now" button (calls `/api/v1/system/update`)
- [ ] Export JSON backup (downloads file)
- [ ] Import JSON backup with confirmation
- [ ] Factory reset behind double confirmation; wipes DB, retains nothing
- [ ] Tailscale and Syncthing status panels (read-only — link to install docs)

**Dependencies:** STORY-17.1, STORY-19.6, STORY-20.x
**Estimate:** L
**Priority:** P1

---

#### STORY-17.10: Notification advance days configuration
**As a** household admin
**I want** to configure advance-days per reminder type
**So that** alerts fire when I want them

**Acceptance Criteria:**
- [ ] `app_settings.reminder_windows` JSON keyed by reminder type with default values
- [ ] UI: list of categories with day-input per
- [ ] All scheduler jobs read from this single source

**Dependencies:** STORY-17.1, STORY-14.3
**Estimate:** S
**Priority:** P1

---

### EPIC-18: Internationalisation & Accessibility

i18next plumbing, locale formatter helpers, English base translation, RTL preparation, accessibility primitives, axe-core hooks.

#### STORY-18.1: i18next bootstrap (client + server) + locale settings
**As a** developer
**I want** i18next initialised on both client and server with English base translation
**So that** every string can be externalised

**Acceptance Criteria:**
- [ ] `client/public/locales/en/translation.json` populated with namespaces per module
- [ ] `client/src/i18n.ts` bootstraps i18next + react-i18next, language from `app_settings.language`
- [ ] `server/src/i18n.ts` bootstraps i18next-fs-backend; used for alert messages and TTS strings
- [ ] `Trans` component preferred for HTML interpolation
- [ ] Language switching at runtime works without reload

**Technical Notes:**
- Architecture NFR-005

**Dependencies:** STORY-1.4, STORY-1.6
**Estimate:** M
**Priority:** P1

---

#### STORY-18.2: Locale-aware formatting helpers
**As a** developer
**I want** centralised `formatDate`, `formatTime`, `formatCurrency`, `formatNumber`, `formatTemperature`, `formatDistance`, `formatVolume` helpers
**So that** no module reimplements `toLocaleString`

**Acceptance Criteria:**
- [ ] `client/src/utils/format.ts` exports each helper, reads locale from store
- [ ] Tests in en-GB, fr-FR, en-US, ar-SA (RTL marker only) cover all helpers
- [ ] Lint rule banning `toLocaleDateString`/`toLocaleString` outside `format.ts`

**Dependencies:** STORY-18.1
**Estimate:** M
**Priority:** P1

---

#### STORY-18.3: i18n lint rule (no hardcoded strings in JSX)
**As a** developer
**I want** a lint rule that fails when JSX contains literal strings
**So that** new features can't accidentally bypass i18n

**Acceptance Criteria:**
- [ ] `eslint-plugin-i18next/no-literal-string` enabled with reasonable allow-list
- [ ] CI fails on violations
- [ ] Documentation in `CONTRIBUTING.md`

**Dependencies:** STORY-18.1
**Estimate:** S
**Priority:** P1

---

#### STORY-18.4: Accessibility tokens + per-profile text size
**As a** developer
**I want** the design system to honour `--base-font-size` per profile
**So that** grandparent profiles see larger text

**Acceptance Criteria:**
- [ ] CSS custom property `--base-font-size` set on `<html>` from active profile
- [ ] All text uses `rem` units only — no hardcoded `px` font sizes
- [ ] High-contrast and colour-blind palette CSS classes on `<html>`
- [ ] Reduced-motion swaps spring transitions for instant
- [ ] `<TouchTarget>` enforces 44×44 minimum

**Technical Notes:**
- Architecture NFR-006

**Dependencies:** STORY-2.5
**Estimate:** M
**Priority:** P1

---

#### STORY-18.5: Axe-core integration in Playwright
**As a** developer
**I want** every E2E test to assert no critical accessibility violations
**So that** WCAG 2.1 AA targets are protected

**Acceptance Criteria:**
- [ ] `@axe-core/playwright` integrated into the Playwright config
- [ ] Each E2E test calls `expect(await axe()).toHaveNoCriticalViolations()`
- [ ] Documented violations exempt list (with rationale) in `docs/a11y-exemptions.md`

**Dependencies:** STORY-20.4
**Estimate:** S
**Priority:** P1

---

#### STORY-18.6: RTL preparation (CSS logical properties everywhere)
**As a** future contributor
**I want** the codebase to use logical properties so RTL can be added later
**So that** Phase 2 RTL is feasible

**Acceptance Criteria:**
- [ ] No `margin-left`/`right`, `padding-left`/`right`, `text-align: left/right` in core code
- [ ] Tailwind `rtl:` variants enabled but unused for MVP
- [ ] Lint rule against physical CSS direction properties (in custom code, not Tailwind)

**Technical Notes:**
- PRD §26 RTL phase 2

**Dependencies:** STORY-2.5
**Estimate:** S
**Priority:** P1

---

#### STORY-18.7: Colour-blind safe palette toggle
**As a** colour-blind user
**I want** an alternative palette for profile colours
**So that** distinct colours remain distinguishable

**Acceptance Criteria:**
- [ ] Alternative 12-colour palette (Wong / Okabe-Ito accessible set)
- [ ] Toggle in Accessibility panel
- [ ] All places using profile colours use a CSS variable so swap is instant

**Dependencies:** STORY-18.4
**Estimate:** S
**Priority:** P2

---

#### STORY-18.8: Simplified navigation mode (per profile)
**As a** less-tech-comfortable user
**I want** a simpler nav with fewer modes and bigger buttons
**So that** I'm not overwhelmed

**Acceptance Criteria:**
- [ ] Profile flag `simplified_nav` collapses nav to: Home + Calendar + Board + Contacts + Settings (or admin-curated set)
- [ ] Larger button sizes (88×88 minimum)
- [ ] Reduced information density on home screen

**Dependencies:** STORY-2.7
**Estimate:** M
**Priority:** P2

---

#### STORY-18.9: French locale acceptance test
**As a** maintainer
**I want** the app to work end-to-end in French
**So that** locale plumbing is proven

**Acceptance Criteria:**
- [ ] `client/public/locales/fr/translation.json` with at least core/home/calendar/admin keys translated
- [ ] Playwright test runs core flow in French and asserts dates/numbers/currency formatted in fr-FR
- [ ] Documentation explains how to contribute additional language packs

**Dependencies:** STORY-18.1, STORY-18.2
**Estimate:** M
**Priority:** P2

---

### EPIC-19: Setup Wizard & Installation

Bash install script, systemd services, kiosk launcher, first-boot wizard, in-app updates.

#### STORY-19.1: Setup wizard React component (10-step shell)
**As a** new user
**I want** a guided 10-step wizard on first boot
**So that** I can set up Nestor without a manual

**Acceptance Criteria:**
- [ ] Full-screen `SetupWizard` rendered when `app_settings.setup_complete=false`
- [ ] Progress indicator (1/10)
- [ ] Steps: language → locale → profiles → calendars → display → orientation → voice → features → plugins → done
- [ ] Each step has Next / Skip; skipped steps marked ⚠️
- [ ] Re-accessible from Settings → Setup & Help

**Technical Notes:**
- PRD §29 setup wizard

**Dependencies:** STORY-2.6
**Estimate:** L
**Priority:** P1

---

#### STORY-19.2: Wizard step content — language, locale, profiles
**As a** new user
**I want** to set language, locale, and create my profiles in the first three steps
**So that** the rest of the wizard speaks my language

**Acceptance Criteria:**
- [ ] Step 1: language selector
- [ ] Step 2: timezone (auto-detected) + date format + currency + units + temperature
- [ ] Step 3: profile builder (add multiple, choose type, colour, avatar, PIN if required)
- [ ] Each step persists to `app_settings` / `profiles`

**Dependencies:** STORY-19.1, STORY-2.4, STORY-17.3
**Estimate:** L
**Priority:** P1

---

#### STORY-19.3: Wizard step content — calendars (QR OAuth)
**As a** new user
**I want** to scan a QR code with my phone to connect Google Calendar
**So that** I don't have to type a long URL

**Acceptance Criteria:**
- [ ] QR rendered for OAuth device flow
- [ ] Polling shows "waiting for confirmation" then "connected"
- [ ] Apple/Yahoo paths via the standard form
- [ ] Per-account: which profile owns which calendar

**Dependencies:** STORY-19.1, STORY-4.5, STORY-4.6
**Estimate:** M
**Priority:** P1

---

#### STORY-19.4: Wizard step content — display, orientation, voice, features, plugins
**As a** new user
**I want** to confirm orientation, optionally set up voice, choose nav modes, browse plugins
**So that** I finish setup with a configured Nestor

**Acceptance Criteria:**
- [ ] Display: brightness/idle/night mode/screensaver folder
- [ ] Orientation: live preview rotate prompt
- [ ] Voice: optional; record wake word samples (link to flow)
- [ ] Features: nav mode toggles
- [ ] Plugins: list official plugins with one-tap install

**Dependencies:** STORY-19.1, STORY-15.2, STORY-16.3
**Estimate:** L
**Priority:** P1

---

#### STORY-19.5: Single-line install script
**As a** user
**I want** `curl -fsSL https://get.nestor.app/install.sh | bash` to install everything
**So that** setup is one line

**Acceptance Criteria:**
- [ ] `install/install.sh` idempotent
- [ ] Installs: nvm + Node 20, SQLite, Chromium, Onboard, Piper, Whisper, OpenWakeWord, Python, ffmpeg
- [ ] Clones repo to `/opt/nestor`, builds, installs systemd services
- [ ] Detects USB audio; warns if absent
- [ ] Detects orientation; sets `app_settings.orientation`
- [ ] Launches kiosk on success
- [ ] Tested in CI against fresh Ubuntu 24 container

**Technical Notes:**
- Architecture NFR-007

**Dependencies:** STORY-19.6, STORY-19.7
**Estimate:** XL
**Priority:** P1

---

#### STORY-19.6: systemd service templates
**As a** developer
**I want** templated service files in `install/services/`
**So that** the install script can install them

**Acceptance Criteria:**
- [ ] `nestor-server.service` (Restart=always, WatchdogSec=30, env from `/etc/nestor.env`)
- [ ] `nestor-kiosk.service` depends on nestor-server, runs Chromium with kiosk flags
- [ ] `nestor-voice.service` (optional, requires nestor-server)
- [ ] `journalctl -u nestor-server -f` shows logs

**Dependencies:** none (parallelisable)
**Estimate:** M
**Priority:** P1

---

#### STORY-19.7: Chromium kiosk launcher
**As a** developer
**I want** a launcher script that starts Chromium with the right flags
**So that** the kiosk is locked down and gesture-clean

**Acceptance Criteria:**
- [ ] `install/scripts/start-kiosk.sh` runs Chromium with: `--kiosk`, `--noerrdialogs`, `--disable-pinch`, `--overscroll-history-navigation=0`, `--disable-translate`, `--app=http://localhost:3000`
- [ ] Hides cursor (`unclutter`)
- [ ] xdotool/onboard hooks for OS keyboard

**Dependencies:** STORY-19.6
**Estimate:** S
**Priority:** P1

---

#### STORY-19.8: In-app update mechanism
**As a** household admin
**I want** to update Nestor with one tap when an update is available
**So that** I don't need a terminal

**Acceptance Criteria:**
- [ ] Scheduler nightly polls GitHub Releases; sets `app_settings.update_available_version`
- [ ] Admin → System shows update badge
- [ ] `POST /api/v1/system/update`: download tarball, verify SHA256, extract to `~/.nestor/releases/v{new}`, run new migrations, symlink `current`, `systemctl restart nestor-server`
- [ ] Previous release retained for rollback
- [ ] `POST /api/v1/system/rollback` reverts symlink + restarts

**Dependencies:** STORY-19.6, STORY-1.11
**Estimate:** L
**Priority:** P1

---

#### STORY-19.9: JSON export / import + factory reset
**As a** household admin
**I want** to export all my data as JSON and re-import (or wipe) it
**So that** backup and migration are possible without command-line skills

**Acceptance Criteria:**
- [ ] `POST /api/v1/system/backup` streams a JSON download with all tables + photo manifest
- [ ] `POST /api/v1/system/restore` accepts an upload, validates schema version, replaces DB
- [ ] Factory reset deletes DB + uploads + restarts in wizard mode
- [ ] All actions PIN-protected and double-confirmed

**Dependencies:** STORY-1.5
**Estimate:** L
**Priority:** P1

---

### EPIC-20: Testing, Polish & Release

Test infrastructure, E2E flows, performance, network audit, documentation, release engineering.

#### STORY-20.1: Jest unit-test infrastructure
**As a** developer
**I want** Jest configured for both server and client with shared config
**So that** unit tests run consistently

**Acceptance Criteria:**
- [ ] `jest.config.ts` per package (server, client) extending shared base
- [ ] Server: ts-jest, in-memory SQLite via `@databases/sqlite-test`
- [ ] Client: jsdom + Testing Library
- [ ] Coverage thresholds: 80% on services + repositories

**Dependencies:** STORY-1.1
**Estimate:** S
**Priority:** P1

---

#### STORY-20.2: Supertest API integration test harness
**As a** developer
**I want** a test harness that boots Express against in-memory SQLite
**So that** I can write end-to-end API tests

**Acceptance Criteria:**
- [ ] `server/tests/helpers/app.ts` boots app with isolated DB
- [ ] Auth helpers: `asAdmin`, `asProfile(id)`
- [ ] Tests for at least one endpoint per major module already pass

**Dependencies:** STORY-20.1, STORY-1.4
**Estimate:** M
**Priority:** P1

---

#### STORY-20.3: React Testing Library smoke tests on key components
**As a** developer
**I want** unit tests on critical components (DayCarousel, AlertsStrip, ProfileSwitcher)
**So that** regressions are caught early

**Acceptance Criteria:**
- [ ] At least 1 RTL test per epic's main page
- [ ] `MockServiceWorker` mocks API for client tests
- [ ] All tests run via `npm test`

**Dependencies:** STORY-20.1
**Estimate:** M
**Priority:** P1

---

#### STORY-20.4: Playwright E2E test suite
**As a** maintainer
**I want** the 10 critical user flows covered by Playwright
**So that** releases are safe

**Acceptance Criteria:**
- [ ] Tests cover the 10 flows listed in architecture §"E2E flows":
  1. Setup wizard
  2. Profile switch with PIN
  3. Add event → carousel
  4. Recipe URL import → meal plan → shopping list
  5. Bin schedule → day cards
  6. Vehicle booking + conflict
  7. Chore complete → reward
  8. Plugin install (mock Tesla) → widget
  9. Dismiss alert → badge
  10. Voice command "Go to calendar" (mock STT)
- [ ] Runs in CI with Chromium in headless mode
- [ ] Each test calls axe-core (per STORY-18.5)

**Dependencies:** STORY-20.2, all MVP stories
**Estimate:** XL
**Priority:** P1

---

#### STORY-20.5: Lighthouse CI on home + calendar
**As a** maintainer
**I want** Lighthouse CI ensuring Performance > 90, Accessibility > 95
**So that** regressions in core metrics are caught

**Acceptance Criteria:**
- [ ] `lighthouse-ci` GitHub Action runs against built SPA
- [ ] Budgets defined; CI fails on regression
- [ ] Reports artifact uploaded

**Dependencies:** STORY-1.2
**Estimate:** S
**Priority:** P1

---

#### STORY-20.6: Network audit (no undisclosed outbound calls)
**As a** maintainer
**I want** a CI check that the codebase has no surprise outbound network calls
**So that** the local-first promise is enforced

**Acceptance Criteria:**
- [ ] Static scan of `axios`/`fetch`/`http` usages; allow-listed hosts (Open-Meteo, GitHub, CalDAV providers, plugin-declared)
- [ ] Documented allow-list reviewed during code review
- [ ] CI fails on new domain not in list

**Technical Notes:**
- Architecture NFR-001

**Dependencies:** STORY-1.2
**Estimate:** M
**Priority:** P1

---

#### STORY-20.7: Plugin chaos test in CI
**As a** maintainer
**I want** a chaos plugin in tests that randomly throws
**So that** isolation is proven on every PR

**Acceptance Criteria:**
- [ ] `plugins/_test-chaos/` plugin with rand throws in each capability
- [ ] Integration test boots app with chaos plugin enabled, hammers endpoints, asserts core stays responsive

**Technical Notes:**
- Architecture NFR-004

**Dependencies:** STORY-16.6
**Estimate:** M
**Priority:** P1

---

#### STORY-20.8: Release pipeline (tag → build → release tarball)
**As a** maintainer
**I want** a tag push to produce a release tarball + checksum + GitHub Release
**So that** the install script can fetch it

**Acceptance Criteria:**
- [ ] `release.yml` GitHub Actions workflow on `v*` tag
- [ ] Builds client + server, runs full test suite, creates tarball
- [ ] Generates SHA256
- [ ] Updates release notes from CHANGELOG
- [ ] Tags `latest` Docker image (community contribution stretch)

**Dependencies:** STORY-1.2, STORY-19.5
**Estimate:** M
**Priority:** P1

---

#### STORY-20.9: 30-day uptime soak test
**As a** maintainer
**I want** a 30-day soak run on reference hardware
**So that** NFR-002 is validated before MVP release

**Acceptance Criteria:**
- [ ] Reference NUC i3 device runs the build for 30 days
- [ ] Memory and CPU sampled hourly
- [ ] Crash count = 0 (or systemd auto-recovery only)
- [ ] Report attached to release notes

**Dependencies:** all MVP epics
**Estimate:** XS (calendar wait — actual effort small)
**Priority:** P1

---

#### STORY-20.10: README + hardware guide + plugin developer docs
**As a** new user/contributor
**I want** clear docs for hardware, install, plugin development, and contribution
**So that** I can get started

**Acceptance Criteria:**
- [ ] Top-level `README.md` with hero, features, hardware guide, install command, screenshots
- [ ] `docs/install.md`, `docs/hardware.md`, `docs/plugin-dev.md`, `docs/contributing.md`, `docs/transport-adapters.md`
- [ ] Plugin manifest schema documented with examples
- [ ] Translations contribution guide

**Dependencies:** none (parallel)
**Estimate:** L
**Priority:** P1

---

#### STORY-20.11: Release v1.0 (MVP cut)
**As a** maintainer
**I want** to cut v1.0
**So that** households can install Nestor

**Acceptance Criteria:**
- [ ] All P1 stories merged
- [ ] Soak test passed
- [ ] Install script tested on clean hardware
- [ ] Release notes published
- [ ] Versions: app 1.0.0, plugin API 1.0.0
- [ ] Announcement posted

**Dependencies:** all MVP stories
**Estimate:** S
**Priority:** P1

---

## 4. Sprint Schedule

> Velocity assumption: a single full-time developer averaging ~22 story-days per 2-week sprint (≈10 working days at 80% delivery efficiency, accommodating reviews, fixes, and unforeseen scope expansion). Multiply by team size if running multiple developers in parallel.

The schedule front-loads foundation, layers on the alert/scheduler/data plumbing as soon as needed, then sweeps each module module-by-module so the user-visible value lands progressively.

---

### Sprint 1 — Foundations (Weeks 1–2)
**Goal:** A booting Express server + React shell + DB + CI; no user-facing features yet, but everything else can rest on it.

| Story | Title | Est |
|---|---|---|
| 1.1 | Repository structure & tooling | S |
| 1.2 | GitHub repo & CI | S |
| 1.3 | SQLite + migration runner | M |
| 1.4 | Express bootstrap + logging + health | M |
| 1.5 | Repository pattern + app_settings | M |
| 1.6 | Vite + React + Tailwind bootstrap | M |
| 1.7 | TanStack Query + Zustand | M |
| 1.8 | AES-256-GCM crypto helper | M |
| 1.9 | Internal event bus | XS |
| 1.11 | Job scheduler base | M |
| 19.6 | systemd service templates | M |
| 20.1 | Jest harness | S |
| **Total** | | **22d** |

**Demo at sprint end:** Run `npm run dev`; React shell loads with placeholder; CI green; install scripts exist.

---

### Sprint 2 — Profiles, Shell, & Plumbing (Weeks 3–4)
**Goal:** Multiple profiles, switcher, navbar in both orientations, design system, WebSocket, alert engine skeleton.

| Story | Title | Est |
|---|---|---|
| 1.10 | WebSocket scaffold | M |
| 2.1 | Profiles schema + repo | M |
| 2.2 | Profile API + PIN | M |
| 2.3 | Auth/permission middleware | M |
| 2.4 | Permission defaults | S |
| 2.5 | Design system + primitives | L |
| 2.6 | App shell portrait/landscape | L |
| 2.7 | Navbar with mode buttons | M |
| 18.1 | i18next bootstrap | M |
| 14.1 | Alerts schema + repo | M |
| **Total** | | **23d** |

**Demo:** Add profiles, switch with PIN, see navbar in both orientations; English strings loaded via i18next.

---

### Sprint 3 — Calendar Core + Home Skeleton (Weeks 5–6)
**Goal:** A working calendar (local events first), the Home screen layout, weather, and the alerts strip wired up.

| Story | Title | Est |
|---|---|---|
| 2.8 | Profile switcher avatar strip | L |
| 2.9 | Sidebar/top filter panel | M |
| 4.1 | Calendar schema + repo | M |
| 4.2 | Local event CRUD | M |
| 4.3 | Recurring event expansion | L |
| 4.10 | Event detail/quick-add modal | L |
| 14.2 | Alert engine service | M |
| 14.4 | Alerts API + WS | S |
| 18.2 | Format helpers | M |
| 18.4 | Accessibility tokens + per-profile text size | M |
| **Total** | | **22d** |

**Demo:** Create local events; recurring events expand; alert engine accepts pushes and broadcasts.

---

### Sprint 4 — Home Carousel + Calendar Views + CalDAV Sync (Weeks 7–8)
**Goal:** The home screen feels alive; CalDAV pulls Google/Apple events; week and month views work.

| Story | Title | Est |
|---|---|---|
| 3.1 | Open-Meteo weather service | M |
| 3.2 | Home route layout | M |
| 3.3 | Day carousel | L |
| 3.5 | Mini weather widget | S |
| 3.6 | Alerts strip on home | M |
| 4.4 | Calendar service skeleton | M |
| 4.5 | Google CalDAV + QR OAuth | XL |
| 4.6 | Apple/Yahoo CalDAV | M |
| 4.7 | Day view | L |
| **Total** | | **23.5d** |

**Demo:** Connect Google Calendar via QR on phone; events appear on carousel and day view.

---

### Sprint 5 — Calendar Polish + House Foundation + Vehicles (Weeks 9–10)
**Goal:** Calendar finished (week + month views); House (bin schedule + maintenance + meter readings) and Vehicles (profiles + bookings + reminders) live.

| Story | Title | Est |
|---|---|---|
| 4.8 | Week view | L |
| 4.9 | Month view | M |
| 8.1 | House schema | M |
| 8.2 | Bin alternating cycle calc | M |
| 8.3 | Bin CRUD UI + day-card icons | L |
| 8.4 | Bin alerts | S |
| 14.3 | Reminder evaluator job | M |
| 14.6 | Severity colour + nav badges | S |
| 6.1 | Vehicles schema | M |
| 6.2 | Vehicles CRUD UI | M |
| **Total** | | **22d** |

**Demo:** Bin icons appear on home day cards; bin tomorrow alert fires; vehicles list and edit.

---

### Sprint 6 — Vehicles, Food, Family Foundations (Weeks 11–12)
**Goal:** Vehicles end-to-end; meal planner + recipes + shopping list; family chores foundation.

| Story | Title | Est |
|---|---|---|
| 6.3 | Vehicle booking endpoints | M |
| 6.4 | Vehicle booking UI | M |
| 6.6 | Vehicle reminders | M |
| 5.1 | Recipes schema | M |
| 5.2 | Recipe API + photo upload | M |
| 5.3 | Recipe URL import | L |
| 5.4 | Meal planner grid | L |
| 5.5 | Recipe library list/detail | L |
| 7.1 | Chores schema | M |
| **Total** | | **22d** |

**Demo:** Book the car (conflict warning); paste recipe URL → ingredients extracted; week meal plan filled.

---

### Sprint 7 — Family + Pets + Contacts + House Polish (Weeks 13–14)
**Goal:** Children chores/rewards, kid-friendly view, pets module, contacts, finance core.

| Story | Title | Est |
|---|---|---|
| 5.6 | Add ingredients to shopping list | M |
| 5.7 | Shopping list UI | L |
| 7.2 | Chore CRUD + complete | M |
| 7.3 | Family hub | M |
| 7.4 | Child profile view | L |
| 7.5 | Reward star grid | M |
| 7.6 | Health log endpoints + UI | L |
| 8.5 | Subscription tracker | M |
| 8.6 | Home maintenance | M |
| 8.7 | Meter readings | M |
| 12.1 | Contacts schema + endpoints | S |
| 12.2 | Contacts list UI | M |
| 10.1 | Pets schema | S |
| 10.2 | Pets CRUD UI | M |
| 10.3 | Pet health log + reminders | M |
| 10.4 | Vet appointments → calendar | S |
| **Total** | | **27d** *(slight overflow — slip 7.6 if needed)*|

**Demo:** Child profile view with chore tile; pet vaccination reminder fires; subscriptions list with monthly total.

---

### Sprint 8 — Finance + EV + Board + Contacts + MVP Cut (Weeks 15–16)
**Goal:** All remaining MVP modules + setup wizard + install + alerts polish + admin panels + first release.

| Story | Title | Est |
|---|---|---|
| 9.1 | Finance schema | S |
| 9.2 | Agreements CRUD | M |
| 9.3 | Monthly summary | M |
| 9.4 | Savings goals | M |
| 9.5 | End-date alerts | M |
| 13.1 | EV charging schema | S |
| 13.2 | Charging log UI | M |
| 13.3 | Energy overview | M |
| 13.4 | Configurable rates | S |
| 11.1 | Board schema | S |
| 11.2 | Family message board | M |
| 11.4 | Countdown timers | S |
| 12.4 | Cross-linking contacts | S |
| 14.7 | Plugin alerts | S |
| 17.1 | Settings shell | M |
| 17.2 | Profiles admin | M |
| 17.3 | Localisation admin | M |
| 17.4 | Calendar admin | M |
| 17.5 | Display admin | M |
| 17.6 | Navigation admin | M |
| 17.8 | Accessibility admin | M |
| 17.9 | System admin (backup/update/reset) | L |
| 17.10 | Reminder windows | S |
| 19.1 | Wizard shell | L |
| 19.2 | Wizard steps 1-3 | L |
| 19.3 | Wizard calendars + QR | M |
| 19.5 | Install script | XL |
| 19.7 | Kiosk launcher | S |
| 19.8 | Update mechanism | L |
| 19.9 | Backup/restore + factory reset | L |
| 16.1 | Plugin manifest + loader | M |
| 16.4 | Plugin settings repo | S |
| 18.3 | i18n lint rule | S |
| 18.6 | RTL preparation | S |
| 20.2 | Supertest harness | M |
| 20.3 | RTL smoke tests | M |
| 20.4 | Playwright E2E suite | XL |
| 20.5 | Lighthouse CI | S |
| 20.6 | Network audit | M |
| 20.8 | Release pipeline | M |
| 20.10 | Docs / README | L |
| 20.11 | v1.0 release | S |
| 6.5 | Fuel log MPG | M |
| 8.10 | Checklists foundation | L |
| 14.5 | Audio chime | S |
| 3.4 | Day card markers (WFH/school/etc.) | L |
| 3.7 | Journey time widget (stub) | L |
| 3.8 | Plugin widget strip | M |
| 8.9 | Adult chores rota | S |
| 19.4 | Wizard remaining steps | L |
| 19.6 (done) | — | — |
| **Total** | | This sprint is intentionally heavy and is realistically split into Sprint 8 + Sprint 9. See note. |

> **Note:** Sprint 8's MVP-cut workload exceeds a single 22-day sprint. In practice, MVP completion is achieved over **Sprints 8 and 9** combined. The split below prioritises the user-visible "v1.0" feel by sprint 9 end.

#### Sprint 8 (revised) — Finance, EV, Board, Settings shell (Weeks 15–16)
| Story | Title | Est |
|---|---|---|
| 9.1, 9.2, 9.3, 9.4, 9.5 | Finance core | 11 |
| 13.1, 13.2, 13.3, 13.4 | EV core | 7 |
| 11.1, 11.2, 11.4 | Board core | 5 |
| 17.1, 17.2, 17.3 | Settings shell + profiles + locale | 6 |
| **Total** | | **22d** |

#### Sprint 9 — MVP cut: setup wizard, install, polish, release (Weeks 17–18)
| Story | Title | Est |
|---|---|---|
| 17.4–17.10 | Remaining admin panels | 14 |
| 19.1–19.9 | Wizard + install script + updates + backup + kiosk + services | 28 (split with Sprint 10 if necessary) |
| 16.1, 16.4 | Plugin loader + settings (no plugins yet enabled) | 4 |
| 14.5 | Audio chime | 1 |
| 14.7 | Plugin alerts | 1 |
| 3.4, 3.7, 3.8 | Day card markers + journey + plugin strip | 9 |
| 6.5, 8.9, 8.10 | Fuel log + adult chores + checklists | 6 |
| 12.4 | Contact cross-link | 1 |
| 18.3, 18.6 | i18n lint + RTL prep | 2 |
| 20.2–20.6, 20.8, 20.10, 20.11 | Tests + CI + release | 14 |
| **Total** | | Significantly over a single 22-day sprint — realistically 2 sprints (9–10) |

> **Recommendation:** Run Sprints 9 and 10 with a sprint goal of *MVP cut*, accepting the install/wizard/test work spans both. Schedule below assumes that.

---

### Sprint 10 — MVP cut completion (Weeks 19–20)
**Goal:** Final test pass, install script hardened, documentation, soak begins.

| Story | Title | Est |
|---|---|---|
| Remaining wizard / install / update stories from Sprint 9 carry-over | | 12 |
| 20.4 | Playwright E2E full suite | 5 |
| 20.5, 20.6, 20.8, 20.10, 20.11 | CI/Docs/Release | 5 |
| 20.9 | 30-day uptime soak (begins; runs in background through P2) | 0.5 |
| **Total** | | ~22.5d |

**Demo / Release:** v1.0 tagged. Soak running on reference hardware.

---

### Sprint 11 — Plugin System + Tesla Plugin (Weeks 21–22)
**Phase 2 begins.**

| Story | Title | Est |
|---|---|---|
| 16.2 | NestorPluginContext + manager runtime | XL |
| 16.3 | Plugin admin page | L |
| 16.5 | Capability registries | M |
| 16.6 | Error isolation + chaos test | M |
| 16.7 | Tesla plugin (manifest + battery widget) | XL |
| 16.8 | Tesla plugin alerts/TTS | M |
| 20.7 | Plugin chaos in CI | M |
| **Total** | | **22d** |

**Demo:** Install Tesla plugin, see battery on home, "fully charged" announcement.

---

### Sprint 12 — Eufy + AI Assistant Plugin + Voice Pipeline foundations (Weeks 23–24)

| Story | Title | Est |
|---|---|---|
| 16.9 | Eufy plugin | XL |
| 15.1 | Voice process bootstrap | M |
| 15.5 | Piper TTS + queue | M |
| 15.7 | Quiet hours | S |
| 15.9 | Voice fallback | XS |
| 16.10 | AI Assistant plugin (Gemini) | XL |
| **Total** | | **22d** |

**Demo:** Eufy doorbell ring + camera modal; "Tell me a joke" via voice (mocked STT for now).

---

### Sprint 13 — Wake-word + Whisper STT + Voice command router (Weeks 25–26)

| Story | Title | Est |
|---|---|---|
| 15.2 | Custom wake-word training | XL |
| 15.3 | Whisper STT | L |
| 15.4 | Voice command router | M |
| 15.6 | Listening indicator | S |
| 15.8 | Voice command history | S |
| 17.7 | Voice/audio admin panel | M |
| 7.7 | Baby tracking — feeds/nappies/sleep | L |
| 7.8 | Growth log | L |
| **Total** | | **22d** |

**Demo:** Train wake word, "Hey Nestor, go to calendar", baby tracking working.

---

### Sprint 14 — Polish, P2 catch-up, Stretch (Weeks 27–28)

| Story | Title | Est |
|---|---|---|
| 7.9 | Vaccination reminders | M |
| 7.10 | Children's routines | M |
| 7.11 | Mood log | S |
| 7.12 | Allowance tracker | S |
| 4.11 | Term dates iCal | M |
| 4.12 | Custody schedule | S |
| 6.7 | Transport adapter interface | M |
| 6.8 | Mileage log | S |
| 8.8 | Budget tracker | M |
| 9.6 | Regular commitments | M |
| 9.7 | Debt paydown visualiser | S |
| 10.5 | Pet weight log | S |
| 10.6 | Pet documents | S |
| 11.3 | Whiteboard | L |
| 11.5 | General lists | S |
| 11.6 | Guest visit checklist | M |
| 12.3 | Tap-to-dial | S |
| 13.5 | EV plug-in reminder | S |
| 16.11 | Garden Pal plugin stub | L |
| 16.12 | Community plugin directory | L |
| 18.7 | Colour-blind palette | S |
| 18.8 | Simplified nav | M |
| 18.9 | French locale acceptance | M |
| 5.8 | Pantry placeholder | XS |
| 5.9 | Servings calculator | S |
| 5.10 | Meal history | S |
| 2.10 | Kiosk-child mode | M |
| 2.11 | Guest lock screen | M |
| 2.12 | Idle dim/sleep | M |
| 3.9 | Coming Up widget | M |
| 18.5 | Axe-core in Playwright | S |
| **Total** | | Multi-sprint (≈30+ days) — runs across Sprints 14–15 in practice |

> **Note:** Sprint 14's stretch backlog cleanly extends into a Sprint 15 if the team continues. For MVP planning purposes Sprints 1–10 are the committed schedule; everything from Sprint 11 onwards is Phase 2 and stretch where scope can be flexed.

---

## 5. MVP (Phase 1) Story List

These 112 P1 stories constitute Nestor v1.0 — the smallest functional Nestor that a household can install, configure, and live with daily.

**Foundations:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11

**App Shell & Profiles:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9

**Home Screen:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8

**Calendar:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10

**Food:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7

**Vehicles:** 6.1, 6.2, 6.3, 6.4, 6.6

**Family:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6

**House:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9, 8.10

**Finance:** 9.1, 9.2, 9.3, 9.4, 9.5

**Pets:** 10.1, 10.2, 10.3, 10.4

**Board:** 11.1, 11.2, 11.4

**Contacts:** 12.1, 12.2, 12.4

**EV & Energy:** 13.1, 13.2, 13.3, 13.4

**Alerts:** 14.1, 14.2, 14.3, 14.4, 14.6, 14.7

**Plugin System (foundation only — official plugins arrive in Phase 2):** 16.1, 16.4

**Admin & Settings:** 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.8, 17.9, 17.10

**i18n & Accessibility:** 18.1, 18.2, 18.3, 18.4, 18.6

**Setup & Install:** 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9

**Testing & Release:** 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.8, 20.9, 20.10, 20.11

**Total: ~190 story-days, fits Sprints 1–10 (20 weeks) at single-developer velocity.**

---

## 6. Dependency Graph (Critical Path)

The sequencing below highlights the load-bearing path. Stories not on this path can flex without affecting MVP delivery.

```
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7  (Foundations)
                ↓
            1.8 (crypto), 1.9 (event bus), 1.10 (WS), 1.11 (scheduler)
                ↓
            2.1 (profiles) → 2.2 (API) → 2.3 (middleware) → 2.4 (defaults)
                ↓                              ↓
            2.5 (design) → 2.6 (shell) → 2.7 (navbar) → 2.8 (switcher) → 2.9 (filters)
                ↓
            14.1 → 14.2 (alert engine) → 14.3 (reminders) → 14.4 (API/WS) → 14.6 (badges)
                ↓
            18.1 (i18next) → 18.2 (formatters) → 18.4 (a11y tokens)
                ↓
            ─────── Modules (parallelisable from here) ───────
                ↓
            Calendar:  4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9 → 4.10
            Home:      3.1, 3.2 → 3.3 → 3.4 (depends on 4.4, 6.4, 8.3, 10.3) → 3.5, 3.6, 3.7, 3.8
            Food:      5.1 → 5.2 → 5.3, 5.4, 5.5 → 5.6, 5.7
            Vehicles:  6.1 → 6.2, 6.3 → 6.4 → 6.6
            Family:    7.1 → 7.2 → 7.3 → 7.4 → 7.5; 7.6 standalone
            House:     8.1 → 8.2, 8.5, 8.6, 8.7, 8.9 → 8.3 → 8.4; 8.10 standalone
            Finance:   9.1 → 9.2 → 9.3 → 9.4, 9.5
            Pets:      10.1 → 10.2 → 10.3 → 10.4
            Board:     11.1 → 11.2, 11.4
            Contacts:  12.1 → 12.2 → 12.4
            EV:        13.1 → 13.2 → 13.3, 13.4
                ↓
            ──── Plugin platform (P2, blocks plugins) ────
            16.1 → 16.4 → 16.2 → 16.3, 16.5, 16.6 → 16.7 → 16.8 → 16.9, 16.10, 16.11, 16.12
                ↓
            ──── Voice (P2) ────
            15.1 → 15.5 → 15.2 → 15.3 → 15.4 → 15.6, 15.7, 15.8, 15.9
                ↓
            ──── Setup, Install, Release ────
            19.6 → 19.5 (install script needs services)
            19.1 → 19.2, 19.3, 19.4 → All wizard steps depend on the modules they configure
            19.8 (updates) needs 19.6 + 1.11
            17.x (admin panels) depend on each module's API
            20.4 (E2E) needs all MVP modules
            20.11 (release) needs 20.4 + 20.6 + 20.9
```

**The longest single chain on the critical path:** 1.1 → 1.4 → 1.5 → 1.6 → 2.5 → 2.6 → 2.7 → 4.1 → 4.2 → 4.3 → 4.5 → 4.7 → 4.8 → 19.5 → 20.11. This cannot complete in fewer than ~10 working sprints at single-developer velocity, hence the 20-week MVP target.

---

## 7. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | **Whisper STT too slow on Pi 5 to feel responsive** — voice replies feel laggy and users disable | Medium | High (degrades headline feature) | Default to `tiny` model on Pi; `base` on NUC; allow size override in admin; document expected latency; voice is optional, app fully usable touch-only (15.3, 15.9) |
| R-02 | **Tesla unofficial API breaks on a Tesla firmware update** — plugin stops working | Medium | Medium (single plugin) | `apiRisk: unofficial` documented; plugin versioned independently; community-maintained; Tesla plugin is opt-in (16.7) |
| R-03 | **Eufy `eufy-security-client` becomes unmaintained** — camera/doorbell stops working | Medium | Medium | Same approach as R-02; clear "Unofficial API" badge in admin; community can fork (16.9) |
| R-04 | **CalDAV OAuth flow on touchscreen is brittle** — users can't connect Google Calendar | Medium | High (calendar is core) | QR-code device flow tested extensively; fallback to manual URL/code paste; integration tests with mocked providers (4.5, 19.3) |
| R-05 | **Recipe URL scraping fails on most popular sites** (no Schema.org JSON-LD or anti-scrape) | High | Medium | Fallback to manual entry pre-filled with title/photo; document "self-hosters responsible for source ToS"; add user-agent and rate-limit in fetch (5.3) |
| R-06 | **SQLite corruption from unexpected power loss** on Pi without UPS | Low | High (data loss) | WAL mode (mitigates substantially); document UPS recommendation in hardware guide; auto-backup option (1.3, 19.9, 20.10) |
| R-07 | **Plugin sandboxing leaks (a malicious plugin reads core data)** — single-process model means no hard isolation | Medium | High | Manual review of community plugins before listing; `NestorPluginContext` is the only API exposed; community vs. official badge; admin must enable each plugin (16.2, 16.6, 16.12) |
| R-08 | **i18n coverage drops as new features ship quickly** — hardcoded English creeps in | Medium | Medium | `eslint-plugin-i18next/no-literal-string` enforced in CI from day one; PR template includes i18n checklist (18.3) |
| R-09 | **Day-card aggregation endpoint becomes a performance hotspot** — many module reads on every home render | Medium | Medium | In-memory caching with module-driven invalidation; benchmark on Pi 5 with 5-year data; Lighthouse CI catches regressions (3.4, 20.5) |
| R-10 | **Install script fails on a fresh Ubuntu 24 variant** (different kernel, missing apt packages, audio card not detected) — first-time users blocked at the door | High | Critical (kills onboarding) | CI tests against fresh Ubuntu 24 Docker each release; idempotent script with helpful error messages; hardware guide lists tested combinations; Discord/forum support channel (19.5, 20.10) |

---

## 8. Notes & Conventions

**Story file workflow.** As the project enters implementation, each story above is to be expanded into a `docs/stories/STORY-{n}.md` file via the `bmad:create-story` skill at the start of its sprint. The dev agent (`bmad:dev-story`) updates the file with progress, code references, and review notes as work proceeds.

**Definition of Done (every story):**
- [ ] Code merged to `main` via PR with at least one review
- [ ] Unit tests passing (≥80% coverage on services/repos changed)
- [ ] Integration tests passing for new endpoints
- [ ] No new lint/typecheck/i18n/accessibility violations
- [ ] User-facing strings externalised to i18next
- [ ] Admin/permission gates in place where applicable
- [ ] CHANGELOG entry under "Unreleased"
- [ ] Story file updated with status `done`

**Definition of Ready (before starting a story):**
- [ ] Dependencies completed (or a stub agreed)
- [ ] Acceptance criteria reviewed and unambiguous
- [ ] Designs available where relevant
- [ ] Any open questions answered or noted as assumptions

**Sprint cadence:**
- Sprint planning at start of sprint (review backlog, commit to sprint goal)
- Daily progress updates in story files
- Sprint review at end with demo of working software
- Retrospective + backlog refinement before next sprint

---

*End of sprint plan. Total: 178 stories · 312.5 story-days · 14 sprints planned · 112 stories in MVP (Sprints 1–10).*

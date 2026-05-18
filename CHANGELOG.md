# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] — 2026-05-18

Nestor v1.0.0 — first stable release.

### Added

- **Foundation** (Epic 1): Monorepo scaffold, TypeScript, ESLint/Prettier/Husky, CI pipeline, SQLite with migrations, Express server, React 19/Vite 8/Tailwind v4 client, TanStack Query, Zustand, WebSocket, job scheduler.
- **Profiles** (Epic 2): Profile types (admin/child/teen/guest/toddler/baby/grandparent), PIN authentication with bcrypt, permission matrix, design system tokens, app shell portrait/landscape layout, bottom navbar/side rail, profile switcher, filter panel, kiosk-child mode, guest overlay.
- **Home** (Epic 3): Open-Meteo weather service with 7-day cache, home route with day carousel, coming-up widget, day-summary badge strip.
- **Calendar** (Epic 4): CalDAV schema, local event CRUD, recurring event expansion (ical.js), Google Calendar OAuth2 device-code flow, Apple/Yahoo CalDAV adapters, day/week/month views, event detail modal, term dates iCal subscriptions, custody schedule.
- **Food** (Epic 5): Recipe library with photo upload, URL import (Schema.org JSON-LD scraper), meal planner 7-day grid, shopping list.
- **Vehicles** (Epic 6): Vehicle/journey/fuel-log/booking management, business mileage export (PDF), conflict detection.
- **Family** (Epic 7): Chores, rewards, health logs, baby tracking, growth chart (WHO percentiles), NHS vaccination schedule, routines, mood log, allowance tracker.
- **House** (Epic 8): Bin schedules with UK bank-holiday shift, subscriptions, home maintenance, meter readings, budget, checklists.
- **Finance** (Epic 9): Agreements (PCP/mortgage), savings goals, regular commitments, debt paydown visualiser, end-date alerts.
- **Pets** (Epic 10): Pet profiles, health logs, vet visit calendar integration, photo/document upload, weight chart.
- **Board** (Epic 11): Message board (sticky notes + real-time WS), HTML5 whiteboard, countdowns, guest checklists.
- **Contacts** (Epic 12): Contact cards with category filter, pet/vehicle linking, emergency contact filter.
- **EV / Octopus Energy** (Epic 13): Octopus tariff sync, consumption charts, Tesla plugin (community).
- **Alerts** (Epic 14): Alert system, audio chime (Web Audio API), per-module toggle.
- **Voice Pipeline** (Epic 15): Whisper STT, Piper TTS, OpenWakeWord, USB audio detection, TTS queue, voice command log, mic indicator.
- **Plugins** (Epic 16): Plugin manifest loader, PluginManager with error isolation, home-screen widgets, community plugin index, chaos test plugin.
- **Admin & Settings** (Epic 17): Admin panel with 10 sections (Profiles, Locale, Calendar, Display, Navigation, Voice, Accessibility, System, Notifications, Audio).
- **Internationalisation & Accessibility** (Epic 18): i18next, locale-aware format helpers, high-contrast/colour-blind CSS palettes, simplified nav, RTL prep, French translations.
- **Setup Wizard & Installation** (Epic 19): 10-step setup wizard, backup/restore/factory-reset, install script (Ubuntu 22+ idempotent), systemd services, kiosk scripts, display rotation.
- **Testing & Release** (Epic 20): Jest coverage thresholds, Vitest client tests, MSW API mocking, centralised test helpers, Playwright E2E (10 flows with axe-core a11y), Lighthouse CI, network audit CI, plugin chaos integration test, release pipeline, soak monitor, comprehensive documentation.

### Repository structure, tooling, and monorepo configuration (STORY-1.1)

- GitHub Actions CI pipeline with typecheck, lint, prettier, and test gates (STORY-1.2)
- Dependabot config for weekly npm and github-actions updates (STORY-1.2)
- Issue templates for bug reports, feature requests, and plugin proposals (STORY-1.2)
- Pull request template with tests/i18n/docs/CHANGELOG checklist (STORY-1.2)

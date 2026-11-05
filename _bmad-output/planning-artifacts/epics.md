# Nestor — Epics and Stories

Generated from docs/sprint-plan-nestor-2026-05-08.md (epics 1-20) and docs/stories/EPIC-21..31 files.
Detailed story text lives in those sources and in docs/stories/. Epic 20 here is "Testing, Polish & Release";
docs/stories/EPIC-20-osk.md is a separate, unnumbered OSK epic that collides with it and is excluded.

## Epic 1: Project Foundation & Dev Environment

### Story 1.1: Initialise repository structure and tooling

### Story 1.2: GitHub repository and CI pipeline

### Story 1.3: SQLite database wrapper and migration runner

### Story 1.4: Express server bootstrap with structured logging

### Story 1.5: Repository pattern base + app_settings repository

### Story 1.6: Vite + React + Tailwind frontend bootstrap

### Story 1.7: TanStack Query + Zustand setup

### Story 1.8: AES-256-GCM encryption helper for credentials at rest

### Story 1.9: Internal event bus

### Story 1.10: WebSocket server scaffold

### Story 1.11: Job scheduler base

## Epic 2: App Shell, Navigation & Profile System

### Story 2.1: Profiles schema and repository

### Story 2.2: Profile API endpoints with rate-limited PIN verification

### Story 2.3: Profile and admin-PIN middleware

### Story 2.4: Permission matrix defaults per profile type

### Story 2.5: Design system tokens and core primitives

### Story 2.6: App shell with portrait/landscape layout

### Story 2.7: Bottom navbar / side rail with mode buttons

### Story 2.8: Profile context + profile switcher avatar strip

### Story 2.9: Sidebar filter panel (portrait) / top filter strip (landscape)

### Story 2.10: Kiosk-child mode

### Story 2.11: Guest lock-screen overlay

### Story 2.12: Idle timer, screen dim and DPMS sleep

## Epic 3: Home Screen & Day Carousel

### Story 3.1: Open-Meteo weather service + cache

### Story 3.2: Home route layout

### Story 3.3: Day carousel — read-only render

### Story 3.4: Day card details — WFH / school drop / vehicle / pet markers

### Story 3.5: Mini weather widget on home header

### Story 3.6: Alerts strip on home

### Story 3.7: Journey time widget

### Story 3.8: Plugin widget strip on home

### Story 3.9: "Coming Up" widget

## Epic 4: Calendar Module

### Story 4.1: Calendar accounts and events schema

### Story 4.2: Local event CRUD endpoints

### Story 4.3: Recurring event expansion via ical.js

### Story 4.4: Calendar service module skeleton + sync interface

### Story 4.5: Google Calendar CalDAV adapter with OAuth2 + QR pairing

### Story 4.6: Apple iCloud + Yahoo CalDAV adapters

### Story 4.7: Calendar — Day view

### Story 4.8: Calendar — Week view

### Story 4.9: Calendar — Month view

### Story 4.10: Event detail modal + quick-add modal

### Story 4.11: Term dates iCal subscription

### Story 4.12: Custody schedule entry type

## Epic 5: Food / Meal Planner Module

### Story 5.1: Recipes and meal_plan schema + repos

### Story 5.2: Recipe API endpoints + photo upload

### Story 5.3: Recipe URL import via Schema.org JSON-LD

### Story 5.4: Meal planner 7-day grid

### Story 5.5: Recipe library list and detail views

### Story 5.6: Add recipe ingredients to shopping list

### Story 5.7: Shopping list module

### Story 5.8: Pantry tab placeholder

### Story 5.9: Servings calculator + portion-for-one mode

### Story 5.10: Meal plan history and rotation suggestions

## Epic 6: Vehicles & Travel Module

### Story 6.1: Vehicles + bookings + fuel logs schema

### Story 6.2: Vehicles CRUD UI

### Story 6.3: Vehicle booking endpoints

### Story 6.4: Vehicle booking UI

### Story 6.5: Fuel log + MPG tracking

### Story 6.6: Vehicle reminders (MOT, tax, insurance, service)

### Story 6.7: Transport adapter interface + UK National Rail stub

### Story 6.8: Mileage log for business travel (freelancer)

## Epic 7: Family Module — Children & Health

### Story 7.1: Chores + completions + reward redemptions schema

### Story 7.2: Chore CRUD endpoints + complete endpoint

### Story 7.3: Family hub page (admin view)

### Story 7.4: Child profile view (kid-friendly)

### Story 7.5: Reward star grid + streak tracking

### Story 7.6: Health log endpoints + UI (general)

### Story 7.7: Baby tracking — feeds, nappies, sleep

### Story 7.8: Growth log + percentile chart

### Story 7.9: NHS / region vaccination reminders

### Story 7.10: Children's routines (morning/bedtime)

### Story 7.11: Mood / wellbeing log (optional)

### Story 7.12: Allowance/points-to-money tracker (teen)

## Epic 8: House Module

### Story 8.1: House schema (bin_schedules, subscriptions, home_maintenance, meter_readings, budgets)

### Story 8.2: Bin schedule alternating-cycle calculator

### Story 8.3: Bin schedule CRUD UI + day-card icons

### Story 8.4: Bin day alerts

### Story 8.5: Subscription tracker

### Story 8.6: Home maintenance log

### Story 8.7: Meter readings log + chart

### Story 8.8: Budget tracker

### Story 8.9: Household chores rota (adults)

### Story 8.10: Checklists system foundation

## Epic 9: Finance Module

### Story 9.1: Finance schema + repositories

### Story 9.2: Finance agreements CRUD

### Story 9.3: Monthly commitments summary

### Story 9.4: Savings goals

### Story 9.5: End-date alerts (mortgage, agreements, insurance)

### Story 9.6: Regular commitments + benefits/income reminders

### Story 9.7: Debt paydown visualiser

## Epic 10: Pets Module

### Story 10.1: Pets schema + repositories

### Story 10.2: Pets CRUD UI

### Story 10.3: Pet health log + vaccination/flea/worming reminders

### Story 10.4: Vet appointments → calendar event with pet filter

### Story 10.5: Pet weight log + chart

### Story 10.6: Pet documents upload

## Epic 11: Board Module

### Story 11.1: Board schema (messages, countdowns, whiteboard snapshots)

### Story 11.2: Family message board UI

### Story 11.3: Whiteboard freehand drawing

### Story 11.4: Countdown timers

### Story 11.5: General lists

### Story 11.6: Guest visit checklist

## Epic 12: Contacts Module

### Story 12.1: Contacts schema + CRUD endpoints

### Story 12.2: Contacts list + categories UI

### Story 12.3: Tap-to-dial via tel: + audio hardware check

### Story 12.4: Cross-linking from pets / maintenance

## Epic 13: EV & Energy Module

### Story 13.1: EV charging log schema + repo

### Story 13.2: Manual charging log endpoints + UI

### Story 13.3: Energy overview dashboard

### Story 13.4: Configurable fuel/electricity rates

### Story 13.5: EV "not plugged in" alert (core, plugin-independent)

## Epic 14: Alert System

### Story 14.1: Alerts schema + repository

### Story 14.2: Alert engine service

### Story 14.3: Reminder evaluator scheduler job

### Story 14.4: Alerts API + WebSocket events

### Story 14.5: Audio chime per alert category

### Story 14.6: Severity colour coding + nav badges

### Story 14.7: Plugin-source alerts

## Epic 15: Voice Pipeline

### Story 15.1: Voice process bootstrap + systemd service

### Story 15.2: OpenWakeWord integration with custom wake-word training

### Story 15.3: Whisper STT integration

### Story 15.4: Voice command router (core built-ins)

### Story 15.5: Piper TTS integration + queue

### Story 15.6: Voice listening indicator over WebSocket

### Story 15.7: Quiet hours enforcement

### Story 15.8: Voice command history admin view

### Story 15.9: Voice fallback when hardware missing

## Epic 16: Plugin System & Official Plugins

### Story 16.1: Plugin manifest schema + loader

### Story 16.2: NestorPluginContext + Plugin Manager runtime

### Story 16.3: Plugin admin page + enable/disable + settings panel

### Story 16.4: Plugin settings repository (encrypted)

### Story 16.5: Capability registries (widgets, nav modes, sidebar filters, transport adapters, calendar systems)

### Story 16.6: Plugin error isolation + chaos test

### Story 16.7: Tesla plugin — manifest + auth + battery widget

### Story 16.8: Tesla plugin — alerts + TTS announcements

### Story 16.9: Eufy plugin — cameras + doorbell + vacuum

### Story 16.10: AI Assistant plugin — Gemini integration

### Story 16.11: Garden Pal plugin stub

### Story 16.12: Community plugin directory loader

### Story 16.13: YouTube player plugin

## Epic 17: Admin & Settings

### Story 17.1: Settings shell + section navigation

### Story 17.2: Profiles admin panel

### Story 17.3: Localisation admin panel

### Story 17.4: Calendar admin panel

### Story 17.5: Display & behaviour admin panel

### Story 17.6: Navigation admin panel

### Story 17.7: Voice & audio admin panel

### Story 17.8: Accessibility admin panel

### Story 17.9: System admin panel (version, update, backup, factory reset)

### Story 17.10: Notification advance days configuration

## Epic 18: Internationalisation & Accessibility

### Story 18.1: i18next bootstrap (client + server) + locale settings

### Story 18.2: Locale-aware formatting helpers

### Story 18.3: i18n lint rule (no hardcoded strings in JSX)

### Story 18.4: Accessibility tokens + per-profile text size

### Story 18.5: Axe-core integration in Playwright

### Story 18.6: RTL preparation (CSS logical properties everywhere)

### Story 18.7: Colour-blind safe palette toggle

### Story 18.8: Simplified navigation mode (per profile)

### Story 18.9: French locale acceptance test

## Epic 19: Setup Wizard & Installation

### Story 19.1: Setup wizard React component (10-step shell)

### Story 19.2: Wizard step content — language, locale, profiles

### Story 19.3: Wizard step content — calendars (QR OAuth)

### Story 19.4: Wizard step content — display, orientation, voice, features, plugins

### Story 19.5: Single-line install script

### Story 19.6: systemd service templates

### Story 19.7: Chromium kiosk launcher

### Story 19.8: In-app update mechanism

### Story 19.9: JSON export / import + factory reset

### Story 19.10: Robust screen rotation for kiosk displays

## Epic 20: Testing, Polish & Release

### Story 20.1: Jest unit-test infrastructure

### Story 20.2: Supertest API integration test harness

### Story 20.3: React Testing Library smoke tests on key components

### Story 20.4: Playwright E2E test suite

### Story 20.5: Lighthouse CI on home + calendar

### Story 20.6: Network audit (no undisclosed outbound calls)

### Story 20.7: Plugin chaos test in CI

### Story 20.8: Release pipeline (tag → build → release tarball)

### Story 20.9: 30-day uptime soak test

### Story 20.10: README + hardware guide + plugin developer docs

### Story 20.11: Release v1.0 (MVP cut)

## Epic 21: Visual Redesign — Warm Cozyla-Inspired Theme

### Story 21.1: Design token system

### Story 21.2: Home screen redesign

### Story 21.3: Calendar redesign

### Story 21.4: Food redesign

### Story 21.5: Navigation bar redesign

### Story 21.6: Remaining screens

## Epic 22: Animations & Micro-interactions

### Story 22.1: Motion foundation

### Story 22.2: Page/route transitions

### Story 22.3: Day carousel

### Story 22.4: Event & list interactions

### Story 22.5: Reward & achievement animations

### Story 22.6: Alert & notification animations

### Story 22.7: Form & button feedback

### Story 22.8: Screensaver & idle

## Epic 23: Calendar Sync Fix (superseded by Epic 33)

### Story 23.1: Diagnose and fix Apple iCloud CalDAV

### Story 23.2: Sync status visibility

### Story 23.3: Sync reliability

## Epic 24: Tesla Plugin v2 — Full Implementation (superseded by Epic 36)

### Story 24.1: Tesla API authentication

### Story 24.2: Live vehicle data

### Story 24.3: Home screen widget

### Story 24.4: Alerts

### Story 24.5: Home charging log

### Story 24.6: Climate pre-conditioning

## Epic 25: Ohme Home EV Charger Plugin

### Story 25.1: Ohme API integration

### Story 25.2: Charge session data

### Story 25.3: Home screen widget

### Story 25.4: Smart charge schedule display

## Epic 26: Octopus Energy Plugin v2 — Full Home Energy Dashboard (superseded by Epic 37)

### Story 26.1: Smart meter live data

### Story 26.2: Energy dashboard — EV screen

### Story 26.3: Agile/Intelligent tariff display

### Story 26.4: Home screen widget

### Story 26.5: Alerts

## Epic 27: Eufy Plugin v2 — Cameras, Doorbell, Vacuum (superseded by Epic 38)

### Story 27.1: Eufy API integration

### Story 27.2: Doorbell — ring detection & alert

### Story 27.3: Camera feeds

### Story 27.4: RoboVac control

### Story 27.5: Home screen widget

## Epic 28: Home Assistant Integration Plugin

### Story 28.1: Home Assistant API connection

### Story 28.2: Entity widget strip

### Story 28.3: Entity control panel

### Story 28.4: Automations & scenes

### Story 28.5: Alerts from HA

### Story 28.6: Voice integration

## Epic 29: Screensaver — Family Photo Slideshow

### Story 29.1: Photo source & management

### Story 29.2: Screensaver component

### Story 29.3: Idle detection & trigger

### Story 29.4: Night mode integration

## Epic 30: In-App Update System

### Story 30.1: Update check service

### Story 30.2: Update badge & notification

### Story 30.3: Update execution

### Story 30.4: Rollback

## Epic 31: Missing PRD Features

### Story 31.1: Journey time & commute widget (PRD §9, §12)

### Story 31.2: WFH / In-office / Shift day indicators (PRD §9, §10)

### Story 31.3: Landscape orientation layout (PRD §7)

### Story 31.4: Night mode & brightness control (PRD §8)

### Story 31.5: Budget tracker (PRD §14)

### Story 31.6: Benefits & income reminders (PRD §15)

### Story 31.7: Toddler & teen profile views (PRD §5, §13)

### Story 31.8: Checklist templates (PRD §19)

### Story 31.9: Remote access setup guide (PRD §25)

### Story 31.10: Mileage log & freelancer features (PRD §28)

## Epic 32: Deploy & first-run foundation

### Story 32.1: Fresh-install smoke test

### Story 32.2: Integrations hub

### Story 32.3: Location setup

### Story 32.4: Wizard → hub integration

### Story 32.5: Repair stale tests

## Epic 33: Calendars (Google, Apple, Yahoo)

### Story 33.1: Spike: Google OAuth for Calendar

### Story 33.2: Google onboarding

### Story 33.3: Apple iCloud onboarding

### Story 33.4: Yahoo onboarding

### Story 33.5: Sync status & errors

### Story 33.6: Live verification

## Epic 34: Voice v2

### Story 34.1: Spike: voice stack benchmark on the NUC

### Story 34.2: Installer provisions voice stack

### Story 34.3: Integrate chosen engine

### Story 34.4: Voice diagnostics UI

### Story 34.5: Live verification

## Epic 35: AI assistant (Gemini Flash)

### Story 35.1: Gemini client with configurable model id and API key

### Story 35.2: Voice → AI routing

### Story 35.3: Quota handling and privacy notice

### Story 35.4: Live verification

## Epic 36: Tesla

### Story 36.1: Developer-app setup guide

### Story 36.2: OAuth authorization + token refresh

### Story 36.3: Re-wire existing plugin

### Story 36.4: Virtual key pairing guide and commands

### Story 36.5: Live verification

## Epic 37: Octopus Energy

### Story 37.1: Onboarding:

### Story 37.2: Live verification

## Epic 38: Eufy

### Story 38.1: Spike: `eufy-security-client`

### Story 38.2: Login onboarding

### Story 38.3: Doorbell ring → alert + TTS

### Story 38.4: Camera snapshots/feeds

### Story 38.5: Spike: RoboVac control

### Story 38.6: Live verification

## Epic 39: In-App On-Screen Keyboard (OSK Phase 2)

### Story 39.1: Core keyboard component

### Story 39.2: Global input focus detection

### Story 39.3: Autocomplete & number pad

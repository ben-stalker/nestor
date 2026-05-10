# STORY-2.11: Guest lock-screen overlay

**Epic:** EPIC-2 — Profile System & UI Shell

**As a** household admin
**I want** a babysitter to access a guest profile from a lock-screen overlay without entering the main app
**So that** they only see today's schedule, contacts, and child routines

## Acceptance Criteria

- [x] Guest-mode overlay accessible from profile switcher with optional PIN gate
- [x] Renders a stripped-down screen: today's events, child routines (view only), emergency contacts, today's meal
- [x] "Exit guest mode" requires admin PIN

## Tasks

- [x] Server: add `POST /api/v1/admin/verify-pin` endpoint (verify admin PIN without side effects)
- [x] Server: tests for verify-pin endpoint
- [x] Client: extend appStore with `guestProfileId` + `setGuestMode` (not persisted)
- [x] Client: add `verifyAdminPin` to `api/admin.ts`
- [x] Client: extract `AdminPinPrompt` to `shared/ui/AdminPinPrompt.tsx` (generic `onVerify` prop)
- [x] Client: update KioskOverlay to use shared AdminPinPrompt
- [x] Client: create `core/GuestOverlay.tsx` with four placeholder sections + exit button
- [x] Client: update AvatarStrip — guest-type profile click → activate guest mode (with optional PIN gate)
- [x] Client: update AppShell — render GuestOverlay
- [x] Client: CSS for guest overlay layout
- [x] Client: tests for GuestOverlay (open/close/exit prompt)
- [x] Client: AvatarStrip tests for guest mode entry
- [x] Client: appStore tests for guestMode state

## Status: Complete

**Completed:** 2026-05-10

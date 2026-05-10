# STORY-2.8: Profile context + profile switcher avatar strip

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** L (3d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household member
**I want** to tap an avatar at the top of the home screen to switch profile (PIN if required)
**So that** I see my view of the household

---

## Acceptance Criteria

- [x] `<ProfileProvider>` wraps the app; exposes `useActiveProfile(): Profile | null`
- [x] Active profile id persisted to `localStorage` via Zustand persist; `<ProfileProvider>` resolves to the full Profile via TanStack Query
- [x] `<AvatarStrip>` component renders all profiles horizontally on the home header
- [x] Each avatar: circular `<Avatar>` with profile colour border, name underneath
- [x] Tap → if profile has `pin_hash`, open `<PinPrompt>` modal; else switch immediately
- [x] `<PinPrompt>` calls `POST /api/v1/profiles/:id/verify-pin`; on `{ valid: true }` switch profile; on `{ valid: false }` shake the dialog (CSS keyframe), clear input, show error message
- [x] After 5 failed attempts in 15 min the API returns 429; UI surfaces "Too many attempts, try again later"
- [x] Switching invalidates all TanStack Query caches (so per-profile data refetches with new `X-Profile-Id` header)
- [x] On switch, applies per-profile `text_size` and `simplified_nav` as data attributes on `<html>`: `data-text-size`, `data-simplified-nav`
- [x] `prefers-reduced-motion` users see instant transitions (no shake animation)
- [x] Active profile's colour visible as a thicker border on the avatar

---

## Technical Implementation

### Files created / modified

**Server:**
- `server/src/types/profile.ts` — Added `pinSet: boolean` to Profile interface
- `server/src/repositories/ProfileRepository.ts` — SQL CASE expression computes `pin_set`; `toProfile()` maps to `pinSet`

**Client:**
- `client/src/api/client.ts` — Added `ApiError` class with `status: number`
- `client/src/api/profiles.ts` — Client-side `Profile` type, `getProfiles()`, `verifyPin()`
- `client/src/store/appStore.ts` — Added Zustand `persist` middleware (persists `activeProfileId` to localStorage)
- `client/src/core/hooks/useProfiles.ts` — TanStack Query hook for `GET /api/v1/profiles`
- `client/src/core/hooks/useActiveProfile.ts` — Derives active Profile from store ID + query data
- `client/src/core/applyProfileSettings.ts` — Sets `data-text-size` / `data-simplified-nav` on `<html>`
- `client/src/core/ProfileProvider.tsx` — Initializes active profile on mount; re-applies settings on switch
- `client/src/core/AvatarStrip.tsx` — Horizontal scrollable avatar strip with PIN gate
- `client/src/core/PinPrompt.tsx` — PIN entry modal: numeric keypad, 4-dot indicator, CSS shake, 429 handling
- `client/src/index.css` — text-size overrides, simplified-nav, avatar-strip styles, shake keyframe
- `client/src/App.tsx` — Wrapped with `<ProfileProvider>`
- `client/src/router.tsx` — Added `HomePage` with `<AvatarStrip>` in home header

**Tests:**
- `client/tests/core/AvatarStrip.test.tsx` — 10 tests
- `client/tests/core/PinPrompt.test.tsx` — 14 tests

---

## Test Checklist

- [x] Unit: `useActiveProfile` returns the correct profile based on store id
- [x] Unit: tapping avatar with no PIN switches immediately
- [x] Unit: tapping avatar with PIN opens prompt
- [x] Unit: correct PIN switches profile and invalidates queries
- [x] Unit: incorrect PIN shakes and clears input
- [x] Unit: 429 response shows "Too many attempts" message
- [x] Unit: switching applies `data-text-size` and `data-simplified-nav` to `<html>`
- [x] a11y: PIN prompt is reachable by keyboard, Escape closes
- [x] Manual: with `prefers-reduced-motion`, no shake animation occurs (CSS media query)

---

## Progress Tracking

**Status History:**
- 2026-05-10: Implemented by Claude

**Actual Effort:** L (matched estimate)

**Implementation Notes:**
- Server computes `pinSet` via SQL `CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END` — `pin_hash` never exposed in API response
- Shake animation implemented as CSS keyframe + `@media (prefers-reduced-motion: reduce)` override (Framer Motion not installed)
- `ApiError` class added to `apiFetch` to carry HTTP status for 429 detection
- Zustand `persist` middleware partializes to `activeProfileId` only — `adminPin` is ephemeral
- 111 client tests / 185 server tests passing; lint + typecheck clean

---

## Dependencies

- **Blocked by:** STORY-2.4, STORY-2.5, STORY-2.7 ✓
- **Blocks:** STORY-3.2 (home header), STORY-7.4 (child profile view), STORY-2.10 (kiosk-child mode)

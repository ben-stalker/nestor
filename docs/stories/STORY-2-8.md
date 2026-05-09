# STORY-2.8: Profile context + profile switcher avatar strip

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** to tap an avatar at the top of the home screen to switch profile (PIN if required)
**So that** I see my view of the household

---

## Acceptance Criteria

- [ ] `<ProfileProvider>` wraps the app; exposes `useActiveProfile(): Profile | null`
- [ ] Active profile id persisted to `localStorage` via Zustand persist (already in STORY-1.7); `<ProfileProvider>` resolves to the full Profile via TanStack Query
- [ ] `<AvatarStrip>` component renders all profiles horizontally on the home header (matches `home_.png` top-left strip)
- [ ] Each avatar: circular `<Avatar>` with profile colour border, name underneath
- [ ] Tap → if profile has `pin_hash`, open `<PinPrompt>` modal; else switch immediately
- [ ] `<PinPrompt>` calls `POST /api/v1/profiles/:id/verify-pin`; on `{ valid: true }` switch profile; on `{ valid: false }` shake the dialog (Framer Motion or CSS keyframe), clear input, show error message
- [ ] After 5 failed attempts in 15 min the API returns 429; UI surfaces "Too many attempts, try again later"
- [ ] Switching invalidates all TanStack Query caches (so per-profile data refetches with new `X-Profile-Id` header)
- [ ] On switch, applies per-profile `text_size` and `simplified_nav` as CSS classes on `<html>`: `data-text-size="large"`, `data-simplified-nav="true"`
- [ ] `prefers-reduced-motion` users see instant transitions (no shake or fade)
- [ ] Active profile's colour visible as a subtle accent on the avatar's border + behind the name

---

## Technical Implementation

### Files to create / modify

- `client/src/core/ProfileProvider.tsx`
- `client/src/core/hooks/useActiveProfile.ts`
- `client/src/core/hooks/useProfiles.ts` — TanStack Query for `GET /api/v1/profiles`
- `client/src/core/AvatarStrip.tsx`
- `client/src/core/PinPrompt.tsx`
- `client/src/core/applyProfileSettings.ts` — sets `<html>` data attributes
- `client/src/api/profiles.ts` — typed API helpers
- `client/tests/core/AvatarStrip.test.tsx`
- `client/tests/core/PinPrompt.test.tsx`

### Implementation steps

1. `useProfiles()` hook: TanStack Query `['profiles']` calling `apiFetch('/profiles')`. Returns the full list.
2. `useActiveProfile()`:
```ts
export function useActiveProfile() {
  const id = useAppStore(s => s.activeProfileId);
  const { data: profiles } = useProfiles();
  return profiles?.find(p => p.id === id) ?? null;
}
```
3. `<AvatarStrip>`:
```tsx
function AvatarStrip() {
  const { data: profiles } = useProfiles();
  const setActiveProfileId = useAppStore(s => s.setActiveProfileId);
  const queryClient = useQueryClient();
  const handleSwitch = async (p: Profile) => {
    if (p.pinSet) { setPinTarget(p); return; }
    setActiveProfileId(p.id); queryClient.invalidateQueries(); applyProfileSettings(p);
  };
  // … render horizontal scroll of <Avatar>
}
```
4. `<PinPrompt>`: `<Modal>` with numeric keypad, 4-digit display, calls `apiFetch('/profiles/:id/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) })`. On valid, switch profile. On invalid, shake animation (Framer Motion `motion.div` with `animate={{ x: [0, -10, 10, -10, 10, 0] }}` gated on `useReducedMotion()`).
5. `applyProfileSettings(profile)`: `document.documentElement.dataset.textSize = profile.textSize; document.documentElement.dataset.simplifiedNav = String(profile.simplifiedNav);`. CSS rules in `index.css`: `[data-text-size="large"] { --base-font-size: 22px; }`, etc.
6. On any profile switch, call `queryClient.invalidateQueries()` so all data refetches with new `X-Profile-Id`.
7. Tests: render with mocked profiles, click an avatar, assert `<PinPrompt>` opens; submit correct/incorrect PIN; assert switch & invalidation.

### Key technical details

- PRD §5 "Profile Switching UX" describes the avatar strip and PIN prompt.
- The avatar strip lives in the home header; the design `home_.png` shows multiple small circles aligned with the household members.
- `pinSet` is derived from whether `pin_hash` exists — but the API never returns `pin_hash`. Add a server-side computed `pinSet: boolean` field to the profile list response, or check in the client by the absence of an explicit "no PIN" flag in the profile (preferred: server adds `pinSet`).
- Per Architecture §"Authentication & Authorization", `X-Profile-Id` header on every API request is set automatically by `apiFetch` (STORY-1.7) reading the store.
- Framer Motion shake: `useReducedMotion()` returns true → use plain class name with no transform.

---

## Dependencies

- **Blocked by:** STORY-2.4, STORY-2.5, STORY-2.7
- **Blocks:** STORY-3.2 (home header), STORY-7.4 (child profile view), STORY-2.10 (kiosk-child mode)

---

## Test Checklist

- [ ] Unit: `useActiveProfile` returns the correct profile based on store id
- [ ] Unit: tapping avatar with no PIN switches immediately
- [ ] Unit: tapping avatar with PIN opens prompt
- [ ] Unit: correct PIN switches profile and invalidates queries
- [ ] Unit: incorrect PIN shakes and clears input
- [ ] Unit: 429 response shows "Too many attempts" message
- [ ] Unit: switching applies `data-text-size` and `data-simplified-nav` to `<html>`
- [ ] a11y: PIN prompt is reachable by keyboard, Escape closes
- [ ] Manual: with `prefers-reduced-motion`, no shake animation occurs

---

## Notes

- Server `GET /api/v1/profiles` should include `pinSet: boolean` in the response shape; update STORY-2.2's repository return type accordingly when this story is implemented.
- The avatar strip is reused on the home screen (STORY-3.2) and the lock-screen overlay (STORY-2.11).

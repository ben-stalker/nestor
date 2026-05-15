# STORY-7.4: Child profile view (kid-friendly)

**Epic:** EPIC-7: Family Module — Children & Health
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** L (3d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** child
**I want** my own simplified view with today's events, chores, and star balance
**So that** I can use Nestor independently

---

## Acceptance Criteria

- [ ] When active profile type is `child` or `toddler`, root route redirects to `/me`
- [ ] `/me` renders: big "My Day" card (today's events for this profile), large chore tiles with check buttons, star balance, current reward target
- [ ] Toddler variant: just the star tap (single screen, no chrome)
- [ ] Reward burst animation on chore complete (Framer Motion confetti / scale-pop)
- [ ] All chrome simplified — no settings, no admin (existing `simplified_nav` from STORY-18.4 honoured)
- [ ] Filter panel hidden
- [ ] Profile switcher visible but PIN-locked exit

---

## Technical Implementation

### Files to create / modify

- `client/src/me/MePage.tsx`
- `client/src/me/MyDayCard.tsx`
- `client/src/me/ChoreTile.tsx`
- `client/src/me/RewardTracker.tsx`
- `client/src/me/ToddlerView.tsx`
- `client/src/router.tsx` — redirect logic
- `client/tests/me/MePage.test.tsx`

### Implementation steps

1. Router guard:
```tsx
function HomeRedirect() {
  const profile = useActiveProfile();
  if (profile?.type === 'child' || profile?.type === 'toddler') return <Navigate to="/me" replace />;
  return <HomePage />;
}
```
2. `<MePage>`:
   - Header: large avatar + name + greeting.
   - "My Day" card: today's events filtered to this profile, big text.
   - Chore tiles: each chore as a tappable card with checkmark; tap → mutation `PATCH /chores/:id/complete`; on success, fire confetti animation.
   - Star balance card: shows N stars (uses STORY-7.5 grid).
3. `<ToddlerView>`: a different render path for `type === 'toddler'`:
   - Only stars + a single "I helped!" button that completes a generic chore.
   - No navigation; PIN required to exit.
4. Confetti animation: Framer `<motion>` scale 0 → 1.5 → 0, plus simple particles via custom component.
5. AppShell hides nav for these profiles (or replaces with minimal "Switch profile" affordance).
6. Tests: child profile → /me renders; chore tile complete fires animation; toddler renders simplified.

### Key technical details

- PRD §5 child + toddler views.
- The simplified_nav from STORY-18.4 is automatic if profile flag set; this story explicitly enforces it for child/toddler types.
- Reduced motion respected via `useReducedMotion`.
- Reward target visible: "Save up to {X} for {label}" string from `app_settings.reward_targets[profileId]`.

---

## Dependencies

- **Blocked by:** STORY-7.3, STORY-2.8
- **Blocks:** STORY-7.5 (star grid embedded), STORY-7.10 (routines launched from here)

---

## Test Checklist

- [ ] RTL: child profile → /me renders MyDay + chores + stars
- [ ] RTL: chore tile complete → mutation + confetti
- [ ] RTL: toddler profile → ToddlerView renders
- [ ] RTL: nav hidden for child/toddler
- [ ] Manual: confetti respects reduced-motion
- [ ] Manual: PIN required to exit profile

---

## Notes

- Big colourful UI is intentional — kid-friendly. Avoid emojis in source per project rules; use SVG iconography.
- The "My Day" card pulls from the same calendar events query as the carousel, but profile-scoped.

---

## Progress

**Completed:** 2026-05-15

Delivered `MePage.tsx` with large avatar header, `MyDayCard.tsx` (profile-scoped events), `ChoreTile.tsx` (tappable with Framer Motion confetti on completion), and `ToddlerView.tsx` (single-screen star tap with PIN-locked exit). `HomeRedirect` and `MeRoute` added to `router.tsx` to redirect child/toddler profiles to `/me`. `MePage.test.tsx` covers 3 RTL tests for render, chore completion mutation, and toddler variant.

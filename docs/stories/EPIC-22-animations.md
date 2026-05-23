# EPIC-22: Animations & Micro-interactions

**Status:** backlog  
**Priority:** 3

## Overview

Make every interaction feel intentional and polished. The app should feel alive — not in a flashy way, but with the quiet satisfaction of a well-crafted physical product. All animations must respect the OS reduced-motion preference.

## Stories

### STORY-22.1: Motion foundation

- Install `framer-motion` (MIT, React-native animation library)
- Create `useReducedMotion()` hook wrapping `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Create `<AnimatePresence>` wrapper convention for all route transitions and conditional renders
- Document the motion scale in `docs/motion.md`: duration tokens (fast=150ms, default=250ms, slow=400ms), easing presets (spring for expand/collapse, ease-out for entrances, ease-in for exits)

### STORY-22.2: Page/route transitions

- Route changes: shared-axis slide — new page slides in from right, old slides out to left (200ms ease-out)
- Back navigation: reverse direction
- Modal: slide up from bottom (spring, damping=20, stiffness=300)
- Modal dismiss: fade + slide down (150ms ease-in)
- All transitions: reduced-motion fallback = simple fade (100ms)

### STORY-22.3: Day carousel

- Swipe left/right with `touch-action: pan-x` and spring physics on release
- Day card expand to full-screen day view: card scales up and fades in remaining content (shared-element style, 300ms spring)
- Thin day cards slide apart to make room when a new day becomes focal
- "Back to Today" button: pulse animation when first shown

### STORY-22.4: Event & list interactions

- Tap on event card: brief scale-down (0.97) on press, scale back on release
- New event added: card animates in from above with a spring (staggered if batch)
- Event deleted: collapses height with opacity fade (200ms)
- Chore marked done: strikethrough animates left-to-right, row colour fades to muted green then collapses
- Shopping item ticked: same strikethrough + collapse

### STORY-22.5: Reward & achievement animations

- Star collected: burst of 8 particles radiating outward (gold, 400ms), then star settles into the grid
- Goal reached: confetti shower (60 particles, 1.2s, respects reduced-motion — shows static tick instead)
- Reward redeemed: coin-flip animation on the reward item

### STORY-22.6: Alert & notification animations

- Alert appears: slides down from top (spring)
- Alert dismissed: slides back up + opacity 0 (150ms)
- Nav badge appears: scale from 0 with spring bounce
- Doorbell ring (Eufy): full-screen overlay fades in with pulsing ring animation

### STORY-22.7: Form & button feedback

- All buttons: scale 0.97 on active press via CSS `active:scale-[0.97] transition-transform`
- Toggle switches: thumb slides with spring physics
- Input focus: border colour transitions with 150ms ease
- Form submission pending: button content cross-fades to spinner, button width locks to prevent layout jump
- Success: green tick check-draws itself (SVG stroke animation, 400ms)
- Error: red shake (3 oscillations, 300ms)

### STORY-22.8: Screensaver & idle

- Idle → screensaver: content fades out (500ms), photo slideshow fades in
- Ken Burns: each photo slowly zooms 100%→110% or pans over 8s
- Photo crossfade: 1s overlap between photos
- Touch to wake: screensaver fades out (300ms), content fades in

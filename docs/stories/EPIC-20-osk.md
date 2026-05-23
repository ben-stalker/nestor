# EPIC-20: In-App On-Screen Keyboard (OSK Phase 2)

**Status:** backlog  
**Priority:** 1

## Overview

Replace the OS-level onboard approach (unreliable due to kiosk/AppArmor constraints) with a custom React virtual keyboard that is fully integrated into the Nestor UI. The keyboard appears automatically when any text input is focused, slides up from the bottom, pushes content up to keep the input visible, and dismisses on blur or an outside tap.

## Stories

### STORY-20.1: Core keyboard component

- Install `react-simple-keyboard` (MIT licence, well maintained)
- Create `client/src/components/VirtualKeyboard.tsx` — full QWERTY layout matching portrait width
- Compact mode (default) and number-pad mode (auto-selects for `type="number"` and `inputmode="numeric"` inputs)
- Themed to match Nestor warm palette (cream keys, rounded corners, subtle shadows)
- Keyboard state managed via a React context (`KeyboardContext`) so any input anywhere in the app can trigger it without prop drilling

### STORY-20.2: Global input focus detection

- `KeyboardContext` provider wraps the app in `App.tsx`
- Intercept `focus` and `blur` events on all `<input>` and `<textarea>` elements via a top-level capture listener
- On focus: animate keyboard up from bottom (spring animation, 250ms), push layout up via padding/transform
- On blur (with 150ms delay to allow tap-on-key): animate down and restore layout
- Tapping outside the keyboard + outside an input dismisses it
- Respect `data-no-osk` attribute on inputs where OSK is explicitly unwanted

### STORY-20.3: Autocomplete & number pad

- Shopping list and recipe ingredient inputs get word suggestions drawn from existing items
- PIN entry inputs use number pad layout (large digits, no letters)
- Date/time inputs use dedicated date picker, not keyboard
- Keyboard value syncs back to the focused input via `InputEvent` dispatch so React's synthetic events fire correctly

# EPIC-21: Visual Redesign — Warm Cozyla-Inspired Theme

**Status:** backlog  
**Priority:** 2

## Overview

Restyle the entire app to match the design language shown in `home_.png`, `calendar_.png`, and `food.png` in the repo root. The current implementation uses a generic neutral/dark theme. The target is warm, cream-based, card-heavy, and polished — designed to look great on a wall.

## Design Reference

See `home_.png`, `calendar_.png`, `food.png` in repo root.

### Key design tokens to establish
- **Background:** `#F5F0EB` (warm cream, not white)
- **Card surface:** `#FFFFFF` with very subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
- **Primary text:** `#1C1C1E`
- **Secondary text:** `#6B6B6B`
- **Border:** `#E8E3DE` (warm grey, not cool grey)
- **Accent colours per mode:** Calendar=`#3B7DD8`, Food=`#E07B54` (terracotta), Family=`#7B6FD4`, House=`#3D9E8C`, Finance=`#5B6EAE`, Pets=`#C9943A`, EV=`#3DA5D9`, Board=`#C46BAB`
- **Border radius — cards:** `20px`, **buttons:** `12px`, **avatars:** `50%`
- **Font:** Inter for body/UI; large date/time numerals in a serif (Playfair Display or Lora)

## Stories

### STORY-21.1: Design token system

- Define all tokens in `client/src/styles/tokens.css` as CSS custom properties
- Replace all hardcoded colour/radius/shadow values throughout the codebase with token references
- Add Playfair Display (or Lora) via Google Fonts / self-hosted for date numerals only
- Update Tailwind config to reference tokens

### STORY-21.2: Home screen redesign

Match `home_.png`:
- Warm cream full-bleed background
- Top header bar: Nestor logo left, weather widget right, profile avatars row below
- Large serif clock and date (centre or left-aligned per `home_.png`)
- Day carousel cards: white rounded cards with warm shadow, event rows with profile colour left-border
- Alert strip: pill-shaped dismissible chips above the carousel
- Widget strip below carousel (if plugins active)
- Journeys and "Tonight" cards in 2-column grid at bottom
- Profile filter strip: horizontal pill toggles with profile colours

### STORY-21.3: Calendar redesign

Match `calendar_.png`:
- Warm background, white grid cells
- Week view: today column highlighted with cream/amber tint
- Event chips: rounded, profile-coloured background, white text
- Bottom panel: today's agenda list + quick-add bar
- Day/Week/Month toggle as segmented pill control

### STORY-21.4: Food redesign

Match `food.png`:
- Meal planner grid: warm card cells, meal type label in muted text
- Selected day card: dark overlay with recipe name and detail
- Recipe card: full-bleed image top, recipe metadata row (time, calories, rating), ingredient checklist
- Shopping list: clean checklist with category group headers
- Terracotta accent colour throughout Food mode

### STORY-21.5: Navigation bar redesign

- Taller bottom nav (72px), icon + label, active item = mode accent colour dot below icon
- Badge count in warm red pill
- Rounded top corners on nav bar container

### STORY-21.6: Remaining screens

Apply the same token system and card conventions to: Vehicles, Family, House, Finance, Pets, EV, Board, Admin, Setup Wizard. Consistency over pixel-perfection — all screens should feel like they belong to the same app.

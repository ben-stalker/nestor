# EPIC-31: Missing PRD Features

**Status:** backlog  
**Priority:** 12

## Overview

Features in the PRD not yet implemented. Grouped by section for clarity.

---

## STORY-31.1: Journey time & commute widget (PRD §9, §12)

- Saved routes per adult profile (origin, destination, transport mode)
- Journey time fetched from a configurable transport API (default: TfL API for London, National Rail for rail)
- Widget on home screen: "Home → Office: 38 min (2 min delay)"
- Configurable per profile per day of week (e.g. only show on Mon–Fri)
- Transport API layer is pluggable — community can add Deutsche Bahn, SNCF, MTA adapters

---

## STORY-31.2: WFH / In-office / Shift day indicators (PRD §9, §10)

- Per adult profile, per day: WFH / Office / Shift / Day off
- Shown as a coloured pill on each day card in the carousel
- Configurable in Profile settings or inline from the day card
- Shift mode: Early / Late / Night with configurable start/end times

---

## STORY-31.3: Landscape orientation layout (PRD §7)

- Portrait is the primary layout; landscape is a purposefully designed second layout (not a rotation of the same)
- Landscape: left side navigation rail (vertical icons), main content fills remaining width
- Day carousel condensed to a top strip in landscape
- Plugin widgets move to a right column
- Auto-detected from screen dimensions; overrideable in Admin → Display

---

## STORY-31.4: Night mode & brightness control (PRD §8)

- Night mode hours configurable in Admin → Display (e.g. 22:00–07:00)
- During night mode: dark CSS theme applied automatically + brightness reduced
- Manual dark/light toggle always available
- DPMS: server shell-outs to `xset dpms force off` / `on` for OS-level display sleep
- `ddcutil` integration for hardware brightness control (optional, if DDC/CI supported by monitor)

---

## STORY-31.5: Budget tracker (PRD §14)

- Monthly household budget figure in Admin → Finance
- Quick-add expenses: amount, category, description — from home screen shortcut or Finance section
- Configurable categories (default: Food, Transport, Entertainment, Clothing, Other)
- Spend vs budget bar per category
- Monthly total vs budget summary card

---

## STORY-31.6: Benefits & income reminders (PRD §15)

- Log regular income events: Universal Credit, Child Benefit, tax credits, salary date, etc.
- Configurable payment schedule per income source
- Upcoming payments shown in Finance section
- Alert N days before expected payment date (useful for cashflow awareness)

---

## STORY-31.7: Toddler & teen profile views (PRD §5, §13)

- Toddler view: full-screen large-element UI — giant star to tap for reward, today's schedule in big cards
- Teen view: simplified adult view — own calendar, household calendar, meal plan, shopping list, allowance tracker, Board
- Profile type drives which view is shown when that profile is active
- Kiosk child mode: locks screen to child's view, admin PIN required to exit

---

## STORY-31.8: Checklist templates (PRD §19)

- Pre-built checklist templates: Nursery Bag, Morning Routine, Bedtime Routine, Holiday Packing, Guest Arrival, Guest Departure, New Baby Essentials, Camping Trip
- Available in Checklists UI as "Start from template"
- Templates stored as JSON, community-contributable via GitHub PR

---

## STORY-31.9: Remote access setup guide (PRD §25)

- Admin → System → Remote Access: guided Tailscale setup
- Step-by-step in-app instructions: install, auth, copy Tailscale IP
- Shows current Tailscale status (connected / not installed)
- Syncthing setup guide for photo sync to screensaver folder

---

## STORY-31.10: Mileage log & freelancer features (PRD §28)

- Per-vehicle mileage log: date, miles/km, purpose, business flag
- Business mileage total for tax year (configurable start date — Jan or Apr for UK)
- Invoice due date reminder entry in Finance section
- Tax return reminder (configurable date)

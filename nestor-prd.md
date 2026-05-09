# Nestor — Product Requirements Document

**Version:** 0.5 (Draft)
**Status:** Planning
**Last Updated:** May 2026

> _Named after Nestor, the wise counsellor of Greek mythology — always present, always helpful, keeping everything in order._

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Principles](#2-goals--principles)
3. [Hardware Specification](#3-hardware-specification)
4. [Software Stack](#4-software-stack)
5. [Profiles & Permissions](#5-profiles--permissions)
6. [UI Style Direction](#6-ui-style-direction)
7. [Orientation — Portrait & Landscape](#7-orientation--portrait--landscape)
8. [Screen Layout & Navigation](#8-screen-layout--navigation)
9. [Home Screen](#9-home-screen)
10. [Calendar](#10-calendar)
11. [Food — Meal Planner & Recipe Library](#11-food--meal-planner--recipe-library)
12. [Vehicles & Travel](#12-vehicles--travel)
13. [Family — Children & Health](#13-family--children--health)
14. [House — Household Management](#14-house--household-management)
15. [Finance & Commitments](#15-finance--commitments)
16. [Pets](#16-pets)
17. [EV & Energy](#17-ev--energy)
18. [Board — Communication & Notes](#18-board--communication--notes)
19. [Checklists](#19-checklists)
20. [Contacts](#20-contacts)
21. [Alerts System](#21-alerts-system)
22. [Voice & Audio — Core](#22-voice--audio--core)
23. [On-Screen Keyboard](#23-on-screen-keyboard)
24. [Screensaver](#24-screensaver)
25. [Remote Access](#25-remote-access)
26. [Internationalisation & Localisation](#26-internationalisation--localisation)
27. [Accessibility](#27-accessibility)
28. [Household Scenarios](#28-household-scenarios)
29. [Installation & Distribution](#29-installation--distribution)
30. [Admin & Settings](#30-admin--settings)
31. [Plugin System](#31-plugin-system)
32. [Official Plugins](#32-official-plugins)
33. [Open Source Considerations](#33-open-source-considerations)
34. [Competitive Context](#34-competitive-context)
35. [Out of Scope for Initial Release](#35-out-of-scope-for-initial-release)
36. [Open Questions & Future Considerations](#36-open-questions--future-considerations)

---

## 1. Overview

**Nestor** is a free, open source, self-hosted household dashboard application designed to run on a large touchscreen mounted in the home. It provides a central hub for family scheduling, meal planning, household management, finance commitments, and day-to-day logistics. The system is built as a web application served locally from a mini PC or Raspberry Pi, accessible via a Chromium kiosk browser on the main screen and from any device on the home network via browser.

Nestor is designed for a wide range of household types — families with children of all ages, couples, single-person households, multigenerational homes, and shared houses. It is highly configurable so that any household can show only the features relevant to them.

Nestor is local-first — all core household data is stored on the device. Third-party service connections (Google Calendar, Gemini AI, weather APIs, etc.) are entirely opt-in and clearly documented. Nestor runs no servers and never handles user data centrally.

A plugin system allows brand-specific or niche integrations to be added without bloating the core application. Installation is designed to be approachable for non-technical users via a single-line install script and a guided setup wizard.

---

## 2. Goals & Principles

- **Local first** — all core data stored on-device; third-party connections are opt-in and clearly documented
- **Transparent about data** — Nestor connects to external services on the user's behalf; all connections are named and explained during setup
- **Open source** — designed for community contribution and extension
- **Touch optimised** — all interactions designed for touchscreen with large tap targets
- **Low maintenance** — runs reliably 24/7 with minimal intervention
- **Highly configurable** — any household can adapt the UI, features, nav, and behaviour to their needs
- **Works for everyone** — no assumptions about family structure, household composition, location, or technical ability
- **Plugin extensible** — brand-specific or niche integrations live as plugins, not in core
- **Accessible remotely** — optional Tailscale VPN for secure remote access without a cloud backend
- **Easy to install** — single-line install script, guided first-boot wizard, in-app updates
- **Readable at distance** — all key information legible from 1–2 metres without squinting
- **Internationalised** — built for global use from day one, not retrofitted
- **Accessible** — usable by people of all abilities and ages

---

## 3. Hardware Specification

### Recommended Setup

| Component | Recommendation                                                    | Approx Cost  |
| --------- | ----------------------------------------------------------------- | ------------ |
| Mini PC   | Intel NUC 6th/7th gen i3 (refurbished)                            | £50–£70      |
| Display   | Iiyama ProLite T2455MSC 24" or T2756MSC 27" touch monitor         | £350–£550    |
| OS        | Ubuntu 24 LTS                                                     | Free         |
| Storage   | Existing SSD (120GB+ sufficient)                                  | —            |
| Network   | Wired Ethernet preferred, WiFi acceptable                         | —            |
| Audio     | Jabra Speak 410 (USB, bus powered) or equivalent USB speakerphone | £40–£80 used |

### Display Requirements

- Capacitive multi-touch via USB (native Linux support, no drivers needed)
- HDMI input
- Portrait and landscape orientation support (software rotation at OS level)
- VESA mountable
- DDC/CI backlight control support for software brightness control
- Minimum 24" recommended for the full feature set

### Audio

- USB speakerphone or separate USB mic + speaker
- Linux compatible — no proprietary drivers required
- Omnidirectional microphone for wake word and voice command pickup
- Speaker for notification sounds, alerts, TTS responses, and plugin announcements
- Recommended: Jabra Speak 410 or Anker PowerConf S330
- Budget option: any generic USB speakerphone (~£15–£30)
- Mounting: slim USB soundbar below screen, or integrated into 3D printed wall enclosure

### Alternative Hardware

- Raspberry Pi 5 (4GB) at RRP (~£75) — viable but lower headroom for background services
- Mini PCs: Beelink Mini S12 Pro, GMKtec NucBox G2/G3 as new-purchase alternatives
- Refurbished Intel NUC on eBay — excellent value, enterprise-grade reliability
- Avoid scalper-priced Pi units or sub-4th gen Intel hardware
- i3 NUC preferred over i7 for 24/7 power consumption (15W TDP vs 45W TDP = ~£33/year saving)

### Mounting

- VESA wall mount recommended for clean permanent installation
- Portrait or landscape depending on user preference and room layout
- 3D printed enclosure an option — Printables/Thingiverse has designs for common displays
- Speaker/mic mounted below screen or integrated into custom enclosure
- Cable management important — right-angle HDMI and short USB cables recommended

---

## 4. Software Stack

| Layer                    | Technology                                                   |
| ------------------------ | ------------------------------------------------------------ |
| OS                       | Ubuntu 24 LTS                                                |
| Backend                  | Node.js + Express                                            |
| Database                 | SQLite                                                       |
| Frontend                 | React (served via Express)                                   |
| Browser                  | Chromium in kiosk mode                                       |
| Calendar sync            | iCal/CalDAV (Google, Apple, Yahoo)                           |
| On-screen keyboard       | Onboard (OS level, Phase 1), custom React keyboard (Phase 2) |
| Weather                  | Open-Meteo API (free, no API key, global coverage)           |
| Travel disruptions       | Configurable per region — abstracted transport API layer     |
| Recipe scraping          | Schema.org JSON-LD parser + cheerio fallback                 |
| Speech to text           | OpenAI Whisper (open source, runs locally)                   |
| Text to speech           | Piper TTS (open source, runs locally)                        |
| Wake word detection      | OpenWakeWord (open source, runs locally)                     |
| AI assistant (plugin)    | Google Gemini API                                            |
| Internationalisation     | i18next (industry standard i18n library for React/Node)      |
| Remote access (optional) | Tailscale                                                    |
| Photo sync (optional)    | Syncthing                                                    |

---

## 5. Profiles & Permissions

### Overview

Nestor supports multiple profile types to accommodate households of any composition. The number of profiles of any type is unconstrained — a household with five children, one parent, and two grandparents is fully supported. No assumptions are made about household structure.

All profile types, sections, and features are configurable. Households without children can hide all child-related features entirely.

### Profile Types

#### 👶 Baby (0–18 months)

**Screen interaction:** None
**Purpose:** Data tracking and calendar filtering for parents

Features enabled:

- Health log: feeds, nappy changes, sleep, medicine, temperature
- Milestone tracker: first smile, first word, first steps etc.
- Feeding schedule display on home screen
- Vaccination reminder schedule (dense in early months)
- Growth log: weight, length, head circumference
- Colour coded calendar events (hospital, health visitor)
- Sidebar filter in calendar

#### 🧒 Toddler (18 months–4 years)

**Screen interaction:** Minimal — tap to collect a reward star, nothing more
**Purpose:** Filtering, nursery features, very simple reward interaction

Features enabled:

- Everything Baby has (minus newborn-specific tracking)
- Nursery schedule and bag checklist
- Simple rewards chart — large colourful stars to tap and collect
- Age-appropriate chores marked done by parent or simple big-button tap
- Health and medicine log
- Calendar events colour coded

#### 🧑 Child (4–10 years)

**Screen interaction:** Meaningful — navigates their own section independently
**Purpose:** Active household participant with own view

Features enabled:

- Own filtered calendar view — school, clubs, playdates
- Full chores and rewards — marks chores done themselves
- Reward redemption — sees points balance and reward targets
- Homework reminder log (parent adds, child sees)
- After-school clubs schedule
- Countdown timers — birthday, holiday, Christmas
- "My Day" summary view — today's events, chores to do, star balance
- Simple message board access — view and post
- Emergency contacts view
- PIN-free access to their own profile view
- Cannot access: Finance, adult calendars, admin, other profiles' health data

#### 🧑‍🎓 Teenager (11–17 years)

**Screen interaction:** Full within their scope
**Purpose:** Semi-independent household participant

Features enabled:

- Everything Child has
- Own calendar — can add events (visible to parents, pending approval optional)
- Household calendar view — family events, who's where
- Car availability view (cannot book)
- Shopping list — view and add items (with optional parent approval flag)
- Meal plan view — what's for dinner this week
- Board — full message and whiteboard access
- Contacts — full access
- Pets — view
- Allowance tracker — points convertible to configurable monetary equivalent
- Cannot access: Finance details, admin settings, other profiles' health data

#### 👴 Grandparent / Extended Family

**Screen interaction:** Configurable — read-mostly with selected write access
**Purpose:** Regular household participant, not primary admin

Features enabled (configurable):

- Full calendar view
- Shopping list — view and add
- Meal plan view
- Board — full access
- Contacts — full access
- Pets — view
- Optionally: admin access if appropriate
- Accessibility settings applied to this profile (larger text etc.)
- Cannot access: Finance (unless granted), admin settings (unless admin role assigned)

#### 👤 Guest / Carer

**Screen interaction:** Limited — read-only with selected quick actions
**Purpose:** Temporary trusted access for babysitters, au pairs, short-term visitors

Features enabled:

- Today's schedule (family calendar — today only)
- Nursery / child routine and bag checklist (view only)
- Meal plan — today only
- Emergency contacts
- Basic household contacts (doctor, vet, local services)
- Optional PIN to switch to this profile from main screen lock screen
- Cannot access: Finance, full calendar, admin, health logs, messages

#### 🔑 Admin (Parent / Guardian / Household Lead)

**Screen interaction:** Full — all sections, all data, all settings
**Purpose:** Primary household manager

- Full access to all sections
- Creates and manages all profiles
- Configures permissions per profile type
- Multiple admins fully supported — no limit
- PIN or password protected

### Profile Permission Matrix

| Feature                | Baby   | Toddler  | Child     | Teen              | Grandparent | Guest | Admin |
| ---------------------- | ------ | -------- | --------- | ----------------- | ----------- | ----- | ----- |
| Own calendar — view    | ❌     | ❌       | ✅        | ✅                | ✅          | Today | ✅    |
| Family calendar — view | ❌     | ❌       | Limited   | ✅                | ✅          | Today | ✅    |
| Add calendar events    | ❌     | ❌       | ❌        | Optional approval | ✅          | ❌    | ✅    |
| Meal plan — view       | ❌     | ❌       | Today     | ✅                | ✅          | Today | ✅    |
| Shopping list — view   | ❌     | ❌       | ❌        | ✅                | ✅          | ❌    | ✅    |
| Shopping list — add    | ❌     | ❌       | ❌        | With flag         | ✅          | ❌    | ✅    |
| Chores — view          | ❌     | ✅       | ✅        | ✅                | ❌          | ❌    | ✅    |
| Chores — mark done     | ❌     | Simple   | ✅        | ✅                | ❌          | ❌    | ✅    |
| Rewards — collect      | ❌     | Tap star | ✅        | ✅                | ❌          | ❌    | ✅    |
| Health log             | Parent | Parent   | Parent    | Parent            | View        | View  | ✅    |
| Finance                | ❌     | ❌       | ❌        | ❌                | Optional    | ❌    | ✅    |
| Car — view             | ❌     | ❌       | ❌        | ✅                | ✅          | ❌    | ✅    |
| Car — book             | ❌     | ❌       | ❌        | ❌                | Optional    | ❌    | ✅    |
| Contacts — view        | ❌     | ❌       | Emergency | ✅                | ✅          | ✅    | ✅    |
| Pets — view            | ❌     | ❌       | ✅        | ✅                | ✅          | ❌    | ✅    |
| Board — view           | ❌     | ❌       | ✅        | ✅                | ✅          | ❌    | ✅    |
| Board — post           | ❌     | ❌       | ✅        | ✅                | ✅          | ❌    | ✅    |
| Admin settings         | ❌     | ❌       | ❌        | ❌                | Optional    | ❌    | ✅    |

All permissions are configurable per profile in Admin → Profiles. The matrix above represents sensible defaults.

### Profile Switching UX

**Default state:** Admin view (primary household users)

**Switching options:**

- Profile avatar strip at top of home screen — tap to switch
- PIN protection per profile — admin profiles PIN protected, child profiles open
- **Kiosk child mode** — locks screen to child's view, requires admin PIN to exit (useful for younger children using the screen independently)
- **Guest mode** — accessible from a lock-screen-style overlay without entering the main app
- Profile-specific home screen — Child and Teen views have a simplified, age-appropriate layout focused on their day and rewards

### Colour System

- Each profile assigned a distinct vivid colour during setup
- Sufficient colours available for large households (minimum 12 distinct options)
- Colour used throughout: calendar events, chore completions, messages, filter toggles, avatar borders

---

## 6. UI Style Direction

### Design Reference

Cozyla (uk.cozyla.com) is the closest commercially available product in this category. Their UI is a strong benchmark — warm, readable, card-based, and family-friendly. Nestor should feel spiritually similar whilst going significantly deeper on features, being open source, and running on any hardware.

### Core Aesthetic Principles

**Card-based layout**
All information in clearly bounded, rounded-corner cards. Each section a distinct visual unit. Subtle shadows or borders lift cards from the background.

**Warm and colourful**
Nestor should feel alive, warm, and inviting — something any household is happy to have on their wall. Vivid accent colours, friendly iconography, generous spacing.

**Readable at distance**
Primary information legible at 1–2 metres. Secondary detail revealed on tap.

**Large tap targets**
Every interactive element generously sized. Adequate spacing prevents accidental taps.

**Rounded corners throughout**
All cards, buttons, modals, avatars use consistent rounded corners.

**Icon-led navigation**
Bottom (portrait) or side (landscape) nav uses large icons with labels. Each mode has its own accent colour on active state.

**Typography hierarchy**
Three clear levels: large display for key info, medium body for detail, small caption for timestamps. Clean open source font (Inter or Nunito recommended).

**No generic AI aesthetics**
No dark glass morphism, no neon gradients. Nestor belongs in a home.

**Age-appropriate child views**
Child and toddler-facing UI uses larger elements, more colour, simpler language, and more animation than the adult view.

### Colour System

| Element            | Approach                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Base background    | Warm white (#FAFAFA) or very light grey                                                                                         |
| Dark mode base     | Deep warm grey (#1A1A2E or similar)                                                                                             |
| Per-person colours | Vivid, distinct — chosen at setup                                                                                               |
| Per-mode accents   | Calendar=blue, Food=orange, Vehicles=green, Family=purple, House=teal, Finance=indigo, Pets=amber, EV=electric blue, Board=pink |
| Alert colours      | Red (urgent), amber (warning), blue (info), green (success)                                                                     |
| Text               | Near-black on light (#1C1C1E), near-white on dark                                                                               |

### Animation & Interaction

- Carousel swipe: smooth scroll-snap, 200–300ms
- Day card expand: spring animation
- Tap feedback: subtle scale or ripple
- Completion animations: satisfying tick/star burst
- Modal: slide up or fade in
- Reduced motion: all animations respect OS reduced motion preference

---

## 7. Orientation — Portrait & Landscape

Nestor supports both portrait and landscape orientations natively. This is not a rotation of the same layout — each orientation has a purposefully designed layout appropriate to its dimensions.

### When Each is Used

**Portrait (primary design target)**

- Tall narrow canvas — wall mounted vertically
- Ideal for hallways, kitchens, beside the front door
- Day carousel works naturally across the width
- Bottom navigation bar

**Landscape**

- Wide short canvas — wall mounted horizontally or on a countertop stand
- Repurposes existing landscape TVs or monitors
- Under-cabinet kitchen mounting
- More information visible simultaneously
- Side navigation rail

### Orientation Detection

- Detected automatically from screen dimensions at startup
- Overrideable in Admin → Display
- Layout reflows without restart on change

### Layout Differences by Orientation

| Component                 | Portrait                          | Landscape                         |
| ------------------------- | --------------------------------- | --------------------------------- |
| Navigation bar            | Bottom, horizontal, large buttons | Left side, vertical icon rail     |
| Day carousel              | Horizontal strip, full width      | Condensed top strip               |
| Left sidebar filters      | Fixed left panel                  | Collapses to top filter strip     |
| Plugin widget strip       | Below carousel                    | Right column                      |
| Modals                    | Slide up from bottom              | Centre overlay                    |
| Recipe view               | Single column                     | Two column (ingredients + method) |
| Alerts strip              | Above carousel                    | Top of screen                     |
| Child/toddler reward view | Full screen portrait              | Two column landscape              |

### Shared Behaviour

- All functionality identical in both orientations
- All data and state identical
- Touch target sizing requirements identical
- Screensaver identical
- All plugins work in both orientations

### Design Phase Note

Both orientations to be designed simultaneously in the UI design phase — landscape is not an afterthought. Component decisions inform each other.

---

## 8. Screen Layout & Navigation

### Screen Sleep & Brightness

- **Active:** full brightness
- **Idle (default 90s, configurable):** software dim overlay, screensaver activates
- **Extended idle (default 10min, configurable):** OS-level DPMS sleep
- **Wake:** any touch restores instantly
- **Night mode:** dark theme + auto-dim after configurable time, restore in morning
- Brightness control via `ddcutil` or direct backlight interface

### Navigation Bar

- Large touch-friendly buttons
- Portrait: fixed at bottom, horizontal
- Landscape: fixed on left side, vertical icon rail
- **Configurable layout (portrait):**
  - Single row (up to 6 modes)
  - Double row (up to 10 modes)
  - Scrollable single row
  - Hamburger overflow
- Active mode highlighted with accent colour
- Unread alert badge on relevant mode button
- All modes hideable — unused sections removed from nav entirely

### Default Nav Modes

| #   | Icon | Label             | Contents                                           |
| --- | ---- | ----------------- | -------------------------------------------------- |
| 1   | 🏠   | Home              | Day carousel, alerts, weather, status widgets      |
| 2   | 📅   | Calendar          | Day / week / month views                           |
| 3   | 🍽️   | Food              | Meal planner, recipe library, shopping list        |
| 4   | 🚗   | Vehicles & Travel | Vehicle booking, reminders, commute, disruptions   |
| 5   | 👨‍👩‍👧   | Family            | Children's profiles, health, chores, routines      |
| 6   | 🏠   | House             | Chores, bin day, bills, maintenance, subscriptions |
| 7   | 💰   | Finance           | Agreements, loans, monthly commitments             |
| 8   | 🐾   | Pets              | Pet profiles, health, vaccinations, vets           |
| 9   | ⚡   | EV & Energy       | EV widget, charging log, meter readings            |
| 10  | 💬   | Board             | Messages, whiteboard, countdowns, lists            |

All modes configurable — hidden, reordered, renamed.

---

## 9. Home Screen

### Left Sidebar (Portrait) / Top Strip (Landscape)

Persistent filter panel:

- Profile colour-coded toggles per household member
- Pet filter per pet
- Vehicle filter
- "All" reset shortcut
- Plugin-registered filters

### Alerts Strip

Dismissible strip. See Section 21 for full alert types.

### Main Pane — Day Carousel

**Portrait:**

```
[Yesterday — thin] | [TODAY — large ~50%] | [+1] [+2] [+3] [+4] — thin
```

**Landscape:**

```
[Yest] [TODAY — wider] [+1] [+2] [+3] [+4] — condensed top strip
```

- Swipe left/right to move focal day with smooth animation
- "↩ Back to Today" when browsing away
- Tap thin day → becomes focal
- Tap focal day → full screen day view
- Tap event → detail modal
- Long press empty → quick add event

**Each day card contains:**

- Date and day name
- Mini weather widget (condition, high/low, precipitation, UV index)
- Events colour coded by profile
- WFH / in-office / shift indicator per adult
- Nursery/school drop-off and pickup if applicable
- Vehicle booking indicator
- Pet vet appointments if pet filter active

### Plugin Widget Strip

Widgets registered by active plugins. Hidden if no plugins active.

### Journey Time Widget

- Saved routes per adult
- Live journey time from configured transport API
- Configurable per person per day of week

---

## 10. Calendar

### Views

- Carousel (Home) — default
- Day view — full screen timeline
- Week view — 7-day colour-coded grid
- Month view — grid with event dots

### Features

- Colour coded per profile
- Filter toggles in sidebar
- Tap event → detail modal
- Quick add via empty slot tap
- Recurring events
- Term dates import (school, nursery)
- Inset day alerts

### Calendar Sync

- iCal/CalDAV universal layer
- Google Calendar: CalDAV + OAuth2
- Apple iCloud: CalDAV + app-specific password
- Yahoo: CalDAV endpoint
- Configurable sync interval (default 15 minutes)
- Multiple calendars per provider
- Community extensible for additional providers

### Special Entry Types

- WFH / In Office / Shift — day-level indicator per adult
- Nursery/school drop-off/pickup — top of day card
- Vehicle bookings — vehicle filter overlay
- Vet appointments — pet filter with pet icon
- Pet booster/treatment due — calendar reminders
- Finance agreement end dates — flagged in calendar
- Custody schedule — configurable sensitive entry type for blended families

---

## 11. Food — Meal Planner & Recipe Library

### Meal Planner

- 7-day grid (Mon–Sun)
- Configurable meal slots (default: Breakfast, Lunch, Dinner — names and count configurable)
- Tap slot → browse recipes or free text
- Tap filled slot → full recipe view
- Drag and drop between slots (stretch goal)

### Recipe Library

- Manual entry: title, description, ingredients, method, times, servings, tags, photo
- Search and filter by name, tag, ingredient
- Full screen recipe view with ingredient checklist
- Add to meal plan button
- Add to shopping list — per ingredient or all at once

### Recipe URL Import

- Paste URL → Schema.org JSON-LD extraction
- Ingredient parsing: `{ quantity, unit, ingredient, notes }`
- User reviews pre-filled form before saving
- Falls back to manual entry if no structured data found

### Shopping List

- Structured items: name, quantity, unit, category
- Configurable shop section categories
- Tick off while shopping
- De-duplicates and combines quantities across recipes
- Shared across all home network devices

---

## 12. Vehicles & Travel

### Vehicle Profiles

Nestor supports any number of vehicles of any type. No assumption of a single car.

Each vehicle profile includes:

- Name / nickname (e.g. "The Golf", "Dad's Van")
- Type: Car, Van, Motorcycle, Bicycle, Other
- Colour (used in UI)
- Registration (optional)
- Insurance renewal date
- Breakdown cover renewal date

**Car / Van specific:**

- MOT due date
- Service due (date or mileage)
- Road tax renewal date
- Fuel type (petrol, diesel, hybrid, electric)
- If electric: links to EV plugin if installed
- Fuel log (fill-up date, litres, cost, mileage) — for non-EV vehicles
- MPG / efficiency tracking

**Bicycle specific:**

- Service reminder
- Tyre pressure log
- Insurance renewal (if applicable)
- No MOT equivalent

### Vehicle Booking Calendar

- Any registered vehicle can be booked
- Who has which vehicle and when
- Conflict detection with warning
- Overlay on main calendar via vehicle filter
- Road trip days auto-block vehicle

### Vehicle Reminders

- MOT, service, road tax, insurance — N days advance warning each
- Surfaced in alerts strip and House section

### Commute & Travel

- **Configurable transport API layer** — not hardcoded to UK services
- Default UK integrations: National Rail, Transport for England, road traffic
- Community can add regional APIs (Deutsche Bahn, SNCF, MTA etc.) via the transport adapter interface
- Journey time widget per adult on Home Screen
- Parking quick note field
- Saved journey shortcuts

---

## 13. Family — Children & Health

### Children's Profiles

Each child has age-appropriate features as defined in Section 5. The Family section surfaces child-specific features for admin users.

### Nursery / School Schedule

- Recurring drop-off and pickup per day per child
- Date-specific overrides (bank holidays, illness, closures)
- Term dates import per child
- Inset day alerts
- Multiple children at different schools/nurseries supported

### Nursery / School Bag Checklist

- Per child, per day of week
- Auto-resets daily
- Uses shared Checklists system (Section 19)

### Medicine & Health Log

- Per profile (children and adults)
- Log: date/time, medicine, dosage, reason
- Temperature log with trend
- Symptom notes (timestamped)
- Scrollable timeline view
- Exportable summary for GP / hospital visits
- **Chronic illness support** — multiple active conditions per profile, ongoing medication schedules, frequent appointment tracking

### Baby-Specific Tracking

- Feed log: time, type (breast/bottle), duration/amount
- Nappy change log: time, type
- Sleep log: start, end, total
- Growth log: weight, length, head circumference with percentile chart
- Milestone tracker with suggested milestones by age
- NHS vaccination schedule reminders (dense in first year)

### Chores & Rewards

- Assign chores per child profile
- Age-appropriate UI per profile type (simple tap for toddler, full task view for child/teen)
- Star / point reward system
- Visual progress — star grid filling up
- Streak tracking
- Configurable reward targets
- Points redemption log
- Teen allowance tracker — points convertible to configurable monetary value

### Children's Routines

- Bedtime and morning routine checklists per child
- Auto-resets daily
- Satisfying step-by-step completion UI

### Mood & Wellbeing Log (Optional)

- Simple daily mood check-in per family member
- Discreet — not prominent, accessed privately
- Useful for tracking patterns over time
- Available to teens and adults — not surfaced for younger children

---

## 14. House — Household Management

### Household Chores Rota

- Assign recurring tasks to adult household members
- Frequency: daily, weekly, monthly, custom
- Mark done, overdue indicator
- Separate from children's chores/rewards

### Bin Day — Configurable Collection Schedule

Bin schedules vary significantly by location. Everything is configurable.

**Per bin configuration:**

- Name — free text with suggestions (General Waste, Recycling, Food Waste, Garden Waste, Glass etc.)
- Colour — colour picker with common council colours as presets
- Icon — small set of relevant options
- Collection day — Mon–Sun
- Frequency — weekly, fortnightly, every 4 weeks
- Anchor date — a known past collection date to anchor alternating cycles
- Bank holiday shift — toggle: "does your council shift by one day for bank holidays?"

**How alternating schedules work:**
The system calculates all future collection dates from the anchor date and frequency. No manual entry of individual dates required.

**Number of bin types:** Unconstrained — add as many as needed. Defaults to none — fully built from scratch during setup.

**UI behaviour:**

- Coloured bin icon(s) on relevant day cards in carousel
- Colour matches configured bin colour
- Alerts strip: "🟢 Recycling bin out tomorrow"
- House section: rolling upcoming collections list
- Reminder timing configurable: evening before, morning of, or both
- Audio chime option

**Future enhancement (community):**

- Council iCal subscription — many UK and international councils publish bin collection calendars as iCal URLs. Nestor could subscribe to these automatically, eliminating manual config and handling bank holidays automatically. Documented as a Phase 2 community contribution opportunity.

### Bills & Payment Reminders

- Alert-style reminders — not financial tracking
- N days advance per bill
- Distinct from Finance & Commitments section

### Budget Tracker

- Monthly household budget figure
- Quick-add expenses by category
- Configurable categories
- Spend vs budget visual per category
- Data model accepts future automated transaction input

### Subscription Tracker

- Name, monthly cost, renewal date, category
- Running monthly total
- Renewal and trial cancel reminders

### Home Maintenance Log

- Log completed jobs
- Warranty tracker with expiry reminders
- Scheduled maintenance reminders
- Tradesperson contacts linked from Contacts

**Renter adaptations:**

- "Report to landlord" flag on maintenance items instead of "book tradesperson"
- Tenancy renewal date reminder
- Deposit protection expiry reminder
- Move-in/move-out inventory checklist template

**Rural household additions:**

- Heating oil tank level log and delivery reminders
- Septic tank service reminders
- Log delivery reminders (firewood, coal, animal feed)
- Well / water system maintenance reminders

### Energy & Meter Readings

- Gas and electricity meter log
- Monthly reading reminder on configurable date
- Usage chart over time
- Configurable rates per fuel type (p/kWh, p/litre for oil etc.)
- Rates used by EV charging cost calculations

### Contacts & Useful Numbers

See Section 20.

---

## 15. Finance & Commitments

A dedicated section for awareness of committed monthly outgoings. Not a full accounting tool.

### Finance Agreements

- Car finance / PCP: monthly payment, remaining balance, end date, balloon payment
- Personal loans: lender, monthly payment, remaining term, end date
- Buy Now Pay Later: retailer, amount, monthly payment, end date
- Mortgage: monthly payment, fixed rate end date
- Any other credit agreements

### Regular Commitments

- Rent, savings contributions, pension, childcare fees, any standing commitments

### Subscriptions (Finance View)

- Pulled from Subscription Tracker in House — single source, two views

### Monthly Outgoings Summary

```
MONTHLY COMMITMENTS

Finance Agreements        £XXX / month
Subscriptions             £XX / month
Insurance                 £XX / month
Regular Commitments       £XXX / month
──────────────────────────────────────
Total committed           £XXX / month
```

- Expandable per category
- End dates flagged with colour indicator
- Currency configurable (see Section 26)

### Savings Goals

- Named savings goals: "Holiday fund", "New car", "Emergency fund"
- Target amount and current amount
- Visual progress bar
- Optional link to countdown timer

### Debt Tracker (Optional)

- Track finance agreement paydown visually
- Motivational — seeing balance reduce over time
- Snowball or avalanche method display (stretch goal)

### Benefits & Regular Income Reminders

- Universal Credit payment schedule
- Child benefit payment dates
- Tax credit renewal reminders
- Any regular income event worth tracking

### End Date Alerts

- Mortgage fixed rate — N months advance (suggested 6)
- Finance agreement ending — N months advance (suggested 3)
- Insurance renewal — N weeks advance (suggested 4)
- All in alerts strip and Finance section header

---

## 16. Pets

### Pet Profiles

- Name, species, breed, DOB/age, photo
- Microchip number, insurance details
- Vet and emergency vet contact
- Feeding schedule, dietary notes, allergies
- Grooming schedule
- Pet sitter and kennel contacts

### Health & Vaccinations

- Booster tracker with advance reminders
- Flea/tick/worming log with reminders
- Weight log
- General health notes
- Active medication log and daily reminders
- Dose logging

### Vet Appointments

- Log to calendar
- Pet filter in sidebar
- Post-visit notes and follow-up

### Documents

- Upload vaccination certs, insurance, pet passport

---

## 17. EV & Energy

> Live EV vehicle data via Tesla Plugin (Section 32.1). This section covers core energy features.

### Home Charging Log (Core)

- Manual log: date, kWh, cost
- Configurable electricity rate
- Cumulative monthly and annual cost chart

### Energy Overview (Core)

- Combined fuel meter view
- Home charging cost contribution
- Monthly energy cost summary

---

## 18. Board — Communication & Notes

### Family Message Board

- Sticky note style, profile colour coded, timestamped
- Dismiss / archive

### Whiteboard

- Freehand drawing canvas (touch and stylus)
- Text notes, named snapshots

### Countdown Timers

- Named countdowns with days remaining
- Optional Home Screen widget strip

### General Lists

- Named lists, tick off, reusable templates

---

## 19. Checklists

Unified checklist system underpinning multiple features.

### Types

- Daily auto-reset, trip-based, one-off, recurring

### Features

- Named checklists, any number of items
- Satisfying tick animation
- Auto-reset on schedule or manually
- Templates — start from pre-built
- Reuse and duplicate

### Built-in Templates

- Nursery bag (daily)
- Morning routine
- Bedtime routine
- Holiday packing
- Day trip bag
- Guest arrival
- Guest departure
- New baby essentials
- Camping trip
- Move-in inventory (for renters)
- Move-out inventory (for renters)
- Winter / seasonal home prep
- Community contributed templates via GitHub PRs

### Guest Visitation Checklist

**Pre-Arrival:** Make beds, fresh towels, clear wardrobe/drawers, empty bedside table, spare charger, fresh toiletries, clear hooks, restock toilet roll, check heating, clear fridge space, write WiFi password

**Features:**

- Guest name field
- Arrival date field
- Alert N days before if checklist incomplete
- Link to "Guest Visit" calendar event type
- Multiple guest room profiles

**Post-Departure:** Strip beds, wash linen/towels, air room, replace toiletries, clear fridge, restore layout

---

## 20. Contacts

- Categories: Medical, Nursery/School, Pets & Vet, Home Services, Emergency, Family & Friends, Tradespeople
- Fields: name, role, phone, notes
- Tap to call if audio hardware present
- Referenced from Pet profiles, Home Maintenance, other sections
- Useful for babysitters, grandparents, carers using the screen
- **Shared house variant:** Housemate contacts, building management, landlord

---

## 21. Alerts System

Unified dismissible strip on Home Screen with nav mode badges.

### Core Alert Sources

| Category         | Examples                                                  |
| ---------------- | --------------------------------------------------------- |
| Travel           | Disruptions on saved routes                               |
| Weather          | Severe warnings, frost, high UV, rain on outdoor events   |
| Bills            | Due in N days                                             |
| Vehicles         | MOT, road tax, insurance renewal per vehicle              |
| Pet health       | Vaccination, flea treatment, active medication            |
| Home maintenance | Scheduled job due, warranty expiring                      |
| Subscriptions    | Renewal due, trial expiring                               |
| Finance          | Mortgage rate ending, agreement ending, insurance renewal |
| Savings          | Goal milestone reached                                    |
| Benefits         | Payment due, renewal reminder                             |
| Guests           | Arriving in N days — checklist incomplete                 |
| Bin day          | Collection tomorrow                                       |
| Energy           | Meter reading due                                         |
| Baby             | Feed/nappy/sleep log overdue (if tracking active)         |

### Plugin Alert Sources

- EV not plugged in / charge low (Tesla)
- Camera motion / doorbell ring (Eufy)
  | Vacuum status (Eufy)
- Garden task due (Garden Pal)
- AI assistant status (AI Assistant)

### Alert Behaviour

- Colour coded by severity
- Individually dismissible
- Badge count on relevant nav mode
- Optional audio chime per category
- Doorbell ring → full-screen camera feed (Eufy plugin)

---

## 22. Voice & Audio — Core

All voice and audio processing runs locally. Plugins register as handlers and can trigger TTS through the core audio layer.

### Hardware

- USB speakerphone or separate USB mic + speaker
- Omnidirectional mic recommended
- Jabra Speak 410 or Anker PowerConf S330 recommended

### Wake Word Detection

- OpenWakeWord — open source, fully local
- Custom wake word chosen during setup wizard
- Trained with ~20–30 voice samples (~30 minutes)
- Visual "listening" indicator on wake
- Hub name and wake word stored in core settings — not plugin-specific

### Speech to Text

- OpenAI Whisper — open source, fully local
- Activated after wake word
- Transcribed text passed to voice command router

### Voice Command Router (Core)

Built-in commands (no plugin required):

- Navigation: "Go to calendar / food / family / house / board"
- "Show today / tomorrow / this week"
- "Back to home"
- "What time is it?" / "What day is it?"
- Falls through to plugin handlers for unmatched commands

### Text to Speech

- Piper TTS — open source, fully local, multiple natural voices
- Used for command confirmations and plugin announcements
- Available to all plugins via `tts_announcements` capability
- Voice and speed configurable in admin

### Plugin Voice Integration

```json
"capabilities": ["voice_handler", "tts_announcements"]
```

---

## 23. On-Screen Keyboard

### Phase 1 — OS Level

- Onboard for Linux — auto-appears on text field focus
- Portrait and landscape optimised layouts
- Zero application code changes required

### Phase 2 — Custom In-App Keyboard

- React component matching Nestor theme
- Compact and full modes
- Number pad for numeric inputs
- Autocomplete for shopping and common entries
- Pushes content up, dismisses on outside tap

---

## 24. Screensaver

- Activates after configurable idle period (default 90s)
- Family photo slideshow with Ken Burns effect
- Local photo folder, optionally synced via Syncthing
- Any touch exits immediately
- Very low brightness during night mode hours

---

## 25. Remote Access

- Tailscale VPN — optional, zero code changes required
- Full dashboard from anywhere via browser
- No cloud backend, no ongoing costs
- Setup documented as optional installation step

---

## 26. Internationalisation & Localisation

Nestor is built for global use from day one. All user-facing text, formats, and region-specific integrations are configurable.

### Architecture

- **i18next** — industry standard i18n library for React and Node.js
- All user-facing strings stored in language JSON files — no hardcoded English text in components
- Community can contribute language packs via GitHub PRs
- Language selected during setup wizard

### Locale Settings (Configurable in Admin → Localisation)

| Setting                  | Options                                |
| ------------------------ | -------------------------------------- |
| Language                 | English (default), community additions |
| Date format              | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD     |
| Time format              | 12-hour, 24-hour                       |
| First day of week        | Monday, Sunday, Saturday               |
| Currency                 | GBP, USD, EUR, and all ISO 4217 codes  |
| Currency symbol position | Before or after amount                 |
| Temperature units        | °C, °F                                 |
| Distance units           | km, miles                              |
| Volume units             | Litres, gallons (US/UK)                |
| Number format            | 1,000.00 or 1.000,00                   |

### Right-to-Left (RTL) Support

- Layout mirrors for RTL languages (Arabic, Hebrew, etc.)
- Significant but important for global adoption
- Planned from architecture stage — RTL is difficult to retrofit
- Documented as a Phase 2 community contribution

### Region-Specific Integrations

UK-specific APIs are abstracted behind configurable interfaces:

| Feature                | UK Default           | Community Alternatives                  |
| ---------------------- | -------------------- | --------------------------------------- |
| Travel disruptions     | National Rail, TfL   | Deutsche Bahn, SNCF, MTA, VIA Rail etc. |
| Weather warnings       | Met Office           | NOAA, DWD, Météo-France etc.            |
| Bin collection iCal    | UK council feeds     | International council feeds             |
| Vehicle MOT equivalent | DVSA MOT             | TÜV (DE), CT (FR), WOF (NZ) etc.        |
| School term dates      | UK academic calendar | Configurable custom dates               |

### Calendar Systems

- Gregorian default
- Overlay support for additional calendar systems (Hijri, Hebrew, Hindu) — community plugin opportunity
- Display both simultaneously for relevant households

### No Hardcoded UK Assumptions

- No hardcoded currency symbols, units, or date formats
- No hardcoded UK-specific API endpoints
- All region-specific features documented clearly as UK defaults with community extension points

---

## 27. Accessibility

Nestor is designed to be usable by people of all abilities and ages — from toddlers tapping reward stars to elderly grandparents checking the day's events.

### Text Size

- Configurable base text size: Small, Default, Large, Extra Large
- Applied globally across the entire interface
- Per-profile text size setting — grandparent profile can have larger text without affecting admin view

### Contrast & Visual

- High contrast mode — increases text/background contrast ratio throughout
- Dark mode — available as manual toggle or auto during night mode
- Colour blind friendly palette option — replaces default profile colours with colour-blind accessible alternatives
- No information conveyed by colour alone — always paired with icon or text

### Navigation Simplification

- Simplified navigation mode — fewer nav modes, larger buttons, reduced information density
- Applicable per profile — grandparent or less tech-comfortable users get a simpler view
- Child profiles already use simplified age-appropriate UI

### Touch & Motor

- All tap targets meet minimum 44×44px (Apple HIG) — typically much larger
- No gestures that require precision
- Swipe gestures always have a tap alternative
- Long press alternatives for all long-press actions

### Screen Reader

- Semantic HTML and ARIA labels throughout
- Screen reader compatibility — stretch goal, documented as a community contribution opportunity

### Reduced Motion

- All animations respect OS-level reduced motion preference
- Motion-sensitive users can disable all transitions

### Cognitive Accessibility

- Plain language throughout — no jargon
- Consistent UI patterns — same action always in same place
- Undo available for destructive actions
- Confirmation dialogs for irreversible actions

---

## 28. Household Scenarios

Nestor is designed to work well for a wide range of household types. This section documents how configuration accommodates different setups.

### Families with Children (All Ages)

- Core use case — fully supported across all age groups from baby to teenager
- Multiple children at different schools, different chore/reward systems
- See Section 5 (Profiles) and Section 13 (Family) for full detail

### Couples / No Children Households

- All child-related nav modes hidden in settings
- Pets, Food, Finance, House, and Board become the primary sections
- Countdown timers for holidays and events still highly useful
- Simpler profile setup — two admin profiles

### Single Person Households

- Single admin profile
- Guest/Carer profile useful for anyone with keys or regular access
- Finance section particularly valuable
- Shopping and meal planning for one — portion configurator in recipes

### Multigenerational Households

- Grandparent profile type with configurable permissions
- Accessibility settings per profile
- Multiple admin profiles (parent + grandparent both need full access)
- Medication tracking for multiple generations
- Multiple vehicle profiles

### Blended Families

- Children who split time between two homes — "with us this week" toggle per child profile
- Custody schedule calendar entry type
- Separate chore/reward systems per household
- Contacts include other household's key numbers

### Shared Houses / Student Households

- Multiple equal admin profiles (all housemates)
- No child sections — hidden entirely
- Shared shopping list is the primary feature
- Bill splitting awareness in Finance section
- Chore rota between housemates
- Board / message board for household communication
- No family calendar — shared household calendar instead

### Renters

- Home maintenance adapted — "report to landlord" flag
- Tenancy renewal and deposit protection reminders
- Move-in/move-out inventory checklists
- Landlord and letting agent in Contacts

### Rural Households

- Heating oil, septic tank, water system, log delivery reminders in House section
- Travel disruption less relevant — journey planner more relevant
- Farming household features — seasonal task calendars, livestock reminders (community plugin opportunity)

### Shift Workers

- WFH/office toggle extended to support shift patterns
- Shift schedule type: early/late/night with configurable hours
- "Quiet hours" setting — alerts silenced when household member is sleeping after night shift
- Shift handover notes in Board section

### Freelancers / Self-Employed

- Separate business calendar filter
- Invoice due date reminders in Finance section
- Tax return reminder (configurable date — January 31st UK, April 15th US etc.)
- Mileage log per vehicle for business travel

### Households with Chronic Illness or Disability

- Medication tracker is prominent and reliable — multiple medications, complex schedules
- Frequent appointment tracking
- Symptom diary over time
- Accessibility settings (larger text, high contrast, simplified nav)
- Equipment maintenance reminders (wheelchair service, hearing aid batteries)
- Carer profile for paid or volunteer carers

---

## 29. Installation & Distribution

A smooth installation experience is a core feature of Nestor — not an afterthought.

### Single-Line Install Script

```bash
curl -fsSL https://get.nestor.app/install.sh | bash
```

Installs: Node.js, SQLite, Chromium, Onboard, Piper TTS, Whisper, OpenWakeWord, clones repo, sets up systemd services, configures kiosk mode, sets orientation, launches wizard on first boot.

### First Boot Setup Wizard

Full-screen guided wizard. All steps skippable and re-accessible from Settings → Setup & Help.

**Steps:**

1. Welcome & language selection
2. Timezone and locale (date format, currency, units, temperature)
3. Household profiles — add members, assign colours
4. Calendar sync — connect accounts via QR code OAuth flow
5. Display & brightness — idle timeout, night mode
6. Orientation — portrait or landscape, confirmed by display
7. Voice setup — optional; record wake word samples, name your Nestor
8. Features — toggle which nav modes to show
9. Plugins — browse and install official plugins
10. Done — summary with links to anything skipped

### In-App Updates

- Nightly GitHub Releases API poll
- Update badge in admin when available
- Tap to update: pull, migrate, restart
- Previous version retained for one cycle as rollback
- DB migrations via numbered SQL files — updates never break data

### Plugin Installation

- **Official plugins:** in `/plugins` directory, toggle in admin
- **Community plugins:** admin browse → install from GitHub directory
- **Manual (developers):** drop folder into `/plugins`, restart

### Setup & Help (Settings)

```
Settings → Setup & Help
  ├── ✅ Household Profiles
  ├── ✅ Calendar Accounts
  ├── ✅ Localisation
  ├── ⚠️  Voice Setup (incomplete)
  ├── ✅ Display & Brightness
  ├── Plugins
  │     ├── Installed (toggle, configure)
  │     └── Browse & Install
  ├── Remote Access (Tailscale guide)
  └── System (updates, backup, factory reset)
```

Completion indicators: ✅ configured, ⚠️ partial, ○ skipped.

### Pre-Built Disk Image (Future)

- Flashable Ubuntu + Nestor image
- Download, flash to SSD, boot straight to wizard
- Target: available once core is stable

---

## 30. Admin & Settings

PIN-protected option for kiosk security.

### Profiles

- Add, edit, remove all household profiles
- Set name, colour, avatar, role, permissions
- Assign calendars per profile
- Per-profile accessibility settings (text size, contrast)
- Per-profile simplified navigation toggle

### Localisation

- Language, date/time format, currency, units, temperature
- First day of week
- Number format
- RTL toggle (Phase 2)

### Calendar

- CalDAV accounts — add, remove, map to profiles
- Sync frequency
- WFH / shift schedule per adult per day

### Display & Behaviour

- Orientation (portrait / landscape / auto)
- Idle timeouts, night mode times
- Dark mode toggle or auto
- Screensaver photo folder and transition speed

### Navigation

- Nav bar layout, mode visibility, order, default screen

### Food & Recipes

- Meal slot names and count per day
- Shopping list categories

### Household

- Bin schedule configuration (full bin setup UI)
- Notification advance days per reminder type
- Alert audio chimes per category

### Vehicles

- Add, edit, remove vehicle profiles
- Per-vehicle MOT/service/tax/insurance dates
- Fuel log settings
- Transport API configuration (regional selection)

### Finance

- End date warning thresholds
- Savings goal management
- Currency and display settings (from Localisation)

### Energy & Budget

- Fuel rates (electricity, gas, oil)
- Monthly budget figure

### Voice & Audio

- Hub name for TTS responses
- Wake word re-training
- TTS voice and speed
- Speaker volume
- Quiet hours configuration

### Accessibility

- Base text size
- High contrast mode
- Colour blind palette
- Reduced motion
- Simplified navigation

### Plugins

- Installed plugins — status, enable/disable, configure
- Browse community plugins
- Plugin developer documentation link

### System

- App version and update
- Export / import JSON backup
- Factory reset
- Tailscale status and setup
- Syncthing status and setup

---

## 31. Plugin System

### Philosophy

Core = universal. Plugins = brand-specific, device-specific, niche, or regional.

### Architecture

```
/plugins
  /tesla/
    manifest.json
    plugin.js
    widget.jsx
    settings.jsx
    README.md
  /eufy/
  /garden-pal/
  /ai-assistant/
```

### Plugin Manifest

```json
{
  "id": "plugin-id",
  "name": "Display Name",
  "version": "1.0.0",
  "author": "Author",
  "description": "What this plugin does",
  "capabilities": ["home_screen_widget", "alert_source"],
  "settingsFields": [],
  "apiRisk": "official | unofficial | none"
}
```

### Plugin Capabilities

| Capability           | Description                                 |
| -------------------- | ------------------------------------------- |
| `home_screen_widget` | Home screen plugin strip widget             |
| `alert_source`       | Push alerts to alerts strip                 |
| `nav_mode`           | Add or contribute to a nav mode             |
| `calendar_source`    | Inject events into calendar                 |
| `sidebar_filter`     | Add filter toggle to sidebar                |
| `voice_handler`      | Receive unmatched voice commands            |
| `tts_announcements`  | Push text to TTS queue                      |
| `settings_panel`     | Add config to admin                         |
| `transport_adapter`  | Provide regional travel disruption data     |
| `calendar_system`    | Provide alternative calendar system overlay |

### Community Plugin Categories

Opportunities for community development:

- **Regional transport:** Deutsche Bahn, SNCF, MTA, VIA Rail, Sydney Trains etc.
- **Smart home:** Home Assistant, Philips Hue, IKEA Tradfri, Ring, Nest
- **EV brands:** Volkswagen ID, BMW, Hyundai, Rivian etc.
- **Camera/security brands:** Ring, Arlo, Reolink, Wyze etc.
- **Energy providers:** Octopus Energy, National Grid, regional smart tariffs
- **Religious calendars:** Hijri, Hebrew, Hindu calendar overlays
- **Farming/rural:** Seasonal task calendars, livestock reminders, agricultural weather
- **Financial:** Open Banking (Monzo, Starling), investment trackers
- **Health:** NHS App integration, pharmacy reminders, repeat prescription alerts
- **Local services:** Council bin collection iCal by region, local school feeds

### Plugin Security

- Server-side Node.js within application process
- Credentials in local SQLite, never transmitted externally
- API risk level documented per plugin
- Community plugins clearly marked

### Community Plugin Directory

- GitHub JSON index
- Submit via PR with manifest
- Contribution template and developer docs provided

---

## 32. Official Plugins

### 32.1 Tesla Plugin

**Purpose:** Live EV status, home charging, vehicle control.
**Integration:** Tesla unofficial API via `teslajs` or `tesla-api`.
**Risk:** Unofficial — may break on firmware updates. Documented.

**Features:** Battery %, range, charging status, home/supercharger detection, cumulative home charging cost, session log, climate pre-conditioning, "not plugged in" alert, low charge alert.

**Home Screen Widget:** Battery arc, range, charging status, climate button
**TTS:** "Your car is fully charged" / "Car not plugged in"

---

### 32.2 Eufy Plugin

**Purpose:** Camera feeds, doorbell alerts, vacuum control.
**Integration:** `eufy-security-client` (community reverse-engineered).
**Risk:** Unofficial — documented.

**Cameras:** Motion alerts, tap to full-screen live feed, multiple cameras.

**Doorbell:** Ring detection, audio alert, auto-open feed on ring (configurable), missed ring log, motion alerts, two-way audio (stretch goal).
**TTS:** "Someone at the front door"

**RoboVac:** Vacuuming/Docked/Needs Emptying/Error status, Start/Stop/Dock controls, "needs emptying" alert.
**TTS:** "The vacuum needs emptying"

**Home Screen Widget:** Last ring timestamp + vacuum status

---

### 32.3 Garden Pal Plugin

**Purpose:** Surface Garden Pal tasks and events within Nestor.
**Background:** Separate paid app (free tier) by same developer. Full transparency in docs. Reference plugin implementation.
**Integration:** Garden Pal REST API — spec to be written separately.
**Capabilities:** `calendar_source`, `sidebar_filter`, `home_screen_widget`, `alert_source`

> Garden Pal is an official integration built by the Nestor developer. It is a separate paid application with a free tier. The plugin is free and open source. No Nestor features require Garden Pal.

---

### 32.4 AI Assistant Plugin

**Purpose:** Conversational AI answering general questions and reading/writing Nestor data.
**Integration:** Google Gemini API (free tier — 1,500 req/day).
**Privacy:** Voice transcribed locally by Whisper. Transcribed text (not audio) sent to Gemini. Users informed during setup.
**Capabilities:** `voice_handler`, `settings_panel`

**How it works:**

1. Wake word → Whisper transcribes locally
2. Voice router checks built-ins → no match
3. AI plugin builds context-aware prompt with relevant Nestor data
4. Gemini returns response text
5. Piper TTS speaks response, screen shows chat bubble

**Context layer includes:** Today's calendar, meal plan, vehicle status, shopping list, pet medications, finance summary, chore status.

**Example commands:**

- General: "Tell me a joke", "What's the capital of France?"
- App-aware: "What have we got on this week?", "What's for dinner?", "Do we have the car Saturday?"
- App-controlling: "Add eggs to the shopping list", "Book the car for Saturday morning"
- Plugin-aware: "Show the front door camera", "Start the vacuum", "What's the car battery?"

**Command history** log in admin panel.

---

## 33. Open Source Considerations

- GitHub under MIT licence
- Clear README: hardware guide, install, first-boot walkthrough
- Single-line install script
- Docker image alternative
- Environment variable config — no hardcoded secrets
- Plugin developer docs and contribution template
- Community plugin directory (GitHub JSON index)
- Language packs contributed via PRs
- Checklist templates contributed via PRs
- Hardware compatibility notes maintained by community
- Regional transport adapter documentation
- Contribution guidelines, PR process, issue templates
- Changelog, semantic versioning
- Plugin API versioned independently

---

## 34. Competitive Context

### Primary Comparable Product

**Cozyla** — CalendarOS on proprietary Android touchscreen hardware.

### How Nestor Differs

| Feature                    | Cozyla         | Nestor              |
| -------------------------- | -------------- | ------------------- |
| Open source                | ❌             | ✅                  |
| Self-hosted / local first  | ❌ Cloud       | ✅                  |
| Any hardware               | ❌ Proprietary | ✅ Any Linux device |
| No subscription            | Partial        | ✅ Free             |
| Portrait & landscape       | Portrait only  | ✅ Both             |
| Plugin system              | ❌             | ✅                  |
| EV integration             | ❌             | ✅ Tesla plugin     |
| Camera / doorbell          | Limited        | ✅ Eufy plugin      |
| Pet section                | ❌             | ✅                  |
| AI assistant               | Limited cloud  | ✅ Gemini plugin    |
| Custom wake word           | ❌             | ✅                  |
| Local voice processing     | ❌             | ✅                  |
| Recipe URL scraping        | Basic          | ✅                  |
| Finance commitments        | ❌             | ✅                  |
| Home maintenance           | ❌             | ✅                  |
| Configurable bin schedules | ❌             | ✅                  |
| Multiple vehicle types     | ❌             | ✅                  |
| Profile types (baby→teen)  | Limited        | ✅ Full range       |
| Internationalised          | Limited        | ✅                  |
| Accessibility features     | Limited        | ✅                  |
| Multiple household types   | Limited        | ✅                  |
| One-line install           | ❌             | ✅                  |
| Community plugins          | ❌             | ✅                  |

### Positioning Statement

> Nestor is a free, open source, self-hosted household dashboard for large touchscreens. Like Cozyla — but on your own hardware, with your own data, no subscription, and built for every kind of household.

### Name & Origin

> Named after Nestor, the wise counsellor of Greek mythology — always present, always helpful, keeping everything in order.

---

## 35. Out of Scope for Initial Release

- Native mobile app (browser via Tailscale sufficient)
- Cloud hosted backend
- App store distribution
- Full Open Banking integration (Monzo webhooks as community extension)
- Apple HomeKit / Google Home / Alexa (community plugin)
- Ring doorbell plugin (community plugin)
- Nest thermostat plugin (community plugin)
- Octopus Energy plugin (community plugin)
- RTL language support (Phase 2 community contribution)
- Alternative calendar systems / religious calendar overlays (community plugin)
- Screen reader full compatibility (community contribution)
- Farming / rural community plugin
- Recipe scraping — self-hosters responsible for source site ToS
- Multi-home / multi-instance sync
- Pre-built disk image (post stable release)
- Council bin collection iCal auto-subscription (Phase 2)
- Regional transport adapters beyond UK (community plugins)

---

## 36. Open Questions & Future Considerations

| Topic                          | Notes                                                                   |
| ------------------------------ | ----------------------------------------------------------------------- |
| Project name                   | ✅ Confirmed: **Nestor**                                                |
| Licence                        | ✅ MIT                                                                  |
| MVP scope                      | Phase 1 / Phase 2 / Stretch prioritisation — define next session        |
| Domain                         | nestor.app / nestor.dev / get.nestor.app — check availability           |
| GitHub repo                    | github.com/[username]/nestor — check availability                       |
| npm package                    | nestor or @nestor/core                                                  |
| Recipe scraping ToS            | Self-hosters responsible                                                |
| Eufy API stability             | Monitor eufy-security-client                                            |
| Tesla API stability            | Monitor teslajs                                                         |
| Monzo integration              | Webhook push — community extension                                      |
| Ring doorbell plugin           | Community opportunity                                                   |
| Octopus Energy plugin          | Community opportunity                                                   |
| Custom keyboard phase 2        | Replace Onboard with React keyboard                                     |
| Community plugin directory     | Design contribution and review workflow                                 |
| Garden Pal plugin spec         | Write separately                                                        |
| Fridge / pantry inventory      | Future core feature                                                     |
| Council iCal bin subscriptions | Phase 2 community feature                                               |
| Regional transport adapters    | Community plugin opportunity per region                                 |
| RTL support                    | Phase 2 community contribution                                          |
| Religious calendar overlays    | Community plugin                                                        |
| Screen reader compatibility    | Community contribution                                                  |
| Pre-built disk image           | Post stable release                                                     |
| UI design                      | Claude Design for mockups when feature set locked                       |
| MVP planning                   | Next: define Phase 1 scope and build roadmap                            |
| Shared house positioning       | Consider a dedicated "Nestor for shared houses" setup profile in wizard |

---

_This document will be updated as planning continues. Feature scope is subject to change prior to development start._

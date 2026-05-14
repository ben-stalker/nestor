# STORY-5.8: Pantry tab placeholder

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 8
**Estimate:** XS
**Priority:** P3
**Status:** complete

---

## User Story

**As a** household member
**I want** a Pantry tab in Food
**So that** future inventory tracking has a home

---

## Acceptance Criteria

- [x] Tab visible in Food navigation (Plan | Recipes | Shopping | Pantry)
- [x] Renders "Pantry tracking coming soon" empty state for MVP

---

## Implementation

Added "Pantry" as a 4th tab in `client/src/food/index.tsx`. When selected, renders a centred 🥫 icon with "Pantry tracking coming soon" text in the secondary colour. No backend changes required.

### Files modified

- `client/src/food/index.tsx` — added `pantry` to FoodTab union and tab bar; added pantry panel

---

## Notes

Full pantry inventory (stock levels, expiry dates, barcode scan) is out-of-scope per PRD §35.

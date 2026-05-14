# STORY-5.9: Servings calculator + portion-for-one mode

**Epic:** EPIC-5: Food / Meal Planner Module
**Sprint:** 8
**Estimate:** S
**Priority:** P2
**Status:** complete

---

## User Story

**As a** single-person household
**I want** to scale recipes to 1 portion
**So that** the shopping quantities are sane

---

## Acceptance Criteria

- [x] Recipe header servings input editable; ingredients re-rendered scaled
- [x] Quick "× 1 / × 2 / × 4" pills

---

## Implementation

Extended `client/src/food/ServingsScaler.tsx` with three quick-set pills (×1, ×2, ×4). Tapping a pill calls `onChange(baseServings * multiplier)`. Active pill is highlighted with accent colour and `aria-pressed=true`. Pills appear below the existing +/− stepper.

### Files modified

- `client/src/food/ServingsScaler.tsx` — added quick-set pills
- `client/tests/food/ServingsScaler.test.tsx` — added 7 pill tests

---

## Notes

- ×1 sets servings to `baseServings` (original recipe quantity), not literally "1 serving"
- PRD §28: single-person household use-case

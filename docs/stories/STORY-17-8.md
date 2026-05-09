# STORY-17.8: Accessibility admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** global accessibility settings: text size, high contrast, colour-blind palette, reduced motion, simplified nav
**So that** Nestor adapts to needs

---

## Acceptance Criteria

- [ ] All settings global (live for all profiles); per-profile overrides via Profiles panel (STORY-17.2)
- [ ] Live preview area showing sample text + button + chart at the chosen settings
- [ ] Each setting persisted in `app_settings`
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/AccessibilityPanel.tsx`
- `client/src/admin/AccessibilityPreview.tsx`
- `client/src/api/admin.ts`

### Implementation steps

1. Form fields:
   - Default text size (S/M/L/XL).
   - High contrast toggle.
   - Colour-blind palette toggle (Wong/Okabe-Ito).
   - Reduced motion toggle.
   - Simplified nav (default-on for new profiles).
   - Touch target size (44px / 56px).
2. Preview: shows sample card with title + body + button + colour chips.
3. Save persists; ProfileProvider re-applies (STORY-18.4).
4. Tests: form persists; preview reflects settings.

### Key technical details

- All settings tie into STORY-18.4 token system.
- Per-profile overrides win over global.
- Live preview gives confidence before saving.

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-18.4
- **Blocks:** STORY-18.7 (colour-blind palette toggle reads here), STORY-18.8 (simplified nav)

---

## Test Checklist

- [ ] RTL: text size change updates preview
- [ ] RTL: high contrast toggle updates preview
- [ ] RTL: colour-blind palette toggle updates preview
- [ ] RTL: reduced motion toggle persists
- [ ] RTL: simplified nav toggle persists

---

## Notes

- Per-profile overrides handled in STORY-17.2 profile editor.
- Touch target size also affects per-profile (`<TouchTarget>` reads global default).

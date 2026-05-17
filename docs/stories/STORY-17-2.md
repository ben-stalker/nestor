# STORY-17.2: Profiles admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household admin
**I want** to add/edit/remove all profiles with permissions overrides
**So that** my household reflects reality

---

## Acceptance Criteria

- [ ] Profiles section under `/admin/profiles`
- [ ] List + add/edit/delete (admin only)
- [ ] Permission matrix UI showing checkboxes per permission key (~25 keys from STORY-2.3)
- [ ] Per-profile accessibility (text size, simplified nav, high contrast, colour-blind palette)
- [ ] Per-profile colour picker (12 options minimum)
- [ ] Avatar upload (reuse photo helper from STORY-5.2 with `dir='avatars'`)
- [ ] Cannot delete the last admin

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/ProfilesPanel.tsx`
- `client/src/admin/ProfileEditor.tsx`
- `client/src/admin/PermissionMatrix.tsx`
- `client/src/admin/ColourPicker.tsx`
- `server/src/routes/profiles.ts` — already from STORY-2.2; verify includes accessibility fields
- `client/tests/admin/ProfileEditor.test.tsx`

### Implementation steps

1. List page with profile cards (avatar, name, type, colour pill).
2. Editor:
   - Identity: name, type select, colour picker.
   - Avatar upload (preview + crop).
   - PIN: set/clear.
   - Accessibility: text_size select (S/M/L/XL), simplified_nav toggle, colour_blind_palette toggle, high_contrast toggle.
   - Permission matrix: grouped by domain (Calendar, Family, House, Finance, Pets, Plugins, System) with master "Reset to type defaults" button.
3. `<PermissionMatrix>`:
```tsx
const groups = groupPermissions(PERMISSION_KEYS);
return groups.map(g => (
  <fieldset><legend>{g.name}</legend>
    {g.keys.map(k => <label><input type="checkbox" checked={value[k] ?? defaults[k]} onChange={...}/>{k}</label>)}
  </fieldset>
));
```
4. Reset to defaults: button calls `defaultsFor(profile.type)` from STORY-2.4.
5. "Cannot delete last admin" enforced server-side from STORY-2.2; client surfaces 400 with friendly message.
6. Tests: matrix toggles persist; reset to defaults works; deleting last admin shows error.

### Key technical details

- Permission keys come from a single source (STORY-2.3).
- Colour palette of 12 chosen for visual distinguishability (Wong/Okabe-Ito for accessibility variant).
- Avatar storage path `~/.nestor/uploads/avatars/<uuid>.webp`.

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-2.4
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: list renders profiles
- [ ] RTL: add profile via form
- [ ] RTL: edit permissions persists
- [ ] RTL: reset to defaults restores type defaults
- [ ] RTL: delete last admin → error toast
- [ ] RTL: colour picker swatches selectable
- [ ] RTL: avatar upload preview

---

## Notes

- Profile colour change applies immediately app-wide.
- Per-profile reward target (STORY-7.5) is also editable here (or in family panel — pick here for consistency).

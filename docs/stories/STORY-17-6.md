# STORY-17.6: Navigation admin panel

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 9 — MVP cut
**Estimate:** M (2d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household admin
**I want** to hide, reorder, or rename nav modes
**So that** unused features disappear

---

## Acceptance Criteria

- [ ] Drag-to-reorder list of nav modes (uses `@dnd-kit/core` or HTML5 DnD)
- [ ] Visibility toggle per mode
- [ ] Rename per mode (label override; ID stays)
- [ ] Layout (single/double/scrollable/hamburger) selector
- [ ] Persists to `app_settings.enabled_nav_modes` (ordered array) and `app_settings.nav_mode_labels` (map)
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/NavigationPanel.tsx`
- `client/src/admin/SortableNavList.tsx`
- `client/src/api/admin.ts`
- `client/tests/admin/NavigationPanel.test.tsx`

### Implementation steps

1. Sortable list using `@dnd-kit/core`; each row: handle, mode icon, label (editable inline), visibility toggle.
2. Layout selector: radio group (single/double/scrollable/hamburger).
3. Save → PATCH `app_settings` with new array + labels map.
4. Live preview: mini-navbar showing current configuration.
5. Tests: drag reorders; toggle persists; rename persists.

### Key technical details

- Mode IDs are stable; labels are overridable for i18n (admin can rename "Pets" → "Beasties").
- Hidden modes simply omitted from `enabled_nav_modes` array; `<Navbar>` (STORY-2.7) iterates the array.
- DnD library: `@dnd-kit/core` is touch-friendly and small.

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-2.7
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: drag reorders list
- [ ] RTL: toggle hides mode
- [ ] RTL: rename persists in label map
- [ ] RTL: layout select persists
- [ ] Manual: kiosk navbar reflects changes immediately

---

## Notes

- Plugin-registered nav modes (STORY-16.5) appear in this list with a "Plugin" badge; can be hidden but not renamed (plugin owns the i18n).
- Hamburger layout collapses to a single icon that expands a drawer.

# STORY-17.10: Notification advance days configuration

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 9 — MVP cut
**Estimate:** S (1d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household admin
**I want** to configure advance-days per reminder type
**So that** alerts fire when I want them

---

## Acceptance Criteria

- [ ] `app_settings.reminder_windows` JSON keyed by reminder type with default values
- [ ] UI lists all categories (vehicle MOT/tax/insurance/service, finance mortgage/agreements/insurance, pets vaccination/flea-worming/medication, subscriptions, maintenance, bin schedules, baby tracking, guests)
- [ ] Each category has a list of integer day inputs (e.g. `[30, 14, 7, 1]`); user can add/remove entries
- [ ] All scheduler hooks read from this single source
- [ ] Permission: admin only

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/RemindersPanel.tsx` (under Notifications or Household section)
- `client/src/admin/DayWindowEditor.tsx`
- `server/src/services/AppSettings.ts` — type definitions
- `client/tests/admin/RemindersPanel.test.tsx`

### Implementation steps

1. Default values shipped in code:
```ts
export const DEFAULT_REMINDER_WINDOWS = {
  vehicles: { mot: [30,14,7,1], tax: [14,3,1], insurance: [28,14,3], service: [7,1] },
  finance: { mortgage: [180,90,30,14], agreement: [90,30,14], insurance: [28,14,3] },
  pets: { vaccination: [14,7,1], flea_worming: [7,1] },
  subscriptions: { renewal: [7], trial_end: [3] },
  maintenance: { warranty: [60,30,7], reminder: [30,14,7,1] },
  bins: { evening_before: true, morning_of: false },
  baby: { feed_overdue_hours: 4 },
  guests: { pre_arrival_days: [3,1] },
};
```
2. UI:
   - For each category and sub-key, an array editor: list of day chips with "+" to add, "−" to remove.
   - "Reset to defaults" button per category.
3. Save → PATCH `app_settings.reminder_windows`.
4. All reminder hooks (STORY-6.6, STORY-9.5, STORY-10.3, etc.) read this setting at evaluation time.
5. Tests: edit windows persists; defaults restorable.

### Key technical details

- Single source of truth — every hook reads from this object via a helper `getReminderWindow(category, subKey)`.
- Validation: integer ≥ 0, sorted descending, max 10 entries per array.
- Per-record overrides (e.g. per-agreement `alert_lead_days`) still take precedence over global windows.

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-14.3
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: editing a window chip persists
- [ ] RTL: reset to defaults restores
- [ ] Unit: hook reads new windows after change
- [ ] Unit: validation rejects negative days
- [ ] Manual: editing vehicle MOT window changes when reminders fire

---

## Notes

- Per-record overrides (set in each module's edit form) override these globals.
- A future "preview alerts that would fire today" tool would help verify configurations.

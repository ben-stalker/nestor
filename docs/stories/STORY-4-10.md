# STORY-4.10: Event detail modal + quick-add modal

**Epic:** EPIC-4: Calendar Module
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a single modal for creating and viewing events
**So that** the experience is consistent

---

## Acceptance Criteria

- [ ] `<EventModal>` component with two modes: `view` and `edit` (and `create` as a special-case edit with no id)
- [ ] Fields: title, profile picker (uses profile colour pills), start/end (date+time), all-day toggle, type select (default/wfh/shift/vehicle/vet/custody), recurrence picker, notes textarea, colour override
- [ ] Quick-add prepopulates from carousel/empty-slot context (passed via props: `defaultDate`, `defaultProfile`, `defaultType`)
- [ ] Save → POST/PATCH via TanStack Query mutation; invalidates `['events', range]` keys
- [ ] Cancel → close without changes
- [ ] Delete confirmation modal for existing events; PATCH/DELETE permission-aware (calendar.event.update / .delete)
- [ ] CalDAV-source events show as read-only for non-admins (fields disabled, footer banner explains)
- [ ] On-screen keyboard friendly: Phase 1 triggers `onboard` via a CSS class on `<input>` (the kiosk launcher autostarts onboard)

---

## Technical Implementation

### Files to create / modify

- `client/src/calendar/EventModal.tsx`
- `client/src/calendar/RecurrencePicker.tsx`
- `client/src/calendar/api.ts` — TanStack Query mutations + queries
- `client/src/calendar/types.ts` — re-export from server types
- `client/tests/calendar/EventModal.test.tsx`

### Implementation steps

1. Build `<EventModal>` on top of the `<Modal>` primitive (STORY-2.5).
2. Form state via `react-hook-form` + Zod resolver mirroring server `EventInput`.
3. `<RecurrencePicker>`: dropdown of presets ("Does not repeat" / "Daily" / "Weekly on {weekday}" / "Monthly on day {N}" / "Yearly" / "Custom"). Custom expands inputs for INTERVAL, BYDAY chips, end mode (never/COUNT/UNTIL).
4. Build the RRULE string at submit time (server expects RFC 5545 string).
5. Profile picker: list active profiles as colour pills; selecting one tints the form border.
6. TanStack mutations:
```ts
const create = useMutation({ mutationFn: (input) => api.post('/calendar/events', input), onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }) });
```
7. View mode: show formatted start/end (via `formatDate`/`formatTime` from STORY-18.2), profile chip, recurrence summary in plain English, notes.
8. Read-only handling: if `event.source !== 'local'` and active profile is not admin, render fields with `readOnly`, hide the save button, show banner "Synced from {provider} — read only".
9. Delete with confirm: small inline confirmation card overlays the footer rather than a second modal.
10. Tests with RTL: open modal in create mode, fill form, submit, mock API, expect query invalidation.

### Key technical details

- PRD §10 — modal must be reusable across day/week/month/carousel.
- Quick-add semantics: creating from carousel passes the day's date and the active filter profile if any; from empty calendar slot, passes the slot start.
- All times shown in user tz from `app_settings.timezone` via `format.ts`.
- The `recurring_rule` field is the source of truth — the picker only surfaces common shapes; advanced users can paste raw RRULE in custom mode.

---

## Dependencies

- **Blocked by:** STORY-4.2 (event endpoints), STORY-2.5 (Modal primitive)
- **Blocks:** STORY-3.3 (carousel quick-add), STORY-4.7/4.8/4.9 (views opening this modal)

---

## Test Checklist

- [ ] RTL: open in create mode, submit minimal valid event, mutation called
- [ ] RTL: open in view mode for CalDAV event as child profile, fields are disabled
- [ ] RTL: recurrence picker emits a valid RRULE string
- [ ] RTL: delete confirmation reveals on click; second click invokes mutation
- [ ] RTL: validation error shows under the offending field
- [ ] Manual: works on 1080p portrait and landscape
- [ ] Manual: triggers `onboard` keyboard on touchscreen

---

## Notes

- The recurrence picker is intentionally simple for MVP; "every other Tuesday" is reachable via custom mode.
- The same modal is opened from carousel long-press (STORY-3.3), week-view quick-add (STORY-4.8), and the day view (STORY-4.7).

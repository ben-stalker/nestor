# STORY-17.1: Settings shell + section navigation

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** a single Settings hub with a left rail of sections
**So that** all configuration lives in one place

---

## Acceptance Criteria

- [ ] Route `/admin` mounted; admin PIN required to enter
- [ ] Left rail per PRD §30 sections (15 sections): Profiles, Localisation, Calendar, Display, Navigation, Food, Household, Vehicles, Finance, Energy, Voice, Accessibility, Plugins, System, Setup & Help
- [ ] Each section is a separate React route loaded lazily (`React.lazy`)
- [ ] Search bar filtering sections by keyword
- [ ] "Done" button returns to home
- [ ] Section list visible on landscape; drawer on portrait

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/AdminShell.tsx`
- `client/src/admin/AdminSidebar.tsx`
- `client/src/admin/AdminSearch.tsx`
- `client/src/admin/sections.ts` — declarative section list
- `client/src/router.tsx` — `/admin/*` routes
- `server/src/routes/adminGate.ts` — middleware enforcing admin pin
- `client/tests/admin/AdminShell.test.tsx`

### Implementation steps

1. `sections.ts`:
```ts
export const ADMIN_SECTIONS = [
  { id: 'profiles', label: 'admin.profiles', icon: 'users', component: lazy(() => import('./sections/ProfilesPanel')) },
  { id: 'localisation', label: 'admin.localisation', icon: 'globe', component: lazy(() => import('./sections/LocalisationPanel')) },
  // ... 15 sections
];
```
2. `<AdminShell>`:
   - Verify admin PIN entered (read from session store; if missing, prompt modal).
   - Layout: sidebar (search + section list) + main outlet.
3. Search: filter sections by `label` (translated) substring.
4. Routes: `<Route path="/admin" element={<AdminShell />}><Route path=":sectionId" element={<SectionLoader />} /></Route>`.
5. Section panels are added in subsequent stories (17.2 onward) — empty placeholders here.
6. Server middleware `requireAdminPin` already from STORY-2.3.
7. Tests: `/admin` requires PIN; search filters; navigation between sections.

### Key technical details

- PRD §30 sections.
- React Router v6 nested routes.
- `React.lazy` for code splitting per section.
- Admin PIN persists in Zustand store for current session; cleared on profile switch.

---

## Dependencies

- **Blocked by:** STORY-2.5
- **Blocks:** STORY-17.2 through STORY-17.10 (each panel)

---

## Test Checklist

- [ ] RTL: navigating to /admin without PIN shows prompt
- [ ] RTL: PIN entered → AdminShell renders
- [ ] RTL: search filters section list
- [ ] RTL: clicking section navigates to its panel
- [ ] RTL: Done button → /
- [ ] Manual: portrait shows drawer; landscape shows sidebar

---

## Notes

- Section list is data-driven — adding a section is just a new entry in `sections.ts` + a panel component.
- Setup wizard (STORY-19.1) re-uses this shell for "Settings → Setup & Help → Re-run wizard".

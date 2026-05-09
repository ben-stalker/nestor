# STORY-2.9: Sidebar filter panel (portrait) / top filter strip (landscape)

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household member
**I want** a persistent filter strip with profile, pet, and vehicle toggles
**So that** I can scope what is visible across calendar/home

---

## Acceptance Criteria

- [ ] `<FilterPanel>` driven by Zustand `filtersStore` with arrays: `profiles[]`, `pets[]`, `vehicles[]`, `pluginFilters[]`
- [ ] "All" toggle (a single pill labelled "All household") resets the filter store
- [ ] Each toggle is a `<Pill>` (from STORY-2.5) coloured per profile/pet/vehicle (matches `home_.png` filter row: "All household | Sarah | Mark | Maya | Leo | Biscuit")
- [ ] Plugin-registered filters (capability `sidebar_filter` from STORY-16.5) slot in dynamically; hidden when no plugins enabled
- [ ] Portrait: above the day carousel and main content (top strip per `home_.png`); Landscape: left vertical sidebar 88px wide
- [ ] Filter state persisted to `localStorage` per active profile id (key: `nestor-filters-{profileId}`)
- [ ] Active filters are visually distinct (filled pill vs outline)
- [ ] A `useFilters()` hook exposes the current filter state for consumers (carousel, calendar)

---

## Technical Implementation

### Files to create / modify

- `client/src/store/filtersStore.ts` — Zustand store
- `client/src/core/FilterPanel.tsx`
- `client/src/core/AppShell.tsx` — render `<FilterPanel>` in the `filters` grid slot
- `client/src/core/hooks/useFilters.ts`
- `client/tests/core/FilterPanel.test.tsx`

### Implementation steps

1. `client/src/store/filtersStore.ts`:
```ts
type Filters = { profiles: number[]; pets: number[]; vehicles: number[]; pluginFilters: Record<string, unknown[]> };
type State = { filters: Filters; toggleProfile: (id) => void; togglePet: (id) => void; toggleVehicle: (id) => void; togglePluginFilter: (pluginId, value) => void; resetAll: () => void };
export const useFiltersStore = create<State>()(persist(/* … */, { name: 'nestor-filters' /* per-profile partition handled in provider */ }));
```
2. Bind the store's persistence key to the active profile id by wrapping in a small `<FiltersProvider>` that re-keys via `usePersistName(profileId)` — or simply key the store object externally `nestor-filters-${profileId}`.
3. `<FilterPanel>` reads `useProfiles()`, `usePets()` (placeholder until STORY-10.x lands), `useVehicles()` (placeholder until STORY-6.2 lands), `usePluginSidebarFilters()` (placeholder until STORY-16.5).
4. Render an "All" pill that toggles all on/off.
5. Render colour-coded `<Pill>`s for profiles using their `colour` field as background tint.
6. Pets and vehicles render coloured pills with their icon.
7. Plugin-registered filter components render via the registry hook.
8. Layout per orientation: in portrait, horizontal scrollable strip; in landscape, vertical 88px sidebar with stacked icon-only pills (label on long-press / hover).
9. `useFilters()` returns `useFiltersStore(s => s.filters)`.
10. Tests: toggle profile, assert state updates; persisting and rehydrating; "All" reset.

### Key technical details

- PRD §9 sidebar filters per design `home_.png` (top filter row showing "All household • Sarah • Mark • Maya • Leo • Biscuit").
- For Sprint 3 timing, pets/vehicles are unpopulated (their modules land later); the panel should render gracefully with empty arrays — this is the contract.
- Plugin filter registry (`sidebarFilterRegistry`) lands in STORY-16.5; until then the hook returns `[]`.
- Filters scope by composing into TanStack Query keys — e.g. calendar events query key `['events', range, filters.profiles]`. Each consumer reads `useFilters()` and passes profile/pet/vehicle ids to its server query.

---

## Dependencies

- **Blocked by:** STORY-2.6
- **Blocks:** STORY-3.3 (carousel respects filters), STORY-4.7+ (calendar views), STORY-10.4 (vet filter)

---

## Test Checklist

- [ ] Unit: `toggleProfile(3)` adds `3` to `filters.profiles`; calling again removes it
- [ ] Unit: `resetAll` clears all four arrays
- [ ] Unit: `<FilterPanel>` renders one pill per profile from `useProfiles`
- [ ] Unit: tapping pill toggles its active state
- [ ] Manual: portrait — pills along the top above the carousel
- [ ] Manual: landscape — pills stacked in a 88px left sidebar
- [ ] Manual: state survives reload (per active profile id)

---

## Notes

- The filter "All household" pill at the start of the row is the default state — empty arrays mean "show everything".
- Plugin filters render at the end of the strip after core filters.

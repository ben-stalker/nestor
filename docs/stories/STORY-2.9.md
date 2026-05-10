# STORY-2.9: Sidebar filter panel (portrait) / top filter strip (landscape)

**Status:** complete

## Story

**As a** household member  
**I want** a persistent filter strip with profile, pet, and vehicle toggles  
**So that** I can scope what is visible across calendar/home

## Acceptance Criteria

- [x] `<FilterPanel>` driven by Zustand `filtersStore` with `profiles[]`, `pets[]`, `vehicles[]`, `pluginFilters[]`
- [x] "All" toggle resets filters
- [x] Toggle pills colour-coded per profile
- [x] Plugin-registered filters slot in dynamically (via plugin registry hook)
- [x] Portrait: left sidebar 88px wide
- [x] Landscape: top strip
- [x] Filter state persisted to `localStorage` per profile

## Tasks

- [x] Create `filtersStore.ts` (Zustand + persist, per-profile)
- [x] Create `FilterPanel.tsx` component (portrait sidebar / landscape strip)
- [x] Update `AppShell.tsx` to render FilterPanel
- [x] Update `index.css` app shell grid + filter panel styles
- [x] Tests: filtersStore unit tests (17 tests)
- [x] Tests: FilterPanel component tests (17 tests)
- [x] QA: lint + typecheck + test suite green (144 total passing)

## Notes

- PRD §9 sidebar; pets and vehicles populated empty until those modules exist
- Deps: STORY-2.6 (app shell grid already has `filters` grid-area)

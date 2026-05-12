# STORY-3.9: "Coming Up" widget

**Status:** complete

## Tasks

- [x] server: add `GET /api/v1/home/coming-up` endpoint to home.ts with ComingUpItem type
- [x] client: `src/api/comingUp.ts` — API function
- [x] client: `src/hooks/useComingUp.ts` — TanStack Query hook
- [x] client: `src/features/home/ComingUpWidget.tsx` — widget component
- [x] client: CSS for `.coming-up` widget in index.css
- [x] client: add ComingUpWidget to HomePage
- [x] server tests: coming-up endpoint (home.test.ts)
- [x] client tests: ComingUpWidget.test.tsx

## Notes

Dependent modules (calendar, finance, vehicles, contacts) are not yet implemented.
Endpoint is a stub returning empty items; structure is ready for population in later epics.
Items sorted by daysUntil ascending; max 3 returned.
Widget hides itself when items array is empty.
3 new server tests (264 server total), 6 new client tests (263 client total). lint + typecheck clean.

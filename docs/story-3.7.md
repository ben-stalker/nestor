# STORY-3.7: Journey time widget

**Status:** complete

## Tasks

- [ ] Migration: 004_journeys.sql — journeys table
- [ ] TransportAdapter interface + UkNoOpAdapter stub
- [ ] JourneyRepository — CRUD
- [ ] GET/POST/PATCH/DELETE /api/v1/journeys endpoints
- [ ] GET /api/v1/journeys/eta — live ETAs per active profile
- [ ] Register journeys router in app.ts
- [ ] client: api/journeys.ts
- [ ] client: hooks/useJourneys.ts
- [ ] client: features/home/JourneyWidget.tsx — rows with ETA + empty state
- [ ] Update home/index.tsx to use JourneyWidget
- [ ] Tests

## Notes

Transport adapter is a stub returning mocked times for MVP.
Real National Rail adapter is P2/community extension.
Journey rows are filtered by days_active bitmask (Sun=0,Mon=1,...,Sat=6).
Widget only shows rows relevant to the active profile.

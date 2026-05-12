# STORY-3.6: Alerts strip on home

**Status:** complete

## Tasks

- [ ] Migration: 003_alerts.sql — alerts table
- [ ] AlertRepository — list active / dismiss
- [ ] GET /api/v1/alerts endpoint
- [ ] POST /api/v1/alerts/:id/dismiss endpoint
- [ ] Register alerts router in app.ts
- [ ] client: api/alerts.ts
- [ ] client: hooks/useAlerts.ts (TanStack Query, WS refetch)
- [ ] client: features/home/AlertsStrip.tsx — severity colour, icon, dismiss, deep link
- [ ] Update home/index.tsx to use AlertsStrip
- [ ] Tests

## Notes

STORY-14.4 (full alert engine) is a future dependency — this story establishes
the schema, API contract and UI. The alerts table can be populated by future stories.
WebSocket `alert_update` message triggers a query invalidation.

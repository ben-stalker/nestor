# STORY-13.2: Manual charging log endpoints + UI

**Epic:** EPIC-13: EV & Energy Module
**Status:** completed

server/src/routes/ev.ts: GET/POST/PATCH/DELETE /api/v1/ev/charging-log (vehicleId filter), GET /api/v1/ev/monthly-totals. Registered in app.ts. Client: ev/types.ts, api.ts, hooks/useEvCharging.ts, ChargingLogList.tsx, ChargingLogForm.tsx.

# STORY-3.7: Journey time widget

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** commuting adult
**I want** a "Home → King's Cross 38 min" widget per saved route
**So that** I can plan my commute

---

## Acceptance Criteria

- [x] `journeys` table: `id, profile_id, label, origin, destination, transport_mode, days_active (bitmask), provider_id`
- [x] CRUD endpoints under `/api/v1/journeys`
- [x] Server-side `TransportAdapter` interface; UK default no-op stub returns mocked time (real adapters added in P2 / community)
- [x] Widget renders journey rows with live ETA per active profile, only on relevant days
- [x] Empty state: "Add a saved journey in Settings"
- [x] Permission: any profile can manage own journeys; admin can manage all

---

## Technical Implementation

### Files to create / modify

- `server/migrations/00X_journeys.sql`
- `server/src/repositories/JourneyRepository.ts`
- `server/src/services/transport/TransportAdapter.ts` (interface)
- `server/src/services/transport/UkStubAdapter.ts`
- `server/src/services/transport/registry.ts`
- `server/src/routes/journeys.ts`
- `client/src/home/JourneyWidget.tsx`
- `client/src/api/journeys.ts`
- `server/tests/services/transport/UkStubAdapter.test.ts`

### Implementation steps

1. Migration:
```sql
CREATE TABLE journeys (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  origin TEXT NOT NULL, destination TEXT NOT NULL,
  transport_mode TEXT NOT NULL CHECK(transport_mode IN ('rail','tube','bus','car','walk','cycle')),
  days_active INTEGER NOT NULL DEFAULT 31, -- bitmask Mon-Sun
  provider_id TEXT NOT NULL DEFAULT 'uk-stub',
  created_at INTEGER NOT NULL
);
```
2. Adapter interface:
```ts
export interface TransportAdapter {
  id: string;
  getJourneyTime(input: { origin: string; destination: string; mode: string }): Promise<{ mins: number; status: 'ok'|'delayed'|'unknown'; disruptions?: string[] }>;
}
```
3. UK stub returns mocked `mins` based on origin/destination string hash; flagged `status: 'unknown'`.
4. Registry: `registerAdapter(adapter)` + `getAdapter(id)`.
5. Routes: standard CRUD + `GET /api/v1/journeys/:id/eta` calls adapter.
6. Widget:
   - Reads journeys for active profile, filters by today's day bit.
   - Per row: label, mode icon, mins, status badge.
   - Auto-refresh every 5 minutes.
7. Tests: adapter returns mocked time; CRUD; ETA endpoint dispatches via registry.

### Key technical details

- PRD §12 commute & travel.
- Real National Rail adapter is Phase 2 / community plugin scope.
- Stub flagged "unknown" so users understand it's not a real ETA.
- `days_active` bitmask: bit 0 = Mon, ..., bit 6 = Sun.

---

## Dependencies

- **Blocked by:** STORY-3.2, STORY-2.4
- **Blocks:** STORY-6.7 (real adapter interface formalised here)

---

## Test Checklist

- [x] Unit: stub returns mins (transportAdapter.test.ts)
- [x] Unit: CRUD round-trip (JourneyRepository.test.ts)
- [x] Unit: days_active filter (JourneyRepository.test.ts — listActiveToday)
- [x] Unit: ETA endpoint dispatches (journeys.test.ts)
- [x] RTL: widget renders rows (JourneyWidget.test.tsx)
- [x] RTL: empty state when no journeys (JourneyWidget.test.tsx)
- [ ] RTL: refresh interval 5min (staleTime=5min set in useJourneyEtas; interval test deferred)

---

## Notes

- Provider plugin contract documented in `docs/plugins/transport-adapters.md`.
- For MVP, the widget is functional but ETAs are mocked; real-time ETAs come with provider plugins in Phase 2.

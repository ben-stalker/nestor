# STORY-3.4: Day card details — WFH / school drop / vehicle / pet markers

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** day cards to display per-day badges: WFH/in-office, nursery drop, vehicle bookings, pet vet
**So that** the day's logistics are visible without opening anything

---

## Acceptance Criteria

- [ ] Day card displays icon strip below date: WFH/office per adult, nursery drop, school pickup, vehicle bookings, vet appointments
- [ ] Bin icons appear on collection days with the configured colour
- [ ] Each badge linked to its source (tap → opens detail / module)
- [ ] Filter panel toggles affect what is shown
- [ ] Endpoint `GET /api/v1/home/day-summary?date=` aggregates events, vehicle bookings, bin schedules, pet care due dates, WFH status
- [ ] Caching: summary cached per-day for 30s, invalidated on relevant module mutations

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/home.ts`
- `server/src/services/DaySummaryService.ts`
- `client/src/home/DayCard.tsx` — extend with badge strip
- `client/src/home/DayBadge.tsx`
- `client/tests/home/DayBadge.test.tsx`

### Implementation steps

1. Service:
```ts
export async function daySummary(date: Date) {
  const start = startOfDay(date), end = endOfDay(date);
  const events = await eventRepo.findInRange(start.getTime(), end.getTime());
  const wfhEvents = events.filter(e => e.type === 'wfh');
  const shiftEvents = events.filter(e => e.type === 'shift');
  const vetEvents = events.filter(e => e.type === 'vet');
  const nurseryEvents = events.filter(e => e.type === 'nursery_drop');
  const bookings = await bookingRepo.findInRange(start.getTime(), end.getTime());
  const bins = (await binRepo.list({ active: true })).filter(b => nextCollections(b, start, 1, holidays)[0]?.toDateString() === date.toDateString());
  return { wfh: wfhEvents.map(e => e.profile_id), shift: shiftEvents, nursery: nurseryEvents, bookings, bins, vet: vetEvents };
}
```
2. Route:
```ts
router.get('/day-summary', requireProfile, async (req, res) => {
  const date = new Date(req.query.date as string);
  res.json(await daySummary(date));
});
```
3. Cache: in-memory keyed by `YYYY-MM-DD`, TTL 30s; invalidated on `calendar:*`, `vehicle_booking:*`, `bin_schedule:*`, `pet_health:*` events.
4. `<DayCard>` extends with badge row:
   - WFH avatar chips (one per adult).
   - Nursery / school icons with profile colour.
   - Vehicle booking chip.
   - Vet appointment chip.
   - Bin icons (configured colour).
5. Filter panel honoured: badges hidden when their profile/pet/vehicle filtered out.
6. Tests: aggregation correctness; cache invalidation; badge rendering.

### Key technical details

- Risk R-09: this is a hot path; caching is critical. In-memory simple cache with TTL is sufficient.
- The endpoint reads from many modules; if any module is empty, that section is just omitted from the response.
- The home carousel calls this once per visible day; 6 days = 6 round-trips. Could be batched but 30s cache makes it OK for MVP.

---

## Dependencies

- **Blocked by:** STORY-3.3, STORY-4.4, STORY-6.4, STORY-8.3, STORY-10.3
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: aggregation returns expected shape
- [ ] Unit: cache hits second call within TTL
- [ ] Unit: invalidation event clears cache
- [ ] RTL: badges render per type
- [ ] RTL: filter hides badges
- [ ] RTL: tap badge → navigates

---

## Notes

- The endpoint is the keystone — many modules feed it; depends on those modules being complete before MVP polish.
- Optimistic prefetch of next-day summaries is a Phase 2 micro-optimisation.

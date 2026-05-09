# STORY-7.3: Family hub page (admin view)

**Epic:** EPIC-7: Family Module — Children & Health
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** a Family overview with child cards showing chores done today, points balance, upcoming events
**So that** I can see at a glance how the kids are doing

---

## Acceptance Criteria

- [ ] Route `/family` mounted (admin/teen visible; child profiles redirected to `/me`)
- [ ] One card per child profile: avatar, name, today's chores (X/Y), points balance, next event chip
- [ ] Tap card → navigates to child detail (`/family/:profileId`) showing full chore list, health log, routines
- [ ] Server `GET /api/v1/family/summary` aggregates per-child data in one request
- [ ] Empty state ("No children yet") with link to add a profile

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/family.ts` — `GET /summary`
- `client/src/family/FamilyHub.tsx`
- `client/src/family/ChildCard.tsx`
- `client/src/family/ChildDetail.tsx`
- `client/src/api/family.ts`
- `server/tests/routes/family.test.ts`

### Implementation steps

1. Server summary aggregation:
```ts
router.get('/summary', requireProfile, requirePermission('family.view'), async (_req, res) => {
  const children = await profileRepo.list({ type: ['child','toddler','teen'] });
  const today = startOfDay(new Date());
  const result = await Promise.all(children.map(async c => ({
    profile: c,
    todayChores: completionRepo.todayCount(c.id, today),
    todayChoreTotal: choreRepo.countAssigned(c.id, today),
    pointsBalance: rewardRepo.balance(c.id),
    nextEvent: eventRepo.findNextForProfile(c.id),
  })));
  res.json(result);
});
```
2. `<FamilyHub>`:
```tsx
const { data } = useFamilySummary();
return <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{data.map(c => <ChildCard key={c.profile.id} {...c} />)}</div>;
```
3. `<ChildCard>`: avatar, name, "Chores X/Y today", points balance, next-event chip.
4. `<ChildDetail>`: tabbed view (Chores / Health / Routines / Rewards).
5. Tests: summary endpoint returns expected shape; FamilyHub renders cards; tap navigates.

### Key technical details

- Permission key `family.view` (admin/teen by default).
- Card colour-coded by profile colour (left border or background tint).
- "Next event" via `eventRepo.findNextForProfile(profileId)` which uses index `idx_events_profile_date`.
- Aggregate endpoint avoids N+1 round-trips.

---

## Dependencies

- **Blocked by:** STORY-7.2
- **Blocks:** STORY-7.4 (child view links from here), STORY-7.5 (rewards grid embedded in detail)

---

## Test Checklist

- [ ] Unit: summary endpoint returns one entry per child profile
- [ ] Unit: child profile gets 403 on /summary (not in admin/teen list)
- [ ] RTL: hub renders 3 children with chore counts
- [ ] RTL: tap card → navigation
- [ ] Manual: child profile attempting to access /family is redirected to /me

---

## Notes

- Hub is intentionally read-only — completion happens on each child's `/me` view (STORY-7.4) or admin can mark complete from detail.
- Health log preview uses sparkline of recent symptoms (admin only) — keep simple for MVP.

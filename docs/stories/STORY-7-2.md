# STORY-7.2: Chore CRUD endpoints + complete endpoint

**Epic:** EPIC-7: Family Module — Children & Health
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** child
**I want** to mark my chores done and earn points
**So that** I can save up for rewards

---

## Acceptance Criteria

- [ ] `GET /api/v1/chores?profileId=` returns chores assigned to that profile (or all if admin and no filter)
- [ ] `POST /api/v1/chores` creates (admin only)
- [ ] `PATCH /api/v1/chores/:id` updates (admin only)
- [ ] `DELETE /api/v1/chores/:id` deletes (admin only)
- [ ] `PATCH /api/v1/chores/:id/complete` writes a `chore_completions` row, awards points to the completer
- [ ] `GET /api/v1/rewards/:profileId` returns `{ balance, recentCompletions, recentRedemptions }`
- [ ] `POST /api/v1/rewards/:profileId/redeem` (admin only) decrements points, creates `reward_redemptions` row
- [ ] Permission middleware enforces "chore complete" per profile type (child/teen can complete; toddler tap-only via simplified endpoint)

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/chores.ts`
- `server/src/routes/rewards.ts`
- `server/src/services/ChoreService.ts`
- `server/tests/routes/chores.test.ts`

### Implementation steps

1. `ChoreService.complete(choreId, profile)`:
   - Loads chore.
   - Optionally guards "already completed today" for daily chores.
   - Inserts `chore_completions` with `points_awarded = chore.points`.
   - Emits `chore:completed` event (used by reward grid).
2. Routes:
```ts
router.get('/', requireProfile, async (req, res) => {
  const filter = req.query.profileId ? { assigned_profile_id: Number(req.query.profileId) } : {};
  if (!filter.assigned_profile_id && req.profile.type !== 'admin') filter.assigned_profile_id = req.profile.id;
  res.json(await choreRepo.list(filter));
});
router.patch('/:id/complete', requireProfile, requirePermission('chore.complete'), async (req, res) => {
  const completion = await choreService.complete(Number(req.params.id), req.profile);
  res.status(201).json(completion);
});
```
3. Rewards routes:
```ts
router.get('/:profileId', requireProfile, async (req, res) => {
  const balance = rewardRepo.balance(Number(req.params.profileId));
  const recentCompletions = completionRepo.recent(Number(req.params.profileId), 10);
  const recentRedemptions = redemptionRepo.recent(Number(req.params.profileId), 10);
  res.json({ balance, recentCompletions, recentRedemptions });
});
router.post('/:profileId/redeem', requireAdmin, async (req, res) => {
  const { points_spent, reward_label } = req.body;
  const balance = rewardRepo.balance(Number(req.params.profileId));
  if (points_spent > balance) return res.status(400).json({ error: 'insufficient_points' });
  const id = await redemptionRepo.push({ profile_id: Number(req.params.profileId), points_spent, reward_label, redeemed_at: Date.now() });
  res.status(201).json({ id });
});
```
4. Tests: child completes their chore (201), child tries to complete others' (403), non-admin redeem (403), admin redeem with insufficient points (400).

### Key technical details

- Architecture API patterns.
- "Daily" chore: optional uniqueness on `(chore_id, profile_id, date_bucket)` to prevent double-completion same day; configurable.
- Points pulled from chore record at completion time so admin changes don't retroactively affect awarded points.
- Toddler simplified completion: same endpoint, but a "toddler" frontend has bigger buttons.

---

## Dependencies

- **Blocked by:** STORY-7.1, STORY-2.3
- **Blocks:** STORY-7.3 (family hub), STORY-7.4 (child view), STORY-7.5 (reward grid), STORY-8.9 (adult chores rota)

---

## Test Checklist

- [ ] Unit: child completes own chore → 201 + points awarded
- [ ] Unit: child completes another child's chore → 403
- [ ] Unit: admin creates chore → 201
- [ ] Unit: non-admin creates chore → 403
- [ ] Unit: admin redeems valid amount → 201
- [ ] Unit: admin redeems > balance → 400
- [ ] Unit: GET rewards returns balance + history

---

## Notes

- Streak tracking (consecutive days with at least one completion) is computed in STORY-7.5.
- Allowance/points-to-money conversion (STORY-7.12) is layered on top of redemptions.

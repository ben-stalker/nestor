# STORY-7.5: Reward star grid + streak tracking

**Epic:** EPIC-7: Family Module — Children & Health
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** child
**I want** to see a visual grid of stars filling up toward a reward
**So that** progress feels tangible

---

## Acceptance Criteria

- [ ] `<RewardStarGrid>` renders an N×M grid of empty star outlines; fills from chore_completions
- [ ] Streak indicator (consecutive days with at least one completion)
- [ ] Configurable target per profile (5/10/20/custom stars per reward) from `reward_targets[profileId]`
- [ ] Burst animation when target hit (confetti + sound respecting quiet hours)
- [ ] Visible on `/me` (STORY-7.4) and `/family/:id` (STORY-7.3)
- [ ] Endpoint `GET /api/v1/rewards/:profileId/grid` returns `{ filled, total, streak }`

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/rewards.ts` — extend with `/grid`
- `server/src/services/RewardService.ts`
- `client/src/me/RewardStarGrid.tsx`
- `client/src/family/StarBalanceChip.tsx` (small variant for hub)
- `client/tests/me/RewardStarGrid.test.tsx`

### Implementation steps

1. Server:
```ts
router.get('/:profileId/grid', requireProfile, async (req, res) => {
  const profileId = Number(req.params.profileId);
  const balance = rewardRepo.balance(profileId);
  const target = await settings.get(`reward_targets.${profileId}`) ?? 10;
  const completions = completionRepo.byDay(profileId, 30);
  const streak = computeStreak(completions);
  res.json({ filled: balance % target, total: target, totalEarned: balance, streak });
});
```
2. `computeStreak(byDay)`: walk back from today; count consecutive days with at least one completion.
3. `<RewardStarGrid>`:
```tsx
const { data } = useQuery({ queryKey: ['rewards','grid',profileId], queryFn: ... });
return <div className="grid grid-cols-5 gap-2">
  {Array.from({length: data.total}).map((_, i) => <Star key={i} filled={i < data.filled} />)}
  <StreakChip days={data.streak} />
</div>;
```
4. Burst animation: when `data.filled === data.total - 1` and a new completion arrives, fire confetti via `<RewardBurst>`; Web Audio chime gated by `app_settings.quiet_hours`.
5. WS `chore:completed` triggers refetch.
6. Tests: grid renders correct filled count, streak computed, burst fires at target.

### Key technical details

- Stars are CSS or SVG (don't rely on emoji rendering on kiosk OS).
- Streak uses date in user tz to avoid off-by-one across midnight.
- Burst animation reused from STORY-7.4 confetti.
- `reward_targets` setting is scalar per profile id; admin sets via STORY-17.2 profile panel.

---

## Dependencies

- **Blocked by:** STORY-7.4
- **Blocks:** STORY-7.12 (allowance tracker reads balance)

---

## Test Checklist

- [ ] Unit: grid endpoint returns filled = balance % target
- [ ] Unit: streak counts consecutive days
- [ ] Unit: missing day breaks streak
- [ ] RTL: grid renders 10 stars with 7 filled
- [ ] RTL: hitting target fires burst (mock Framer)
- [ ] Manual: chime respects quiet_hours

---

## Notes

- After hitting target, stars wrap (next reward starts) — no auto-redeem; admin redeems manually.
- A future "next reward" state showing the upcoming reward image is nice-to-have.

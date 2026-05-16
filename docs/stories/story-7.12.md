# STORY-7.12: Allowance/points-to-money tracker (teen)

**Status:** COMPLETE (2026-05-16)

## Tasks

- [x] Migration 014 adds `conversion_rate REAL NOT NULL DEFAULT 0` to profiles
- [x] `UpdateProfileSchema` accepts `conversion_rate: number (≥0)` and `ProfileRepository.update()` persists it
- [x] `GET /api/v1/rewards/:profileId/grid` extended to include `conversionRate` and `moneyEquivalent` (points × rate, rounded to 2dp; null when rate = 0)
- [x] `RewardGrid` client type extended with `conversionRate` and `moneyEquivalent` fields
- [x] `RewardStarGrid.tsx` shows "X pts = £Y.YY" when `moneyEquivalent != null`

## Notes
- Conversion rate is per-profile (admin sets via PATCH /api/v1/profiles/:id)
- Null/undefined-safe check (`!= null`) ensures existing tests without the field don't break

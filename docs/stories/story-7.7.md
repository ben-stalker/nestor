# STORY-7.7: Baby tracking — feeds, nappies, sleep

**Status:** COMPLETE (2026-05-16)

## Tasks

- [x] Migration 014 adds `dob`, `feed_alert_hours`, `conversion_rate` to profiles
- [x] `GET /api/v1/health-log/:profileId/baby-summary` endpoint — todayFeedCount, todayNappyCount, lastFeedMs, lastSleepEntry, recentEntries
- [x] `BabyAlertService.ts` — evalFeedAlerts() checks all baby profiles, creates `baby_feed_overdue_<id>` alert when threshold exceeded (deduped)
- [x] Wired into `reminder-eval` scheduler job
- [x] `BabyView.tsx` — Feed (Left/Right/Bottle), Nappy (Wet/Dirty/Both), Sleep toggle quick-log buttons
- [x] Today summary bar — feeds today, nappies today, last feed X ago
- [x] Scrollable recent timeline with log_type + side/type detail
- [x] MePage renders `<BabyView>` for baby profile type

## Notes
- Uses existing `health_logs` table with `feed`/`nappy`/`sleep` log_type entries (schema from STORY-7.1)
- feed_alert_hours default: 4; overdue alert is deduplicated per baby profile

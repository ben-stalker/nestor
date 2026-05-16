# STORY-7.11: Mood / wellbeing log

**Status:** COMPLETE (2026-05-16)

## Tasks

- [x] `GET /api/v1/health-log/:profileId/mood-trend` — returns last 30 days of mood entries grouped by day (most recent per day), sorted ascending
- [x] `MoodCheckin.tsx` — 5-emoji scale (😢😞😐🙂😄) with aria-labels, optional note textarea, save button; shows confirmation after saving
- [x] `MoodTrend.tsx` — SVG bar chart (360×120) with colour gradient (red→green by score), date labels on x-axis, emoji y-axis labels
- [x] Added "Mood" tab in ChildDetail for teen profiles only
- [x] Uses existing `health_logs` table with `mood` log_type and `data_json: { score, note? }`

## Notes
- Score range: 1–5 (1 = very sad, 5 = very happy)
- Not surfaced for baby/toddler/child profiles

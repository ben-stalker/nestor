# STORY-7.8: Growth log + percentile chart

**Status:** COMPLETE (2026-05-16)

## Tasks

- [x] `nhsVaccinations.ts` data file (TypeScript module, avoids JSON module resolution issues)
- [x] `GET /api/v1/health-log/:profileId/growth-data` — returns `{ dobMs, points[] }` combining `growth` + `weight` log entries with `age_weeks` calculated from `dob`
- [x] `GrowthChart.tsx` — SVG chart with WHO weight percentile bands (3rd, 15th, 50th, 85th, 97th) and baby's data points in orange
- [x] Percentile legend + measurements table below chart
- [x] Added "Growth" tab in ChildDetail for baby/toddler profiles
- [x] `ProfileRepository.create()` / `update()` handle `dob` column

## Notes
- WHO percentile data is bundled (first-year monthly values)
- Chart uses 480×260 SVG with proper axis labels
- Empty state shown when no growth data logged

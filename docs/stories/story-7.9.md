# STORY-7.9: NHS vaccination reminders

**Status:** COMPLETE (2026-05-16)

## Tasks

- [x] `server/src/data/nhsVaccinations.ts` — 17 NHS infant vaccination schedule entries (8w → 13y)
- [x] `VaccinationService.ts`:
  - `getScheduleForBaby(dob, completedNames)` — maps NHS schedule to due dates, marks completed
  - `evalVaccinationAlerts(profileRepo, healthRepo, alertRepo)` — creates `vaccination_due_<profileId>_<id>` alerts for overdue (≤30d) and upcoming (≤14d) vaccinations (deduped)
- [x] `GET /api/v1/health-log/:profileId/vaccinations` — returns schedule with due dates and completion status (empty array when no DOB set)
- [x] Wired into `reminder-eval` scheduler job
- [x] `VaccinationSchedule.tsx` — upcoming (overdue highlighted) and completed sections, "Mark done" button (admin only, logs vaccination health entry)
- [x] Added "Vaccinations" tab in ChildDetail for baby profiles
- [x] Jest `moduleNameMapper` added to strip `.js` extension for ts-jest compatibility

## Notes
- Vaccination completion detected by matching health_log entries of type `vaccination` by name
- Region-swappable structure: schedule is in separate data file

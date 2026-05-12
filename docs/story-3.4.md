# STORY-3.4: Day card details — WFH / school drop / vehicle / pet markers

**Status:** complete

## Tasks

- [ ] Create `GET /api/v1/home/day-summary?date=` endpoint
- [ ] DaySummary type: wfh, nursery, school pickup, vehicles, vet, bin collections
- [ ] DayCard badge strip from day-summary API
- [ ] Client hook `useDaySummary(date)`
- [ ] DayCard shows badges linked to source
- [ ] Filter panel toggles affect visibility
- [ ] Tests

## Notes

Dependent modules (STORY-4.4 events, STORY-6.4 vehicles, STORY-8.3 bins,
STORY-10.3 pets) are not yet implemented — endpoint returns empty arrays
for those. The structure and schema are established here for later stories
to populate.

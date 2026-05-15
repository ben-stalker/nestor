---
story: STORY-6.7
title: Transport adapter interface + UK National Rail stub
status: complete
---

## Tasks

- [x] Extend `JourneyEta` with `status` and `disruptions` fields
- [x] Update `UkNoOpAdapter` to return status/disruptions
- [x] Create `server/src/services/transport/adapterRegistry.ts`
- [x] Add `GET /api/v1/admin/transport-adapter` admin endpoint
- [x] Wire registry into journeys router and app.ts
- [x] Create `docs/plugins/transport-adapters.md`
- [x] Write tests (registry + admin endpoint)

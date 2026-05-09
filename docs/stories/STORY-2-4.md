# STORY-2.4: Permission matrix defaults per profile type

**Epic:** EPIC-2: App Shell, Navigation & Profile System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** S (1d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** sensible default permissions assigned automatically when I create a profile of a given type
**So that** I don't have to configure 25 permission keys per child manually

---

## Acceptance Criteria

- [ ] `server/src/services/permissionDefaults.ts` exports `defaultsFor(type: ProfileType): Record<PermissionKey, boolean>` returning a deterministic set per PRD §5 matrix
- [ ] On `POST /api/v1/profiles`, if `permissions_json` not provided in the body, `defaultsFor(input.type)` is applied automatically
- [ ] Admin can override any individual permission via `PATCH /api/v1/profiles/:id` (existing endpoint)
- [ ] Snapshot test asserts the generated defaults for every profile type match the matrix exactly
- [ ] `defaultsFor` is pure — no DB access, no side effects
- [ ] Default tables documented inline with the code

---

## Technical Implementation

### Files to create / modify

- `server/src/services/permissionDefaults.ts`
- `server/src/routes/profiles.ts` — call `defaultsFor` in the create handler when `permissions` is absent
- `server/tests/services/permissionDefaults.test.ts` — snapshot tests

### Implementation steps

1. From PRD §5 "Profile Permission Matrix", encode the matrix as a const map. A reasonable starting matrix derived from the PRD:

   | Key                    | admin | grandparent | teen | child | toddler | baby | guest |
   |------------------------|-------|-------------|------|-------|---------|------|-------|
   | view_calendar          | ✓     | ✓           | ✓    | ✓     | ✓       | ✗    | ✓     |
   | add_calendar_event     | ✓     | ✗           | ✓    | ✗     | ✗       | ✗    | ✗     |
   | edit_calendar_event    | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | delete_calendar_event  | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_food              | ✓     | ✓           | ✓    | ✓     | ✗       | ✗    | ✓     |
   | add_recipe             | ✓     | ✓           | ✓    | ✗     | ✗       | ✗    | ✗     |
   | add_to_shopping        | ✓     | ✓           | ✓ (pending approval) | ✗ | ✗ | ✗ | ✗ |
   | tick_shopping          | ✓     | ✓           | ✓    | ✓     | ✗       | ✗    | ✓     |
   | clear_shopping         | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_vehicles          | ✓     | ✓           | ✓    | ✗     | ✗       | ✗    | ✗     |
   | book_vehicle           | ✓     | ✗           | ✓    | ✗     | ✗       | ✗    | ✗     |
   | manage_vehicles        | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_chores            | ✓     | ✓           | ✓    | ✓     | ✓       | ✗    | ✓ (view-only) |
   | complete_chore         | ✓     | ✓           | ✓    | ✓     | ✓       | ✗    | ✗     |
   | manage_chores          | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_health_log        | ✓ (all) | ✓ (self)  | ✓ (self) | ✗ | ✗ | ✗ | ✗ |
   | add_health_log         | ✓     | ✓ (self)    | ✓ (self) | ✗ | ✗ | ✗ | ✗ |
   | view_finance           | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | manage_finance         | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_house             | ✓     | ✓           | ✓    | ✗     | ✗       | ✗    | ✓     |
   | manage_house           | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_pets              | ✓     | ✓           | ✓    | ✓     | ✓       | ✗    | ✓     |
   | manage_pets            | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | view_board             | ✓     | ✓           | ✓    | ✓     | ✗       | ✗    | ✓     |
   | post_board_message     | ✓     | ✓           | ✓    | ✓     | ✗       | ✗    | ✗     |
   | view_contacts          | ✓     | ✓           | ✓    | ✓ (emergency only) | ✗ | ✗ | ✓ |
   | manage_contacts        | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | manage_settings        | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |
   | manage_plugins         | ✓     | ✗           | ✗    | ✗     | ✗       | ✗    | ✗     |

   (✓ pending approval / view-only nuances are flagged in module-specific logic, not in this boolean matrix.)
2. Implement `defaultsFor(type)` returning the row above as a `Record<PermissionKey, boolean>`. For "self only" / "pending approval" cases, set the boolean to true and let the module enforce the additional scope.
3. Update `POST /api/v1/profiles` handler: if `body.permissions` is absent or empty, set `permissions_json = JSON.stringify(defaultsFor(body.type))`.
4. Snapshot tests: for each `ProfileType`, call `defaultsFor` and snapshot the result. Update snapshots only when the matrix is intentionally changed.

### Key technical details

- PRD §5 "Profile Permission Matrix" is the source of truth — review it carefully before encoding the table. The table above is a reasonable interpretation; defer to PRD on conflicts.
- "Pending approval" semantics for teen shopping additions are encoded in `shopping_items.pending_approval` (STORY-5.7), not in this boolean matrix — `add_to_shopping: true` for teens here is correct.
- "View self" for health log is enforced in STORY-7.6's route: `requirePermission('view_health_log')` plus `if (req.profile.type !== 'admin' && req.params.profileId !== String(req.profile.id)) return 403`.
- This service is pure — easy to unit-test, easy to refactor when the PRD evolves.

---

## Dependencies

- **Blocked by:** STORY-2.3
- **Blocks:** STORY-17.2 (admin profiles UI), STORY-19.2 (wizard profile builder)

---

## Test Checklist

- [ ] Unit: `defaultsFor('admin')` matches snapshot
- [ ] Unit: `defaultsFor('child')` matches snapshot (no admin-only permissions true)
- [ ] Unit: every key in `ALL_PERMISSIONS` is present in every type's defaults
- [ ] Integration: `POST /api/v1/profiles` without `permissions` populates from defaults
- [ ] Integration: `POST` with explicit `permissions` overrides defaults
- [ ] Integration: `PATCH` allows admin to flip individual permission booleans

---

## Notes

- Snapshot files live under `server/tests/services/__snapshots__/`.
- This is a deterministic single source — every other test that needs a child profile can rely on `defaultsFor('child')`.

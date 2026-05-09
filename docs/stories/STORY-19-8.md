# STORY-19.8: In-app update mechanism

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to update Nestor with one tap when an update is available
**So that** I don't need a terminal

---

## Acceptance Criteria

- [ ] Scheduler nightly job polls GitHub Releases; sets `app_settings.update_available_version`
- [ ] Admin → System shows update badge (rendered by STORY-17.9)
- [ ] `POST /api/v1/system/update`: download tarball, verify SHA256, extract to `~/.nestor/releases/v{new}`, run new migrations, symlink `current`, `systemctl restart nestor-server`
- [ ] Previous release retained for rollback (last 2 versions kept)
- [ ] `POST /api/v1/system/rollback` reverts symlink + restarts
- [ ] Admin-pin required for update + rollback

---

## Technical Implementation

### Files to create / modify

- `server/src/services/UpdateService.ts`
- `server/src/scheduler/jobs/updateCheck.ts`
- `server/src/routes/system.ts` — extend with `update` and `rollback`
- `install/scripts/update-runner.sh` — handles file extraction (server invokes via child_process)
- `server/tests/services/UpdateService.test.ts`

### Implementation steps

1. Update check job (cron `0 3 * * *`): fetch GitHub releases JSON, find latest semver > current; set `app_settings.update_available_version`.
2. Update endpoint:
```ts
router.post('/update', requireAdminPin, async (req, res) => {
  const target = await settings.get('update_available_version');
  if (!target) return res.status(409).json({ error: 'no_update_available' });
  await updateService.applyUpdate(target);
  res.status(202).json({ status: 'updating' });
});
```
3. `applyUpdate`:
   - Download tarball from GitHub release URL.
   - Verify SHA256 against release asset.
   - Extract to `~/.nestor/releases/v{version}`.
   - Run `npm install --production` inside extracted dir.
   - Switch `~/.nestor/current` symlink.
   - Run new migrations (`npm run db:migrate`).
   - `systemctl restart nestor-server.service`.
4. Rollback:
```ts
router.post('/rollback', requireAdminPin, async (_req, res) => {
  await updateService.rollback();
  res.status(202).json({ status: 'rolling_back' });
});
```
   Switch symlink to previous; restart.
5. Retain only last 2 versions (cleanup older).
6. Tests with mocked GitHub + `child_process.exec` mocks.

### Key technical details

- Architecture §"In-app updates".
- SHA256 verification mandatory.
- Migration must succeed inside the new extracted release before symlink switch (rollback-safe).
- `systemctl` requires the nestor user to have NOPASSWD sudo for `systemctl restart nestor-server.service` — install script configures this.

---

## Dependencies

- **Blocked by:** STORY-19.6, STORY-1.11
- **Blocks:** STORY-17.9 (system panel button)

---

## Test Checklist

- [ ] Unit: update check sets app_settings.update_available_version
- [ ] Unit: update endpoint requires admin pin
- [ ] Unit: SHA256 mismatch aborts
- [ ] Unit: rollback switches symlink
- [ ] Unit: only last 2 versions retained
- [ ] Manual: fake release tested end-to-end on dev machine

---

## Notes

- Failures during update revert the symlink and restart the previous version automatically.
- Migrations are append-only (STORY-1.3) so older versions don't choke on newer DB schema (in MVP — Phase 2 gets schema versioning).

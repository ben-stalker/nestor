# STORY-19.9: JSON export / import + factory reset

**Epic:** EPIC-19: Setup Wizard & Installation
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to export all my data as JSON and re-import (or wipe) it
**So that** backup and migration are possible without command-line skills

---

## Acceptance Criteria

- [ ] `POST /api/v1/system/backup` streams a JSON download with all tables + photo manifest
- [ ] `POST /api/v1/system/restore` accepts an upload, validates schema version, replaces DB
- [ ] `POST /api/v1/system/factory-reset` deletes DB + uploads + restarts in wizard mode
- [ ] All actions PIN-protected and double-confirmed (admin pin required)
- [ ] Photos referenced by manifest entries; restore walks the manifest

---

## Technical Implementation

### Files to create / modify

- `server/src/services/BackupService.ts`
- `server/src/routes/system.ts` — extend with backup/restore/factory-reset
- `server/src/utils/schemaVersion.ts` — current DB schema version constant
- `server/tests/services/BackupService.test.ts`

### Implementation steps

1. Backup format:
```json
{
  "schema_version": 1,
  "exported_at": 1704067200,
  "tables": { "profiles": [...], "calendar_events": [...], ... },
  "photos": [{ "path": "uploads/recipes/abc.webp", "sha256": "..." }]
}
```
2. Backup endpoint streams JSON via `JSONStream` to avoid memory blow-up on large DBs.
3. Restore:
   - Parse upload (max 100MB).
   - Validate `schema_version` matches current.
   - Wipe DB (or use a transactional rebuild).
   - Insert all rows by table.
   - Verify photo manifest matches files on disk; warn missing.
4. Factory reset:
   - Wipe DB file, uploads dir.
   - Set `setup_complete=false` in fresh DB.
   - Restart server.
5. All endpoints require admin pin; double-confirmation enforced client-side.
6. Tests: backup → restore round-trip preserves data; mismatched schema rejected; factory reset wipes.

### Key technical details

- Streaming JSON keeps memory bounded.
- Restore is destructive — explicit warning + double-confirm.
- Photo files NOT bundled in JSON (would bloat it); manifest only — separate ZIP could carry photos in a later iteration.

---

## Dependencies

- **Blocked by:** STORY-1.5
- **Blocks:** STORY-17.9 (system panel buttons), STORY-20.4 (E2E covers backup flow)

---

## Test Checklist

- [ ] Unit: backup streams expected shape
- [ ] Unit: restore replaces DB
- [ ] Unit: schema mismatch rejected
- [ ] Unit: factory reset wipes
- [ ] Unit: admin pin required
- [ ] Manual: round-trip on a populated DB

---

## Notes

- Photo bundling is a P2 enhancement (single ZIP).
- Restore could optionally merge instead of replace — that's a Phase 2 decision.

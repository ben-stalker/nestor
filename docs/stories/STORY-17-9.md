# STORY-17.9: System admin panel (version, update, backup, factory reset)

**Epic:** EPIC-17: Admin & Settings
**Sprint:** 9 — MVP cut
**Estimate:** L (3d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to see version, available updates, export/import JSON backup, factory reset
**So that** I can manage the system

---

## Acceptance Criteria

- [ ] Version + update-available badge (reads `app_settings.update_available_version`)
- [ ] "Update now" button (calls `POST /api/v1/system/update`) — confirmation modal
- [ ] Export JSON backup (downloads file)
- [ ] Import JSON backup with confirmation (replaces DB)
- [ ] Factory reset behind double confirmation; wipes DB, retains nothing
- [ ] Tailscale and Syncthing status panels (read-only — link to install docs)
- [ ] Permission: admin only with admin-pin re-auth

---

## Technical Implementation

### Files to create / modify

- `client/src/admin/sections/SystemPanel.tsx`
- `server/src/routes/system.ts` — `version`, `update`, `backup`, `restore`, `factory-reset` endpoints (some land in STORY-19.8/19.9)
- `client/src/api/system.ts`
- `server/tests/routes/system.test.ts`

### Implementation steps

1. UI:
   - Version card with "Update available: vX" badge if applicable; "Update now" CTA.
   - Backup card: "Export backup" downloads a JSON via STORY-19.9 endpoint; "Import backup" file input.
   - Factory reset card: red warning + double-confirmation modal.
   - Tailscale / Syncthing: query their CLI/HTTP for status (e.g. `tailscale status --json`), render result; link to docs if not installed.
2. Server endpoints largely delegate to STORY-19.8 (update) and STORY-19.9 (backup/restore/factory-reset).
3. Tailscale/Syncthing checks shell out (best-effort; gracefully say "not installed").
4. Tests: version returned; update endpoint requires admin; restore validates schema.

### Key technical details

- Update endpoint is shared with STORY-19.8 implementation.
- Factory reset must restart the server in wizard mode (`app_settings.setup_complete = false`).
- Tailscale `tailscale status --json` produces JSON; parse for connectivity. Failures logged, UI shows "Not configured".

---

## Dependencies

- **Blocked by:** STORY-17.1, STORY-19.6, STORY-19.8, STORY-19.9
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: version visible
- [ ] RTL: update available badge when set
- [ ] RTL: backup downloads file
- [ ] RTL: factory reset double-confirms
- [ ] RTL: tailscale status visible (or "Not installed")
- [ ] Unit: update endpoint admin-pin required

---

## Notes

- Tailscale/Syncthing UI is informational only; no install/configure flow in MVP.
- Backup file format documented in STORY-19.9.

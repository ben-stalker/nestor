# EPIC-30: In-App Update System

**Status:** backlog  
**Priority:** 11

## Overview

PRD Section 29. Nestor should update itself with a single tap. Nightly check against GitHub Releases, update badge in admin, one-tap update that pulls, migrates, and restarts with rollback capability.

## Stories

### STORY-30.1: Update check service

- `UpdateService` polls `https://api.github.com/repos/ben-stalker/nestor/releases/latest` nightly at 03:00
- Compares `tag_name` against current `version` in `package.json`
- Stores result in `app_settings`: `update_available` (bool), `latest_version`, `release_notes`, `checked_at`
- Respects GitHub rate limit (unauthenticated: 60 req/hr — one nightly check is fine)

### STORY-30.2: Update badge & notification

- Admin nav item shows a badge when `update_available = true`
- Admin → System panel: "Update available: v1.2.3" card with changelog (from GitHub release body)
- "Update now" button — confirms with a modal ("Nestor will restart. This takes ~60 seconds.")

### STORY-30.3: Update execution

- `POST /api/v1/admin/system/update` triggers the update sequence:
  1. `git pull --rebase origin main` in `/opt/nestor/app`
  2. `npm install --production`
  3. `npm run build`
  4. Run any new migrations via `migrate` service
  5. `systemctl restart nestor.service`
- Progress streamed to client via SSE (`/api/v1/admin/system/update/progress`)
- Admin UI shows live log lines during update

### STORY-30.4: Rollback

- Before pulling: `git stash` current state and note previous commit SHA in `app_settings.previous_version_sha`
- If update fails: auto-rollback to previous SHA, restart, surface error in admin
- Manual rollback button in admin for 24h after a successful update

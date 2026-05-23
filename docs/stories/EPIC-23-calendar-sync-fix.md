# EPIC-23: Calendar Sync Fix

**Status:** backlog  
**Priority:** 4

## Overview

Apple iCloud CalDAV was configured during setup but no events appeared. The CalDAV provider implementation needs diagnosis and hardening. Sync status also needs to be visible so the user knows whether a calendar is connected and actively syncing.

## Known issue

Apple iCloud CalDAV uses a URL of `https://caldav.icloud.com` with username = Apple ID email and password = an app-specific password (not the Apple ID password). The setup wizard may not be prompting for the right credential type, or the URL discovery may be failing silently.

## Stories

### STORY-23.1: Diagnose and fix Apple iCloud CalDAV

- Add verbose error logging to `BasicAuthCalDAVProvider.ts` — log the specific HTTP error, URL attempted, and calendar count discovered
- Expose a `GET /api/v1/calendar/accounts/:id/test` endpoint that runs the provider connection test and returns a structured result (`{ ok, error, calendarsFound }`)
- Add a "Test connection" button in Admin → Calendar next to each account
- Common Apple issues to handle:
  - URL must be `https://caldav.icloud.com` — verify this is what's stored
  - The `tsdav` `fetchCalendars` may need `fetchPrincipalUrl: true` for iCloud — test and add if needed
  - App-specific passwords only — update setup wizard copy to make this explicit with a link to appleid.apple.com
  - Some iCloud accounts require sending the Apple ID without the `@icloud.com` suffix — test both forms

### STORY-23.2: Sync status visibility

- Add `last_synced_at` and `last_sync_error` columns to `calendar_accounts` table (migration)
- After each sync attempt, write the timestamp and any error message
- Admin → Calendar shows per-account: "Last synced X minutes ago" or "Sync error: [message]" in red
- Home screen shows a subtle sync indicator (small spinner/dot) when a sync is in progress

### STORY-23.3: Sync reliability

- CalDAV sync currently runs on a fixed interval — add exponential backoff on consecutive errors (max 1 hour)
- Add a "Sync now" button in Admin → Calendar
- Ensure sync runs once on server startup (currently only on interval)
- Log sync results to server log with calendar name and event count for debugging

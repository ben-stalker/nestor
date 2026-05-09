# STORY-14.1: Alerts schema + repository

**Epic:** EPIC-14: Alert System
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** the `alerts` table with dismissed/severity columns and an indexed query
**So that** alerts can be aggregated efficiently

---

## Acceptance Criteria

- [ ] Migration `server/migrations/003_alerts.sql` creates the `alerts` table per Architecture §"Data Model": `id INTEGER PRIMARY KEY`, `source_module TEXT NOT NULL`, `alert_type TEXT NOT NULL`, `severity TEXT NOT NULL CHECK(severity IN ('urgent','warning','info','success'))`, `message TEXT NOT NULL`, `profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL`, `dismissed INTEGER NOT NULL DEFAULT 0`, `dismissed_at INTEGER`, `created_at INTEGER NOT NULL`, `nav_mode_badge TEXT`
- [ ] Index `CREATE INDEX idx_alerts_dismissed ON alerts(dismissed, created_at)`
- [ ] Additional index for dedup: `CREATE INDEX idx_alerts_dedup ON alerts(source_module, alert_type, profile_id, created_at)`
- [ ] `AlertRepository` extends `BaseRepository` with: `push(input)`, `findActive(profileId?)`, `dismiss(id)`, `badgeCounts()`, `purgeOlderThan(days)`
- [ ] `push()` deduplicates by tuple `(source_module, alert_type, profile_id, day_bucket)` so the same alert doesn't fire twice in the same day
- [ ] `findActive` excludes dismissed and orders by `created_at DESC`
- [ ] `badgeCounts()` returns `Record<navMode, number>` keyed by `nav_mode_badge` for active alerts
- [ ] `purgeOlderThan(days)` deletes dismissed alerts older than N days (defaults 30)
- [ ] Unit tests cover push + dedup + dismiss + badge counts

---

## Technical Implementation

### Files to create / modify

- `server/migrations/003_alerts.sql`
- `server/src/repositories/AlertRepository.ts`
- `server/src/types/alert.ts` — `Alert`, `AlertInput`, `Severity`, Zod schemas
- `server/src/core/eventBus.types.ts` — refine `Alert` type for `alert:new` payload
- `server/tests/repositories/AlertRepository.test.ts`

### Implementation steps

1. Author migration with the exact schema and both indexes per AC.
2. `server/src/types/alert.ts`:
```ts
export type Severity = 'urgent' | 'warning' | 'info' | 'success';
export interface Alert { id: number; sourceModule: string; alertType: string; severity: Severity; message: string; profileId: number | null; dismissed: boolean; dismissedAt: number | null; createdAt: number; navModeBadge: string | null; }
export interface AlertInput { sourceModule: string; alertType: string; severity: Severity; message: string; profileId?: number; navModeBadge?: string; }
```
3. `AlertRepository`:
   - `push(input)`:
     - Compute `dayBucket = Math.floor(now / 86_400_000)` (day index since epoch).
     - `SELECT id FROM alerts WHERE source_module=? AND alert_type=? AND IFNULL(profile_id,0)=IFNULL(?,0) AND created_at >= ? AND dismissed=0` with `dayStart = dayBucket * 86_400_000`.
     - If a row exists, return existing id (no insert).
     - Else `INSERT INTO alerts (source_module, alert_type, severity, message, profile_id, created_at, nav_mode_badge) VALUES (?, ?, ?, ?, ?, ?, ?)`. Return new row's id.
   - `findActive(profileId?)`: `SELECT * FROM alerts WHERE dismissed=0 AND (profile_id IS NULL OR profile_id=?) ORDER BY created_at DESC`. Map to typed objects.
   - `dismiss(id)`: `UPDATE alerts SET dismissed=1, dismissed_at=? WHERE id=? AND dismissed=0`.
   - `badgeCounts()`: `SELECT nav_mode_badge, COUNT(*) FROM alerts WHERE dismissed=0 AND nav_mode_badge IS NOT NULL GROUP BY nav_mode_badge`. Map to record.
   - `purgeOlderThan(days)`: `DELETE FROM alerts WHERE dismissed=1 AND dismissed_at < ?`.
4. Author tests covering: insert, dedup same-day, allow next-day, dismiss + badgeCounts decrement, profile-scoped find, purge.

### Key technical details

- Architecture §"Component 5: Alert Engine" defines this contract.
- Day bucketing uses local UTC (epoch / 86_400_000) — acceptable for dedup. If a user wanted strict timezone bucketing they'd see at most one extra dedup edge per timezone shift.
- `nav_mode_badge` is set by the source module (e.g. `'calendar'`, `'house'`) so the navbar badge counts (STORY-14.6) can attribute alerts to the right mode.
- The actual `AlertEngine` service that orchestrates push + event emission lands in STORY-14.2; this story just provides the data layer.
- `purgeOlderThan` is invoked by a scheduled job in STORY-14.3 (or later) to keep the alerts table small.

---

## Dependencies

- **Blocked by:** STORY-1.5, STORY-2.1
- **Blocks:** STORY-14.2, STORY-14.4

---

## Test Checklist

- [ ] Unit: `push` inserts new row
- [ ] Unit: `push` returns existing id when same `(source, type, profileId)` pushed twice same day
- [ ] Unit: `push` inserts new row when same tuple pushed on a different day
- [ ] Unit: `findActive` returns only `dismissed=0`, ordered desc
- [ ] Unit: `findActive(profileId)` filters profile-scoped + null-profile alerts
- [ ] Unit: `dismiss` flips dismissed, badgeCounts decrement
- [ ] Unit: `badgeCounts` aggregates by `nav_mode_badge`
- [ ] Unit: `purgeOlderThan(0)` deletes all dismissed; non-dismissed survive

---

## Notes

- Severity colour mapping is a UI concern (STORY-14.6).
- Plugin alerts (STORY-14.7) prefix their `source_module` with `plugin:<id>` for clean filtering.

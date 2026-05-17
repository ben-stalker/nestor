# STORY-14.6: Severity colour coding + nav badges

**Epic:** EPIC-14: Alert System
**Sprint:** 5 — Calendar Polish + House Foundation + Vehicles
**Estimate:** S (1d)
**Priority:** P1
**Status:** complete

---

## User Story

**As a** household member
**I want** alerts visibly coloured by severity and reflected in nav-mode badges
**So that** urgency is obvious

---

## Acceptance Criteria

- [ ] CSS tokens for severity: `--alert-urgent` (red), `--alert-warning` (amber), `--alert-info` (blue), `--alert-success` (green)
- [ ] Tailwind classes `border-alert-urgent`, `bg-alert-urgent/10`, etc. available
- [ ] Nav buttons show numeric badge for unread alerts in their `nav_mode_badge`
- [ ] Badge colour reflects highest severity unread alert in that mode
- [ ] Clicking nav mode marks alerts in that mode as "read" (read != dismissed; persisted in `alerts.read_at`)
- [ ] Badge count source: `useBadgeCounts()` hook (TanStack Query against `/api/v1/alerts/badge-counts`) refreshed on WS frame
- [ ] AlertCard from STORY-3.6 uses these tokens for left border

---

## Technical Implementation

### Files to create / modify

- `client/src/styles/tokens.css` — extend with alert tokens
- `client/tailwind.config.ts` — extend `theme.extend.colors`
- `client/src/core/Navbar.tsx` — render badges (extends STORY-2.7)
- `client/src/alerts/api.ts` — extend with `markRead(navMode)` mutation
- `server/src/routes/alerts.ts` — `POST /alerts/mark-read?navMode=` endpoint
- `server/migrations/00X_alerts_read_at.sql` — add `read_at INTEGER`
- `client/tests/core/Navbar.test.tsx`

### Implementation steps

1. Add CSS tokens:
```css
:root {
  --alert-urgent: #dc2626;
  --alert-warning: #d97706;
  --alert-info: #2563eb;
  --alert-success: #16a34a;
}
```
2. Tailwind config extension:
```ts
colors: { alert: { urgent: 'var(--alert-urgent)', warning: 'var(--alert-warning)', info: 'var(--alert-info)', success: 'var(--alert-success)' } }
```
3. Migration adds `read_at INTEGER` column to alerts.
4. `findActive` returns alerts including `read_at`; badge counts query counts non-dismissed (read or not), but the badge colour uses unread-only counts.
5. `POST /alerts/mark-read?navMode=house` sets `read_at = now()` for all active alerts in that mode for this profile.
6. `Navbar` reads `useBadgeCounts()`:
```tsx
{nav.modes.map(m => <NavButton mode={m} count={counts[m] ?? 0} severity={highestSeverity[m]} />)}
```
7. Badge rendered as small filled circle in top-right of icon, coloured by severity.
8. Tests: counts render; tap mode resets count; reduced-motion stable.

### Key technical details

- "Read" vs "dismissed": opening the mode marks alerts read (clears the badge); user must explicitly dismiss to remove from the strip.
- Highest-severity-wins for badge colour: urgent > warning > info > success.
- Badge counts and severities come back together in the same endpoint to keep round-trips low.

---

## Dependencies

- **Blocked by:** STORY-14.4, STORY-2.7
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: badge renders count when > 0
- [ ] Unit: badge hidden when 0
- [ ] Unit: tap mode → mark-read mutation called
- [ ] Unit: highest-severity alert dictates badge colour
- [ ] Unit: WS alert:new triggers badge refresh
- [ ] Manual: navbar shows red dot when urgent alert present

---

## Notes

- The mark-read endpoint clears badges but keeps the alerts visible in `<AlertsStrip>` until explicitly dismissed.
- Severity tokens are reused by `<AlertCard>` (STORY-3.6).

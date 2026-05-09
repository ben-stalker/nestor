# STORY-9.5: End-date alerts (mortgage, agreements, insurance)

**Epic:** EPIC-9: Finance Module
**Sprint:** 8 — Finance, EV, Board, Settings shell
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** advance alerts when fixed rates / agreements / insurance are ending
**So that** I have time to shop around

---

## Acceptance Criteria

- [ ] Reminder hook (registered with STORY-14.3) evaluates `fixed_rate_end_date`, `end_date`, vehicle insurance dates
- [ ] Default windows: mortgage 6mo/3mo/1mo/2wk, agreement 3mo/1mo/2wk, insurance 4wk/2wk/3d
- [ ] Per-record `alert_lead_days` override
- [ ] Alerts dismissed individually
- [ ] Pushed via AlertEngine with `nav_mode_badge='finance'` (or `vehicles` for vehicle insurance)

---

## Technical Implementation

### Files to create / modify

- `server/src/services/finance/reminders.ts`
- `server/tests/services/finance/reminders.test.ts`

### Implementation steps

1. Hook iterates active agreements and pushes when `daysUntil` matches an entry in `windows`:
```ts
const windows = {
  mortgage: [180, 90, 30, 14],
  pcp: [90, 30, 14],
  loan: [60, 30, 14],
  bnpl: [30, 14, 7],
  credit_card: [30, 7],
  other: [30, 14],
};
for (const a of await agreementRepo.list({ active: true })) {
  for (const dateKey of ['fixed_rate_end_date', 'end_date'] as const) {
    const date = a[dateKey];
    if (!date) continue;
    const days = Math.ceil((date - now.getTime()) / 86_400_000);
    const w = a.alert_lead_days ? [a.alert_lead_days, Math.ceil(a.alert_lead_days/2), 14, 3] : windows[a.type];
    if (w.includes(days)) {
      await alertEngine.push({ source:'finance', source_module:'finance', alert_type:`finance_${dateKey}`, severity: days <= 14 ? 'warning' : 'info', message: i18n.t(`alerts.finance.${dateKey}`,{ name:a.name, days }), nav_mode_badge:'finance', deep_link: `/finance/agreements/${a.id}` });
    }
  }
}
```
2. Vehicle insurance alerts already covered by STORY-6.6 — skipped here (or shared module if cleaner).
3. Tests with frozen time crossing each window.

### Key technical details

- All severities chosen to escalate with imminence.
- Dedup via STORY-14.1 day-bucket per (alert_type, agreement_id).
- Per-record override takes precedence over type defaults.

---

## Dependencies

- **Blocked by:** STORY-9.2, STORY-14.3
- **Blocks:** —

---

## Test Checklist

- [ ] Unit: mortgage 180 days out → alert pushed
- [ ] Unit: PCP 30 days out → alert pushed
- [ ] Unit: dedup prevents second push same day
- [ ] Unit: per-record override [60,30,7] used instead of type default
- [ ] Unit: agreement with no end_date → no alert

---

## Notes

- The list of windows is intentionally conservative; users can tune via STORY-17.10.
- Vehicle insurance handled by STORY-6.6 to keep finance module's alerts focused.

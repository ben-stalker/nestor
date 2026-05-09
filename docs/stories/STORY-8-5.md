# STORY-8.5: Subscription tracker

**Epic:** EPIC-8: House Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to log subscriptions with renewal dates and monthly cost
**So that** I see total monthly subscription spend

---

## Acceptance Criteria

- [ ] CRUD endpoints under `/api/v1/subscriptions` (admin only for write)
- [ ] List view with running monthly total (yearly subscriptions divided by 12)
- [ ] Renewal alert (default 7d before; configurable per subscription)
- [ ] Trial-end alert (3d before)
- [ ] Categories: streaming, software, services, other (configurable in admin)
- [ ] Hooks into reminder evaluator (STORY-14.3)
- [ ] Currency formatted via `formatCurrency` (STORY-18.2)

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/subscriptions.ts`
- `server/src/services/subscriptions/reminders.ts`
- `client/src/house/Subscriptions.tsx`
- `client/src/house/SubscriptionForm.tsx`
- `client/src/api/subscriptions.ts`
- `server/tests/routes/subscriptions.test.ts`

### Implementation steps

1. Routes: standard CRUD against `SubscriptionRepository` (STORY-8.1).
2. Reminder hook:
```ts
export async function evaluateReminders(now: Date) {
  const subs = await subRepo.list({ active: true });
  for (const s of subs) {
    const daysToRenewal = Math.ceil((s.renewal_date - now.getTime()) / 86_400_000);
    if (daysToRenewal === 7) await alertEngine.push({ source:'house', source_module:'subscriptions', alert_type:'sub_renewal_7d', severity:'info', message: i18n.t('alerts.sub.renewal',{ name:s.name, days:7, amount: formatCurrency(s.amount_minor/100,s.currency) }), nav_mode_badge:'house', deep_link:`/house/subscriptions/${s.id}` });
    if (s.trial_end_date) {
      const daysToTrialEnd = Math.ceil((s.trial_end_date - now.getTime()) / 86_400_000);
      if (daysToTrialEnd === 3) await alertEngine.push({ /* trial_ending */ });
    }
  }
}
```
3. List view: rows with name + category + amount + renewal countdown; running monthly total at top.
4. Form: name, category, amount, currency, cycle (monthly/yearly/weekly), renewal date, trial end date (optional), per-sub alert lead time.
5. Tests: 7-day renewal pushes alert once; trial end alert; permission gating.

### Key technical details

- Yearly cycle: `monthlyEquivalent = amount_minor / 12`.
- Monthly total = sum of monthlyEquivalent over active subscriptions.
- Reminder dedup per day via STORY-14.1.
- Per-sub override of `7d` is `alert_lead_days` column (add via migration patch if not in 8.1).

---

## Dependencies

- **Blocked by:** STORY-8.1, STORY-14.3
- **Blocks:** STORY-9.3 (monthly summary aggregates subscriptions)

---

## Test Checklist

- [ ] Unit: CRUD round-trip
- [ ] Unit: 7-day reminder fires
- [ ] Unit: trial-end reminder fires
- [ ] Unit: monthly total = sum of monthly equivalents
- [ ] Unit: yearly cycle divided by 12
- [ ] RTL: form submit → list updates
- [ ] RTL: per-sub lead-time overrides default

---

## Notes

- Subscription cancellation guidance is community knowledge; future P2 link to "How to cancel" docs.
- A future toggle to import from bank statement is plugin scope.

# STORY-8.6: Home maintenance log

**Epic:** EPIC-8: House Module
**Sprint:** 7 — Family + Pets + Contacts + House Polish
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** household admin
**I want** to log completed jobs, warranties, and scheduled maintenance
**So that** I keep the house in good shape

---

## Acceptance Criteria

- [ ] CRUD endpoints under `/api/v1/maintenance`
- [ ] Types: `job` (completed), `warranty` (expiry tracker), `reminder` (next due)
- [ ] Renter mode flag (`app_settings.renter_mode`): replaces "Book tradesperson" CTA with "Report to landlord"
- [ ] Link to Contacts entry for tradesperson via `<ContactPicker category="trade">`
- [ ] Reminder alerts via reminder evaluator: `next_due_date - reminder_days_before`
- [ ] Permission: admin/teen create; child read-only

---

## Technical Implementation

### Files to create / modify

- `server/src/routes/maintenance.ts`
- `server/src/services/maintenance/reminders.ts`
- `client/src/house/Maintenance.tsx`
- `client/src/house/MaintenanceForm.tsx`
- `client/src/api/maintenance.ts`
- `server/tests/routes/maintenance.test.ts`

### Implementation steps

1. CRUD routes against `HomeMaintenanceRepository` (STORY-8.1).
2. Reminder hook:
```ts
export async function evaluateReminders(now: Date) {
  const items = await maintRepo.list({ type: ['warranty','reminder'] });
  for (const m of items) {
    const due = m.type === 'warranty' ? m.warranty_expiry : m.next_due_date;
    if (!due) continue;
    const days = Math.ceil((due - now.getTime()) / 86_400_000);
    const lead = m.reminder_days_before ?? 30;
    if ([lead, Math.ceil(lead/2), 7, 1].includes(days)) {
      await alertEngine.push({ source:'house', source_module:'maintenance', alert_type:`maintenance_${m.type}`, severity: days <= 7 ? 'warning' : 'info', message: i18n.t(`alerts.maintenance.${m.type}`, { name: m.name, days }), nav_mode_badge: 'house', deep_link: `/house/maintenance/${m.id}` });
    }
  }
}
```
3. Form: type select; conditional fields (warranty_expiry, next_due_date, completed_at); contact picker (trade category).
4. Renter mode: when `app_settings.renter_mode === true`, hide "Book tradesperson" and show "Report to landlord" CTA opening landlord contact picker.
5. List view grouped by type (open jobs, warranties, scheduled).
6. Tests: each type CRUD; reminder windows; renter mode flag affects rendered CTA.

### Key technical details

- PRD §14.
- Renter mode globally toggleable in admin (STORY-17.5 display panel or separate house panel).
- ContactPicker component lands in STORY-12.4 — until then, plain text field works as a stub.
- Maintenance items can be linked to a vehicle (e.g. car service) — `linked_vehicle_id` column allowed.

---

## Dependencies

- **Blocked by:** STORY-8.1, STORY-12.1
- **Blocks:** STORY-12.4 (contact picker connects), STORY-3.4 (day card markers)

---

## Test Checklist

- [ ] Unit: warranty type CRUD
- [ ] Unit: reminder type CRUD
- [ ] Unit: job type CRUD (completed_at)
- [ ] Unit: warranty expiring in 30 days → alert pushed
- [ ] Unit: renter_mode CTA changes
- [ ] RTL: form shows type-specific fields
- [ ] RTL: contact picker invoked

---

## Notes

- The same `linked_contact_id` mechanism is reused for pets' vet (STORY-10.2).
- A "next service date based on mileage" is for vehicles (STORY-6.6), not maintenance.

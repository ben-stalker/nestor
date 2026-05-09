# STORY-6.6: Vehicle reminders (MOT, tax, insurance, service)

**Epic:** EPIC-6: Vehicles & Travel Module
**Sprint:** 6 — Vehicles, Food, Family Foundations
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** vehicle owner
**I want** alerts in advance of MOT, tax, insurance, service due
**So that** nothing lapses

---

## Acceptance Criteria

- [ ] Reminder evaluator (STORY-14.3) calls `vehicles.evaluateReminders(now)` hook
- [ ] Hook reads each vehicle's renewal dates against `app_settings.reminder_windows.vehicles`
- [ ] Default windows: MOT 30/14/7/1d, insurance 28/14/3d, tax 14/3/1d, service when within 7d or 500mi of mileage
- [ ] Per-vehicle override possible (add `reminder_overrides_json` column to vehicles)
- [ ] Pushes alerts via AlertEngine with `nav_mode_badge='vehicles'`
- [ ] Dedup per day per vehicle per category
- [ ] Mileage-based service reminder: if `current_mileage >= service_due_mileage - 500`, push

---

## Technical Implementation

### Files to create / modify

- `server/src/services/vehicles/reminders.ts`
- `server/migrations/00X_vehicles_reminder_overrides.sql` (column added to vehicles)
- `server/tests/services/vehicles/reminders.test.ts`

### Implementation steps

1. Hook:
```ts
export async function evaluateReminders(now: Date) {
  const vehicles = await vehicleRepo.list({ active: true });
  const windows = await settings.get('reminder_windows.vehicles') ?? defaultWindows;
  let pushed = 0;
  for (const v of vehicles) {
    for (const cat of ['mot','tax','insurance','service'] as const) {
      const dueDate = v[`${cat}_due`];
      if (!dueDate) continue;
      const daysAway = Math.ceil((dueDate - now.getTime()) / 86_400_000);
      const w = (v.reminder_overrides_json?.[cat]) ?? windows[cat];
      if (w.includes(daysAway)) {
        await alertEngine.push({ source: 'vehicles', source_module: 'vehicles', alert_type: `vehicle_${cat}`, severity: daysAway <= 1 ? 'urgent' : daysAway <= 7 ? 'warning' : 'info',
          message: i18n.t(`alerts.vehicle.${cat}`, { name: v.nickname, days: daysAway }),
          nav_mode_badge: 'vehicles', deep_link: `/vehicles/${v.id}` });
        pushed++;
      }
    }
    // Mileage-based service
    if (v.service_due_mileage && v.current_mileage && v.service_due_mileage - v.current_mileage <= 500) {
      await alertEngine.push({ /* service mileage alert */ });
      pushed++;
    }
  }
  return { pushed };
}
```
2. Register hook in `vehicles` module bootstrap.
3. Tests: with frozen time, vehicles with various due dates → expected alerts pushed; dedup.

### Key technical details

- Windows are arrays of integer days; alert fires only on exact match days (so user gets a clear 30/14/7/1 cadence, not noise every day).
- Mileage triggers once when crossing the 500-mile threshold; dedup by day-bucket prevents spam.
- All strings i18n'd.

---

## Dependencies

- **Blocked by:** STORY-6.1, STORY-14.3
- **Blocks:** STORY-3.4 (day card uses these alerts to render)

---

## Test Checklist

- [ ] Unit: 30 days before MOT pushes once
- [ ] Unit: 31 days before MOT pushes nothing (not in window)
- [ ] Unit: 1 day before MOT severity 'urgent'
- [ ] Unit: per-vehicle override [60,30] used instead of defaults
- [ ] Unit: mileage trigger when within 500mi of service
- [ ] Unit: dedup blocks second push same day

---

## Notes

- Bicycles have no MOT/tax/insurance — those columns are null and skipped.
- EVs may not have MOT in some regions — document that the column is optional.

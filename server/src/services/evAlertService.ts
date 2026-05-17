import type VehicleRepository from '../repositories/VehicleRepository';
import type EvChargingRepository from '../repositories/EvChargingRepository';
import type AlertRepository from '../repositories/AlertRepository';

export default function evaluateEvPlugInAlerts(
  vehicleRepo: VehicleRepository,
  evRepo: EvChargingRepository,
  alertRepo: AlertRepository,
): void {
  const now = new Date();
  const todayStart = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000,
  );
  const todayEnd = todayStart + 86400;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat — matches JS convention; stored same in DB

  const vehicles = vehicleRepo.list();

  vehicles.forEach((vehicle) => {
    if (vehicle.type !== 'ev') return;
    if (!vehicle.plug_in_reminder_time || !vehicle.plug_in_reminder_days) return;

    // Check if today is a reminder day
    if (!vehicle.plug_in_reminder_days.includes(dayOfWeek)) return;

    // Parse reminder time
    const [hh, mm] = vehicle.plug_in_reminder_time.split(':').map(Number);
    const reminderMinutes = hh * 60 + mm;
    if (currentMinutes < reminderMinutes) return;

    // Check if snoozed
    if (
      vehicle.plug_in_snoozed_until !== null &&
      now.getTime() / 1000 < vehicle.plug_in_snoozed_until
    )
      return;

    // Check if a charging session was already logged today
    const todaySessions = evRepo
      .listForMonth(now.getFullYear(), now.getMonth() + 1, vehicle.id)
      .filter((s) => s.session_date >= todayStart && s.session_date < todayEnd);
    if (todaySessions.length > 0) return;

    // Deduplicate — one alert per vehicle per day
    const alertType = `ev_plug_in:${vehicle.id}`;
    const dateKey = now.toISOString().split('T')[0];
    const existing = alertRepo
      .listActive()
      .some((a) => a.type === alertType && a.message.includes(dateKey));
    if (existing) return;

    alertRepo.create({
      type: alertType,
      severity: 'info',
      message: `[${dateKey}] ${vehicle.nickname}: remember to plug in for overnight charging`,
      deep_link: '/ev',
    });
  });
}

import { z } from 'zod';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import type MeterReadingRepository from '../repositories/MeterReadingRepository';
import EvChargingRepository from '../repositories/EvChargingRepository';
import VehicleRepository from '../repositories/VehicleRepository';
import { EvChargingLogInputSchema, EvChargingLogUpdateSchema } from '../types/ev';
import { FuelRatesSchema, FuelRateHistorySchema } from '../db/settings-keys';

const FuelRateUpdateSchema = z.object({
  electricity: z.number().nonnegative().optional(),
  gas: z.number().nonnegative().optional(),
  oil: z.number().nonnegative().optional(),
  effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function calcMeterCost(
  meterRepo: MeterReadingRepository,
  fuelType: string,
  year: number,
  month: number,
  rates: Record<string, number>,
): { units: number; costMinor: number } {
  const monthStart = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const monthEnd = Math.floor(new Date(year, month, 1).getTime() / 1000);
  const all = meterRepo
    .listByFuelType(fuelType)
    .slice()
    .sort((a, b) => a.reading_date - b.reading_date);

  const beforeMonth = all.filter((r) => r.reading_date <= monthStart);
  const inMonth = all.filter((r) => r.reading_date > monthStart && r.reading_date <= monthEnd);

  const startReading = beforeMonth.length > 0 ? beforeMonth[beforeMonth.length - 1] : null;
  const endReading = inMonth.length > 0 ? inMonth[inMonth.length - 1] : null;
  if (!startReading || !endReading) return { units: 0, costMinor: 0 };

  const units = parseFloat(Math.max(0, endReading.value - startReading.value).toFixed(2));
  const rate = endReading.cost_per_unit ?? startReading.cost_per_unit ?? rates[fuelType] ?? 0;
  return { units, costMinor: Math.round(units * rate * 100) };
}

export default function createEvRouter(
  evRepo: EvChargingRepository,
  vehicleRepo: VehicleRepository,
  meterRepo: MeterReadingRepository,
  profileRepo: ProfileRepository,
  requireAdminPin: RequestHandler,
  settingsRepo?: AppSettingsRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // GET /api/v1/ev/charging-log?vehicleId=
  router.get(
    '/api/v1/ev/charging-log',
    requireProfile,
    requirePermission('view_vehicles'),
    (req, res, next) => {
      try {
        const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
        if (vehicleId !== undefined && (!Number.isInteger(vehicleId) || vehicleId <= 0)) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid vehicleId'] });
          return;
        }
        const logs = vehicleId !== undefined ? evRepo.listForVehicle(vehicleId) : evRepo.listAll();
        res.json(logs);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/ev/charging-log
  router.post(
    '/api/v1/ev/charging-log',
    requireProfile,
    requirePermission('manage_vehicles'),
    (req, res, next) => {
      try {
        const parsed = EvChargingLogInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        if (!vehicleRepo.get(parsed.data.vehicle_id)) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'Vehicle not found' });
          return;
        }
        const entry = evRepo.create(parsed.data);
        res.status(201).json(entry);
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /api/v1/ev/charging-log/:id
  router.patch(
    '/api/v1/ev/charging-log/:id',
    requireProfile,
    requirePermission('manage_vehicles'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!evRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = EvChargingLogUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        res.json(evRepo.update(id, parsed.data));
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/ev/charging-log/:id
  router.delete(
    '/api/v1/ev/charging-log/:id',
    requireProfile,
    requireAdminPin,
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!evRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        evRepo.delete(id);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/v1/ev/monthly-totals?vehicleId=
  router.get(
    '/api/v1/ev/monthly-totals',
    requireProfile,
    requirePermission('view_vehicles'),
    (req, res, next) => {
      try {
        const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
        if (vehicleId !== undefined && (!Number.isInteger(vehicleId) || vehicleId <= 0)) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid vehicleId'] });
          return;
        }
        res.json(evRepo.monthlyTotals(vehicleId));
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/v1/ev/energy-summary
  router.get(
    '/api/v1/ev/energy-summary',
    requireProfile,
    requirePermission('view_vehicles'),
    (_req, res, next) => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const evThisMonth = evRepo.listForMonth(year, month);
        const evKwh = parseFloat(evThisMonth.reduce((s, e) => s + e.kwh, 0).toFixed(2));
        const evCostMinor = evThisMonth.reduce((s, e) => s + (e.cost_minor ?? 0), 0);

        const rawRates = settingsRepo?.get('fuel_rates');
        const rates =
          rawRates && FuelRatesSchema.safeParse(rawRates).success
            ? (rawRates as Record<string, number>)
            : {};

        const electricity = calcMeterCost(meterRepo, 'electricity', year, month, rates);
        const gas = calcMeterCost(meterRepo, 'gas', year, month, rates);
        const oil = calcMeterCost(meterRepo, 'oil', year, month, rates);

        res.json({
          this_month: {
            ev_kwh: evKwh,
            ev_cost_minor: evCostMinor,
            electricity_units: electricity.units,
            electricity_cost_minor: electricity.costMinor,
            gas_cost_minor: gas.costMinor,
            oil_cost_minor: oil.costMinor,
            total_cost_minor: evCostMinor + electricity.costMinor + gas.costMinor + oil.costMinor,
          },
          monthly_ev_history: evRepo.monthlyTotals(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/v1/ev/fuel-rates
  router.get(
    '/api/v1/ev/fuel-rates',
    requireProfile,
    requirePermission('view_vehicles'),
    (_req, res, next) => {
      try {
        const rawRates = settingsRepo?.get('fuel_rates') ?? {};
        const rawHistory = settingsRepo?.get('fuel_rate_history') ?? [];
        res.json({ current: rawRates, history: rawHistory });
      } catch (err) {
        next(err);
      }
    },
  );

  // PUT /api/v1/ev/fuel-rates
  router.put('/api/v1/ev/fuel-rates', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const parsed = FuelRateUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      if (!settingsRepo) {
        res.status(503).json({ error: 'Settings unavailable' });
        return;
      }

      const { effective_date: effectiveDate, ...newRates } = parsed.data;
      const existing = settingsRepo.get<Record<string, number>>('fuel_rates') ?? {};
      const merged = { ...existing, ...newRates };
      settingsRepo.set('fuel_rates', merged);

      if (effectiveDate) {
        const historyResult = FuelRateHistorySchema.safeParse(
          settingsRepo.get('fuel_rate_history') ?? [],
        );
        const entries = historyResult.success ? historyResult.data : [];
        Object.entries(newRates).forEach(([fuel, rate]) => {
          if (rate !== undefined) {
            entries.unshift({ fuel, rate, effective_date: effectiveDate });
          }
        });
        settingsRepo.set('fuel_rate_history', entries.slice(0, 100));
      }

      res.json({ current: merged });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

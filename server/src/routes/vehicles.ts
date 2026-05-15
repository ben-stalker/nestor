import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import type { RequestHandler } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import VehicleRepository from '../repositories/VehicleRepository';
import VehicleBookingRepository from '../repositories/VehicleBookingRepository';
import FuelLogRepository from '../repositories/FuelLogRepository';
import VehicleBookingService, { ConflictError } from '../services/VehicleBookingService';
import {
  VehicleInputSchema,
  VehicleUpdateSchema,
  BookingInputSchema,
  BookingUpdateSchema,
  FuelLogInputSchema,
} from '../types/vehicles';

const UPLOAD_DIR = path.join(os.homedir(), '.nestor', 'uploads', 'vehicles');

function ensureUploadDir(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default function createVehiclesRouter(
  vehicleRepo: VehicleRepository,
  bookingRepo: VehicleBookingRepository,
  fuelRepo: FuelLogRepository,
  profileRepo: ProfileRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);
  const bookingService = new VehicleBookingService(bookingRepo);

  // ─── Vehicles CRUD ──────────────────────────────────────────────────────────

  router.get(
    '/api/v1/vehicles',
    requireProfile,
    requirePermission('view_vehicles'),
    (_req, res, next) => {
      try {
        res.json(vehicleRepo.list());
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/api/v1/vehicles/:id',
    requireProfile,
    requirePermission('view_vehicles'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        const vehicle = vehicleRepo.get(id);
        if (!vehicle) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        res.json(vehicle);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/api/v1/vehicles',
    requireProfile,
    requirePermission('manage_vehicles'),
    (req, res, next) => {
      try {
        const parsed = VehicleInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const vehicle = vehicleRepo.create(parsed.data);
        res.status(201).json(vehicle);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/api/v1/vehicles/:id',
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
        if (!vehicleRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = VehicleUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const updated = vehicleRepo.update(id, parsed.data);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete('/api/v1/vehicles/:id', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!vehicleRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      vehicleRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/vehicles/:id/photo
  router.post(
    '/api/v1/vehicles/:id/photo',
    requireProfile,
    requirePermission('manage_vehicles'),
    (req, res, next) => {
      upload.single('photo')(req, res, (err: unknown) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'validation',
              code: 'FILE_TOO_LARGE',
              details: ['Photo must be ≤ 10 MB'],
            });
            return;
          }
          next(err);
          return;
        }

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!vehicleRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!req.file) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['photo file required'] });
          return;
        }

        ensureUploadDir();
        const filename = `${crypto.randomUUID()}.webp`;
        const filePath = path.join(UPLOAD_DIR, filename);

        sharp(req.file.buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .webp()
          .toFile(filePath)
          .then(() => {
            const updated = vehicleRepo.update(id, { photo_path: filePath });
            res.json({ photo_path: updated?.photo_path ?? filePath });
          })
          .catch((fileErr: unknown) => next(fileErr));
      });
    },
  );

  // GET /api/v1/vehicles/:id/photo
  router.get(
    '/api/v1/vehicles/:id/photo',
    requireProfile,
    requirePermission('view_vehicles'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        const vehicle = vehicleRepo.get(id);
        if (!vehicle) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!vehicle.photo_path || !fs.existsSync(vehicle.photo_path)) {
          res.status(404).json({ error: 'NO_PHOTO' });
          return;
        }
        res.sendFile(vehicle.photo_path, (err: unknown) => {
          if (err) next(err);
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // ─── Bookings ────────────────────────────────────────────────────────────────

  router.get(
    '/api/v1/vehicles/:id/bookings',
    requireProfile,
    requirePermission('view_vehicles'),
    (req, res, next) => {
      try {
        const vehicleId = Number(req.params.id);
        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!vehicleRepo.get(vehicleId)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const from = req.query.from ? Number(req.query.from) : undefined;
        const to = req.query.to ? Number(req.query.to) : undefined;
        res.json(bookingRepo.listForVehicle(vehicleId, from, to));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/api/v1/vehicles/:id/bookings',
    requireProfile,
    requirePermission('book_vehicle'),
    (req, res, next) => {
      const vehicleId = Number(req.params.id);
      if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!vehicleRepo.get(vehicleId)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = BookingInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      if (parsed.data.start_datetime >= parsed.data.end_datetime) {
        res.status(400).json({
          error: 'validation',
          code: 'INVALID_INPUT',
          details: ['end must be after start'],
        });
        return;
      }

      bookingService
        .create(vehicleId, parsed.data)
        .then((booking) => res.status(201).json(booking))
        .catch((err: unknown) => {
          if (err instanceof ConflictError) {
            res.status(409).json({
              error: 'conflict',
              code: 'BOOKING_CONFLICT',
              details: err.conflicts.map((c) => ({
                id: c.id,
                start_datetime: c.start_datetime,
                end_datetime: c.end_datetime,
                profile_id: c.profile_id,
              })),
            });
            return;
          }
          next(err);
        });
    },
  );

  router.patch(
    '/api/v1/vehicles/:id/bookings/:bookingId',
    requireProfile,
    requirePermission('book_vehicle'),
    (req, res, next) => {
      const vehicleId = Number(req.params.id);
      const bookingId = Number(req.params.bookingId);
      if (
        !Number.isInteger(vehicleId) ||
        vehicleId <= 0 ||
        !Number.isInteger(bookingId) ||
        bookingId <= 0
      ) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }

      const booking = bookingRepo.get(bookingId);
      if (!booking || booking.vehicle_id !== vehicleId) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      // Non-admin can only edit their own booking
      const profile = req.profile!;
      if (profile.type !== 'admin' && booking.profile_id !== profile.id) {
        res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
        return;
      }

      const parsed = BookingUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }

      bookingService
        .update(vehicleId, bookingId, parsed.data)
        .then((updated) => res.json(updated))
        .catch((err: unknown) => {
          if (err instanceof ConflictError) {
            res.status(409).json({
              error: 'conflict',
              code: 'BOOKING_CONFLICT',
              details: err.conflicts.map((c) => ({
                id: c.id,
                start_datetime: c.start_datetime,
                end_datetime: c.end_datetime,
                profile_id: c.profile_id,
              })),
            });
            return;
          }
          next(err);
        });
    },
  );

  router.delete(
    '/api/v1/vehicles/:id/bookings/:bookingId',
    requireProfile,
    requirePermission('book_vehicle'),
    (req, res, next) => {
      try {
        const vehicleId = Number(req.params.id);
        const bookingId = Number(req.params.bookingId);
        if (
          !Number.isInteger(vehicleId) ||
          vehicleId <= 0 ||
          !Number.isInteger(bookingId) ||
          bookingId <= 0
        ) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }

        const booking = bookingRepo.get(bookingId);
        if (!booking || booking.vehicle_id !== vehicleId) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        const profile = req.profile!;
        if (profile.type !== 'admin' && booking.profile_id !== profile.id) {
          res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
          return;
        }

        bookingRepo.delete(bookingId);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  // ─── Fuel Logs ───────────────────────────────────────────────────────────────

  router.get(
    '/api/v1/vehicles/:id/fuel-log',
    requireProfile,
    requirePermission('view_vehicles'),
    (req, res, next) => {
      try {
        const vehicleId = Number(req.params.id);
        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!vehicleRepo.get(vehicleId)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        res.json(fuelRepo.listForVehicle(vehicleId));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/api/v1/vehicles/:id/fuel-log',
    requireProfile,
    requirePermission('manage_vehicles'),
    (req, res, next) => {
      try {
        const vehicleId = Number(req.params.id);
        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!vehicleRepo.get(vehicleId)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = FuelLogInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const entry = fuelRepo.create(vehicleId, parsed.data);
        res.status(201).json(entry);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

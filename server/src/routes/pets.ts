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
import type PetRepository from '../repositories/PetRepository';
import type PetHealthLogRepository from '../repositories/PetHealthLogRepository';
import type EventRepository from '../repositories/EventRepository';
import { PetInputSchema, PetHealthLogInputSchema } from '../types/pets';

const PHOTO_UPLOAD_DIR = path.join(os.homedir(), '.nestor', 'uploads', 'pets');
const DOC_UPLOAD_DIR = path.join(os.homedir(), '.nestor', 'uploads', 'pet-docs');

function ensurePhotoDir(): void {
  fs.mkdirSync(PHOTO_UPLOAD_DIR, { recursive: true });
}

function ensureDocDir(): void {
  fs.mkdirSync(DOC_UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
    }
  },
});

export default function createPetsRouter(
  petRepo: PetRepository,
  petHealthRepo: PetHealthLogRepository,
  requireAdminPin: RequestHandler,
  profileRepo: ProfileRepository,
  eventRepo?: EventRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // ─── Pets CRUD ────────────────────────────────────────────────────────────────

  // NOTE: /upcoming-care must be registered before /:id to avoid route conflicts
  router.get(
    '/api/v1/pets/upcoming-care',
    requireProfile,
    requirePermission('view_pets'),
    (req, res, next) => {
      try {
        const days = req.query.days ? Number(req.query.days) : 30;
        const items = petHealthRepo.upcomingCare(Number.isNaN(days) ? 30 : days);
        res.json(items);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/api/v1/pets',
    requireProfile,
    requirePermission('view_pets'),
    (_req, res, next) => {
      try {
        res.json(petRepo.list());
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/api/v1/pets',
    requireProfile,
    requireAdminPin,
    (req, res, next) => {
      try {
        const parsed = PetInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const pet = petRepo.create(parsed.data);
        res.status(201).json(pet);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/api/v1/pets/:id',
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
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = PetInputSchema.partial().safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const updated = petRepo.update(id, parsed.data);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/api/v1/pets/:id',
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
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        petRepo.delete(id);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  // ─── Pet Photo ───────────────────────────────────────────────────────────────

  router.post(
    '/api/v1/pets/:id/photo',
    requireProfile,
    requireAdminPin,
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
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!req.file) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['photo file required'] });
          return;
        }

        ensurePhotoDir();
        const filename = `${crypto.randomUUID()}.webp`;
        const filePath = path.join(PHOTO_UPLOAD_DIR, filename);

        sharp(req.file.buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .webp()
          .toFile(filePath)
          .then(() => {
            const updated = petRepo.update(id, { photo_path: filePath });
            res.json({ photo_path: updated?.photo_path ?? filePath });
          })
          .catch((fileErr: unknown) => next(fileErr));
      });
    },
  );

  router.get(
    '/api/v1/pets/:id/photo',
    requireProfile,
    requirePermission('view_pets'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        const pet = petRepo.get(id);
        if (!pet) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!pet.photo_path || !fs.existsSync(pet.photo_path)) {
          res.status(404).json({ error: 'NO_PHOTO' });
          return;
        }
        res.sendFile(pet.photo_path, (err: unknown) => {
          if (err) next(err);
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // ─── Health Logs ─────────────────────────────────────────────────────────────

  router.get(
    '/api/v1/pets/:id/health-log',
    requireProfile,
    requirePermission('view_pets'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        res.json(petHealthRepo.listForPet(id));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/api/v1/pets/:id/health-log',
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
        const pet = petRepo.get(id);
        if (!pet) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = PetHealthLogInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }

        let linkedCalendarEventId: number | null = null;

        if (parsed.data.log_type === 'vet_visit' && parsed.data.vet_appointment_date && eventRepo) {
          try {
            const startMs = new Date(`${parsed.data.vet_appointment_date}T10:00:00`).getTime();
            const endMs = startMs + 60 * 60 * 1000;
            const event = eventRepo.create({
              title: `Vet: ${pet.name} — ${parsed.data.title}`,
              start_datetime: startMs,
              end_datetime: endMs,
              all_day: false,
              type: 'vet',
              colour_override: '#f97316',
              source: 'local',
            });
            linkedCalendarEventId = event.id;
          } catch {
            // Non-fatal: calendar event creation failed, continue without it
          }
        }

        const entry = petHealthRepo.create({
          pet_id: id,
          ...parsed.data,
          linked_calendar_event_id: linkedCalendarEventId,
        });
        res.status(201).json(entry);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/api/v1/pets/:id/health-log/:logId',
    requireProfile,
    requireAdminPin,
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const logId = Number(req.params.logId);
        if (
          !Number.isInteger(id) ||
          id <= 0 ||
          !Number.isInteger(logId) ||
          logId <= 0
        ) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const existing = petHealthRepo.get(logId);
        if (!existing || existing.pet_id !== id) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = PetHealthLogInputSchema.partial().safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const updated = petHealthRepo.update(logId, parsed.data);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/api/v1/pets/:id/health-log/:logId',
    requireProfile,
    requireAdminPin,
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const logId = Number(req.params.logId);
        if (
          !Number.isInteger(id) ||
          id <= 0 ||
          !Number.isInteger(logId) ||
          logId <= 0
        ) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const existing = petHealthRepo.get(logId);
        if (!existing || existing.pet_id !== id) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        petHealthRepo.delete(logId);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  // ─── Document Upload ──────────────────────────────────────────────────────────

  router.post(
    '/api/v1/pets/:id/health-log/:logId/document',
    requireProfile,
    requireAdminPin,
    (req, res, next) => {
      docUpload.single('document')(req, res, (err: unknown) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'validation',
              code: 'FILE_TOO_LARGE',
              details: ['Document must be ≤ 10 MB'],
            });
            return;
          }
          if (err instanceof Error) {
            res.status(400).json({
              error: 'validation',
              code: 'INVALID_FILE_TYPE',
              details: [err.message],
            });
            return;
          }
          next(err);
          return;
        }

        const id = Number(req.params.id);
        const logId = Number(req.params.logId);
        if (
          !Number.isInteger(id) ||
          id <= 0 ||
          !Number.isInteger(logId) ||
          logId <= 0
        ) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const existing = petHealthRepo.get(logId);
        if (!existing || existing.pet_id !== id) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!req.file) {
          res
            .status(400)
            .json({
              error: 'validation',
              code: 'INVALID_INPUT',
              details: ['document file required'],
            });
          return;
        }

        ensureDocDir();
        const ext = path.extname(req.file.originalname) || '.bin';
        const filename = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(DOC_UPLOAD_DIR, filename);

        try {
          fs.writeFileSync(filePath, req.file.buffer);
          const updated = petHealthRepo.update(logId, {
            document_path: filePath,
            document_name: req.file.originalname,
          });
          res.json({ document_path: updated.document_path, document_name: updated.document_name });
        } catch (writeErr) {
          next(writeErr);
        }
      });
    },
  );

  router.get(
    '/api/v1/pets/:id/health-log/:logId/document',
    requireProfile,
    requirePermission('view_pets'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const logId = Number(req.params.logId);
        if (
          !Number.isInteger(id) ||
          id <= 0 ||
          !Number.isInteger(logId) ||
          logId <= 0
        ) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        if (!petRepo.get(id)) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const log = petHealthRepo.get(logId);
        if (!log || log.pet_id !== id) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!log.document_path || !fs.existsSync(log.document_path)) {
          res.status(404).json({ error: 'NO_DOCUMENT' });
          return;
        }
        const downloadName = log.document_name ?? path.basename(log.document_path);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.sendFile(log.document_path, (err: unknown) => {
          if (err) next(err);
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

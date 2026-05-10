import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import createRequireAdminPin from '../middleware/requireAdminPin';
import { createPinVerifyLimiter } from '../middleware/rateLimit';
import ProfileRepository, { LastAdminError } from '../repositories/ProfileRepository';
import defaultsFor from '../services/permissionDefaults';
import { CreateProfileSchema, UpdateProfileSchema } from '../types/profile';

const VerifyPinSchema = z.object({ pin: z.string().min(1) });

export default function createProfilesRouter(
  repo: ProfileRepository,
  pinLimiter: RequestHandler = createPinVerifyLimiter(),
  adminPinMiddleware: RequestHandler = createRequireAdminPin(repo),
): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(repo.list());
  });

  router.post('/', adminPinMiddleware, (req, res) => {
    const result = CreateProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      });
      return;
    }
    const { data } = result;
    const permissions = data.permissions_json ?? defaultsFor(data.type);
    const profile = repo.create({ ...data, permissions_json: permissions });
    res.status(201).json(profile);
  });

  router.patch('/:id', adminPinMiddleware, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
      return;
    }
    const result = UpdateProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      });
      return;
    }
    try {
      const profile = repo.update(id, result.data);
      res.json(profile);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
      } else {
        throw err;
      }
    }
  });

  router.delete('/:id', adminPinMiddleware, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
      return;
    }
    try {
      repo.delete(id);
      res.status(204).end();
    } catch (err) {
      if (err instanceof LastAdminError) {
        res.status(400).json({ error: err.message, code: err.code });
      } else {
        throw err;
      }
    }
  });

  router.post('/:id/verify-pin', pinLimiter, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
      return;
    }
    const result = VerifyPinSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      });
      return;
    }
    const valid = repo.verifyPin(id, result.data.pin);
    res.json({ valid });
  });

  router.get('/:id/permissions', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
      return;
    }
    const profile = repo.get(id);
    if (!profile) {
      res.status(404).json({ error: `Profile ${id} not found`, code: 'NOT_FOUND' });
      return;
    }
    res.json(profile.permissions_json);
  });

  return router;
}

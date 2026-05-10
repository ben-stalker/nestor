import bcrypt from 'bcrypt';
import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { createPinVerifyLimiter } from '../middleware/rateLimit';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import ProfileRepository from '../repositories/ProfileRepository';
import { getDb } from '../db/connection';

const ActivateKioskSchema = z.object({ profileId: z.string().min(1) });
const PinSchema = z.object({ pin: z.string().min(1) });

export default function createAdminRouter(
  settingsRepo: AppSettingsRepository = new AppSettingsRepository(getDb()),
  profileRepo: ProfileRepository = new ProfileRepository(getDb()),
  pinLimiter: RequestHandler = createPinVerifyLimiter(),
): Router {
  const router = Router();

  // Activate kiosk lock — requires X-Admin-Pin header (validated by requireAdminPin before this)
  // This route is intentionally not wrapped in kioskLock middleware so admin can always lock the screen.
  router.post('/kiosk-lock', (req, res) => {
    const result = ActivateKioskSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      });
      return;
    }
    settingsRepo.set('kiosk_lock', result.data.profileId);
    res.status(204).end();
  });

  // Unlock kiosk — accepts PIN in body and verifies against any admin profile.
  // This route is intentionally not wrapped in kioskLock middleware — it is the escape hatch.
  router.post('/kiosk-unlock', pinLimiter, (req, res) => {
    const result = PinSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      });
      return;
    }

    const hashes = profileRepo.listAdminPinHashes();
    const valid = hashes.some(
      ({ pin_hash }) => pin_hash !== null && bcrypt.compareSync(result.data.pin, pin_hash),
    );

    if (!valid) {
      res.status(200).json({ valid: false });
      return;
    }

    settingsRepo.delete('kiosk_lock');
    res.status(200).json({ valid: true });
  });

  // Verify admin PIN without side effects — used by guest mode exit on the client.
  router.post('/verify-pin', pinLimiter, (req, res) => {
    const result = PinSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      });
      return;
    }

    const hashes = profileRepo.listAdminPinHashes();
    const valid = hashes.some(
      ({ pin_hash }) => pin_hash !== null && bcrypt.compareSync(result.data.pin, pin_hash),
    );

    res.status(200).json({ valid });
  });

  return router;
}

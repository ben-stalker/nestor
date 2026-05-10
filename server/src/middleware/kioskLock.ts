import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';

export default function createKioskLockMiddleware(repo: AppSettingsRepository): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const lock = repo.get<string | null>('kiosk_lock');
    if (lock) {
      res.status(403).json({ error: 'Kiosk mode is active', code: 'KIOSK_LOCKED' });
      return;
    }
    next();
  };
}

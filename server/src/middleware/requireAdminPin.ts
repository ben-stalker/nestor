import bcrypt from 'bcrypt';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type ProfileRepository from '../repositories/ProfileRepository';

const CACHE_TTL_MS = 15_000;

interface AdminPinCache {
  hashes: { id: number; pin_hash: string | null }[];
  expires: number;
}

export default function createRequireAdminPin(repo: ProfileRepository): RequestHandler {
  let cache: AdminPinCache | null = null;

  return (req: Request, res: Response, next: NextFunction): void => {
    const pin = req.headers['x-admin-pin'];
    if (!pin || typeof pin !== 'string') {
      res.status(403).json({ error: 'Invalid admin PIN', code: 'INVALID_ADMIN_PIN' });
      return;
    }

    const now = Date.now();
    if (!cache || cache.expires <= now) {
      cache = { hashes: repo.listAdminPinHashes(), expires: now + CACHE_TTL_MS };
    }

    const matched = cache.hashes.some(
      ({ pin_hash }) => pin_hash !== null && bcrypt.compareSync(pin, pin_hash),
    );

    if (!matched) {
      res.status(403).json({ error: 'Invalid admin PIN', code: 'INVALID_ADMIN_PIN' });
      return;
    }

    next();
  };
}

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type ProfileRepository from '../repositories/ProfileRepository';

export default function createRequireProfile(repo: ProfileRepository): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers['x-profile-id'];
    const id = Number(header);
    if (!header || !Number.isInteger(id) || id <= 0) {
      res.status(401).json({ error: 'Unknown profile', code: 'UNKNOWN_PROFILE' });
      return;
    }
    const profile = repo.get(id);
    if (!profile) {
      res.status(401).json({ error: 'Unknown profile', code: 'UNKNOWN_PROFILE' });
      return;
    }
    req.profile = profile;
    next();
  };
}

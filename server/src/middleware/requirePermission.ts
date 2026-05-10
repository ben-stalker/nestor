import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { PermissionKey } from './permissions';

export default function requirePermission(permKey: PermissionKey): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.profile) {
      res.status(401).json({ error: 'No profile', code: 'NO_PROFILE' });
      return;
    }
    const perms = req.profile.permissions_json ?? {};
    if (perms[permKey] !== true) {
      res.status(403).json({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        details: { required: permKey },
      });
      return;
    }
    next();
  };
}

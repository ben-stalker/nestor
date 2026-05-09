import type { Request, Response } from 'express';
import { Router } from 'express';
// eslint-disable-next-line import/extensions
import pkg from '../../package.json';
import { getDb } from '../db/connection';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  let dbStatus: 'ok' | 'fail' = 'ok';
  try {
    getDb().prepare('SELECT 1').run();
  } catch {
    dbStatus = 'fail';
  }

  res.json({
    status: 'ok',
    db: dbStatus,
    uptime: process.uptime(),
    version: pkg.version,
  });
});

export default router;

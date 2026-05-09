import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export default function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  (req as Request & { id: string }).id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

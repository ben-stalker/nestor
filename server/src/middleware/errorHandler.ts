import type { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  status?: number;
  code?: string;
  details?: object;
}

export default function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  logger.error({ err, reqId: (req as Request & { id?: string }).id }, err.message);
  res.status(err.status ?? 500).json({
    error: err.message,
    code: err.code ?? 'INTERNAL_ERROR',
    ...(err.details !== undefined ? { details: err.details } : {}),
  });
}

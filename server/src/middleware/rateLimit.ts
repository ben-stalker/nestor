import rateLimit, { type Options } from 'express-rate-limit';

export function createPinVerifyLimiter(options?: Partial<Options>) {
  return rateLimit({
    windowMs: 15 * 60_000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many PIN attempts', code: 'RATE_LIMITED' },
    ...options,
  });
}

export const pinVerifyLimiter = createPinVerifyLimiter();

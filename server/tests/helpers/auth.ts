import type { RequestHandler } from 'express';
import type { Profile } from '../../src/types/profile';

/** No-op middleware for tests that don't need admin pin verification */
export const noopAdminPin: RequestHandler = (_req, _res, next) => next();

/** No-op rate limiter for tests */
export const noopLimiter: RequestHandler = (_req, _res, next) => next();

/** Return headers to identify as a given profile */
export function asProfile(profile: Pick<Profile, 'id'>): Record<string, string> {
  return { 'x-profile-id': String(profile.id) };
}

/** Return headers for admin pin authentication */
export function withAdminPin(pin = '0000'): Record<string, string> {
  return { 'x-admin-pin': pin };
}

/** Combined: profile + admin pin headers */
export function asAdmin(profile: Pick<Profile, 'id'>, pin = '0000'): Record<string, string> {
  return { ...asProfile(profile), ...withAdminPin(pin) };
}

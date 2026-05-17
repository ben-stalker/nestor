import type { RequestHandler } from 'express';

/**
 * Security headers, including a CSP frame-src allowing the YouTube no-cookie
 * domain so the YouTube Player plugin can embed videos.
 */
const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "media-src 'self' https:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:",
      "frame-src 'self' https://www.youtube-nocookie.com",
      "frame-ancestors 'self'",
    ].join('; '),
  );
  next();
};

export default securityHeaders;

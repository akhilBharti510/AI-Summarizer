import csurf from 'csurf';
import { env } from '../config/env.js';

/**
 * CSRF protection using double-submit cookie pattern (no session required).
 * Client must:
 *   1. GET /api/v1/auth/csrf to receive the token (also set as readable cookie).
 *   2. Include `X-CSRF-Token` header on all state-changing requests it gates.
 *
 * We do NOT mount this on /auth/login, /register, /refresh, /forgot-password,
 * /reset-password, /google* — those run before the client can fetch a token,
 * and are protected by SameSite=Lax + strict CORS origin allowlist.
 */
// Cross-site SPA (Vercel) ↔ API (Railway) means Lax cookies aren't sent on
// fetch POSTs. Use SameSite=None+Secure in prod so the _csrf cookie round-trips;
// keep Lax in dev (browsers reject None over plain HTTP).
const crossSiteSameSite = env.COOKIE_SECURE ? 'none' : 'lax';

export const csrfProtection = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: crossSiteSameSite,
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  },
  value: (req) => req.headers['x-csrf-token'] || req.body?._csrf,
});

/** Endpoint handler that hands the current CSRF token to the client. */
export function issueCsrfToken(req, res) {
  const token = req.csrfToken();
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // readable by JS so the client can echo it in a header
    sameSite: crossSiteSameSite,
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
  res.json({ success: true, data: { csrfToken: token } });
}

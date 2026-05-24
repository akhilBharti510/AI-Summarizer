import { Router } from 'express';
import passport from 'passport';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { validate } from '../../middlewares/validate.js';
import { authLimiter } from '../../middlewares/rateLimit.js';
import { requireAuth } from '../../middlewares/auth.js';
import { csrfProtection, issueCsrfToken } from '../../middlewares/csrf.js';
import { setAuthCookies } from '../../services/tokens.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validators.js';
import {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  changeMyPassword,
} from './auth.controller.js';
import { googleEnabled } from './auth.oauth.js';

const router = Router();

// CSRF token issuer — must be GET, available to anyone
router.get('/csrf', csrfProtection, issueCsrfToken);

// Unauthenticated endpoints — CSRF excluded; protected by SameSite + CORS
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// Authenticated — CSRF required
router.post('/logout', csrfProtection, requireAuth, logout);
router.get('/me', requireAuth, me);
router.post(
  '/change-password',
  csrfProtection,
  requireAuth,
  validate(changePasswordSchema),
  changeMyPassword,
);

// ─── Google OAuth ─────────────────────────────────────────
if (googleEnabled()) {
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    }),
  );

  router.get(
    '/google/callback',
    (req, res, next) => {
      passport.authenticate('google', { session: false }, (err, payload) => {
        if (err || !payload) {
          return res.redirect(env.OAUTH_FAILURE_REDIRECT);
        }
        const { tokens } = payload;
        setAuthCookies(res, tokens.access, tokens.refresh);
        return res.redirect(env.OAUTH_SUCCESS_REDIRECT);
      })(req, res, next);
    },
  );
} else {
  router.get('/google', (_req, _res, next) =>
    next(ApiError.badRequest('Google OAuth is not configured')),
  );
}

export default router;

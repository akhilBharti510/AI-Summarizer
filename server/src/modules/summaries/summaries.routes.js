import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { optionalAuth, requireAuth, requirePermission } from '../../middlewares/auth.js';
import { csrfProtection } from '../../middlewares/csrf.js';
import { summarizeLimiter } from '../../middlewares/rateLimit.js';
import { quotaGuard } from '../../middlewares/quotaGuard.js';
import { uploadSingle, verifyFileMagic } from '../../middlewares/upload.js';
import { PERMISSIONS } from '../../config/constants.js';
import {
  createSummarySchema,
  regenerateSummarySchema,
  listSummariesQuerySchema,
  renameSummarySchema,
  idParamSchema,
  exportQuerySchema,
} from './summaries.validators.js';
import {
  create,
  regenerate,
  list,
  get,
  rename,
  remove,
  bookmark,
  exportFile,
  parseMultipartFields,
} from './summaries.controller.js';

const router = Router();

/**
 * POST /summaries — guest OR user. Accepts multipart (PDF/DOCX/IMAGE) or JSON (TEXT/URL).
 * Order: csrf (guest has csrf via session) → optionalAuth → multer → magic-byte → rate-limit → quota → validate.
 *
 * NOTE: CSRF protection is intentionally OMITTED for guest POST /summaries because guests
 * fetched no CSRF token (they aren't logged in / no /auth/csrf call from public landing).
 * Same-site Lax + strict CORS allowlist protects this endpoint.
 */
router.post(
  '/',
  optionalAuth,
  uploadSingle,
  verifyFileMagic,
  parseMultipartFields,
  summarizeLimiter,
  quotaGuard,
  validate(createSummarySchema),
  create,
);

router.post(
  '/:id/regenerate',
  csrfProtection,
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(regenerateSummarySchema),
  summarizeLimiter,
  quotaGuard,
  regenerate,
);

router.get('/', optionalAuth, validate(listSummariesQuerySchema, 'query'), list);

router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), get);

router.patch(
  '/:id',
  csrfProtection,
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(renameSummarySchema),
  rename,
);

router.delete(
  '/:id',
  csrfProtection,
  optionalAuth,
  validate(idParamSchema, 'params'),
  remove,
);

router.post(
  '/:id/bookmark',
  csrfProtection,
  requireAuth,
  requirePermission(PERMISSIONS.BOOKMARK_MANAGE),
  validate(idParamSchema, 'params'),
  bookmark,
);

router.get(
  '/:id/export',
  optionalAuth,
  validate(idParamSchema, 'params'),
  validate(exportQuerySchema, 'query'),
  exportFile,
);

export default router;

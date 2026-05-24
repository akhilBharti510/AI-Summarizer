import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requirePermission } from '../../middlewares/auth.js';
import { csrfProtection } from '../../middlewares/csrf.js';
import { PERMISSIONS } from '../../config/constants.js';
import {
  listUsersQuerySchema,
  updateUserSchema,
  idParamSchema,
  updateProfileSchema,
} from './users.validators.js';
import * as ctrl from './users.controller.js';

const router = Router();
router.use(requireAuth);

// Self
router.get('/me/profile', ctrl.myProfile);
router.patch('/me/profile', csrfProtection, validate(updateProfileSchema), ctrl.updateMyProfile);

// Admin
router.get('/', requirePermission(PERMISSIONS.ADMIN_USERS_READ), validate(listUsersQuerySchema, 'query'), ctrl.list);
router.get('/:id', requirePermission(PERMISSIONS.ADMIN_USERS_READ), validate(idParamSchema, 'params'), ctrl.get);
router.patch(
  '/:id',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_USERS_UPDATE),
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  ctrl.update,
);
router.post(
  '/:id/reset-usage',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_USERS_UPDATE),
  validate(idParamSchema, 'params'),
  ctrl.resetUsage,
);
router.delete(
  '/:id',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_USERS_DELETE),
  validate(idParamSchema, 'params'),
  ctrl.deactivate,
);

export default router;

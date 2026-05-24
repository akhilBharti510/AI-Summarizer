import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requirePermission } from '../../middlewares/auth.js';
import { csrfProtection } from '../../middlewares/csrf.js';
import { PERMISSIONS } from '../../config/constants.js';
import {
  createRoleSchema,
  updateRoleSchema,
  listRolesQuerySchema,
  roleIdParamSchema,
} from './roles.validators.js';
import * as ctrl from './roles.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/permissions/catalog', requirePermission(PERMISSIONS.ADMIN_ROLES_READ), ctrl.permissionsCatalog);

router.get(
  '/',
  requirePermission(PERMISSIONS.ADMIN_ROLES_READ),
  validate(listRolesQuerySchema, 'query'),
  ctrl.list,
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.ADMIN_ROLES_READ),
  validate(roleIdParamSchema, 'params'),
  ctrl.get,
);

router.post(
  '/',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_ROLES_CREATE),
  validate(createRoleSchema),
  ctrl.create,
);

router.patch(
  '/:id',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_ROLES_UPDATE),
  validate(roleIdParamSchema, 'params'),
  validate(updateRoleSchema),
  ctrl.update,
);

router.post(
  '/:id/activate',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_ROLES_UPDATE),
  validate(roleIdParamSchema, 'params'),
  ctrl.activate,
);

router.post(
  '/:id/deactivate',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_ROLES_UPDATE),
  validate(roleIdParamSchema, 'params'),
  ctrl.deactivate,
);

router.delete(
  '/:id',
  csrfProtection,
  requirePermission(PERMISSIONS.ADMIN_ROLES_DELETE),
  validate(roleIdParamSchema, 'params'),
  ctrl.remove,
);

export default router;

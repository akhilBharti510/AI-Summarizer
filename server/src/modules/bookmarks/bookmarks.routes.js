import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requirePermission } from '../../middlewares/auth.js';
import { csrfProtection } from '../../middlewares/csrf.js';
import { PERMISSIONS } from '../../config/constants.js';
import { list, remove, listQuerySchema, idParamSchema } from './bookmarks.controller.js';

const router = Router();
router.use(requireAuth, requirePermission(PERMISSIONS.BOOKMARK_MANAGE));

router.get('/', validate(listQuerySchema, 'query'), list);
router.delete('/:id', csrfProtection, validate(idParamSchema, 'params'), remove);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { csrfProtection } from '../../middlewares/csrf.js';
import { prisma } from '../../config/db.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/',
  validate(listQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { unread, page, limit } = req.query;
    const where = {
      userId: req.user.id,
      ...(unread === true ? { readAt: null } : unread === false ? { readAt: { not: null } } : {}),
    };
    const [total, unreadCount, rows] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return paginated(res, rows, { ...buildPaginationMeta({ total, page, limit }), unreadCount });
  }),
);

router.post(
  '/:id/read',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n || n.userId !== req.user.id) throw ApiError.notFound();
    if (!n.readAt) await prisma.notification.update({ where: { id: n.id }, data: { readAt: new Date() } });
    return ok(res, { read: true });
  }),
);

router.post(
  '/read-all',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const r = await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return ok(res, { updated: r.count });
  }),
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requirePermission } from '../../middlewares/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import { prisma } from '../../config/db.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();
router.use(requireAuth, requirePermission(PERMISSIONS.ADMIN_AUDIT_READ));

const listQuery = z.object({
  q: z.string().trim().max(120).optional(),
  action: z.string().trim().max(80).optional(),
  actorId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/',
  validate(listQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { q, action, actorId, from, to, page, limit } = req.query;
    const where = {
      ...(action ? { action } : {}),
      ...(actorId ? { actorId } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      ...(q ? { OR: [{ action: { contains: q, mode: 'insensitive' } }, { target: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { id: true, email: true, name: true } } },
      }),
    ]);
    return paginated(res, rows, buildPaginationMeta({ total, page, limit }));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
      include: { actor: { select: { id: true, email: true, name: true } } },
    });
    if (!row) throw ApiError.notFound('Audit entry not found');
    return ok(res, { entry: row });
  }),
);

export default router;

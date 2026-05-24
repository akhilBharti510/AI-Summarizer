import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated, noContent } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { prisma } from '../../config/db.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { writeAudit } from '../../utils/audit.js';

export const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export const list = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const where = {
    userId: req.user.id,
    ...(q
      ? { summary: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { output: { contains: q, mode: 'insensitive' } }] } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.bookmark.count({ where }),
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        summary: {
          select: {
            id: true,
            title: true,
            sourceType: true,
            summaryType: true,
            length: true,
            tone: true,
            language: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);
  return paginated(
    res,
    rows.map((b) => ({ id: b.id, createdAt: b.createdAt, summary: b.summary })),
    buildPaginationMeta({ total, page, limit }),
  );
});

export const remove = asyncHandler(async (req, res) => {
  const bm = await prisma.bookmark.findUnique({ where: { id: req.params.id } });
  if (!bm || bm.userId !== req.user.id) throw ApiError.notFound('Bookmark not found');
  await prisma.bookmark.delete({ where: { id: bm.id } });
  writeAudit({ actorId: req.user.id, action: 'bookmark.remove', target: bm.summaryId, req });
  return noContent(res);
});

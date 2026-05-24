import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { requireAuth } from '../../middlewares/auth.js';
import { prisma } from '../../config/db.js';

const router = Router();
router.use(requireAuth);

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const today = startOfTodayUtc();
    const since = req.user.quotaResetAt && req.user.quotaResetAt > today ? req.user.quotaResetAt : today;
    const userId = req.user.id;
    const limit = req.user.role?.dailyLimit ?? 0;

    const [usedToday, totalSummaries, totalBookmarks, recent, unreadNotifications] = await Promise.all([
      // Quota usage is measured from append-only UsageLog so deletions don't refund quota.
      prisma.usageLog.count({ where: { userId, action: 'summary.create', createdAt: { gte: since } } }),
      prisma.summary.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.summary.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, sourceType: true, summaryType: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    const remaining = limit === -1 ? -1 : Math.max(0, limit - usedToday);
    return ok(res, {
      quota: { limit, used: usedToday, remaining },
      totals: { summaries: totalSummaries, bookmarks: totalBookmarks },
      unreadNotifications,
      recent,
    });
  }),
);

export default router;

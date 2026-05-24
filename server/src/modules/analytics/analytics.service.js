import { prisma } from '../../config/db.js';

function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export async function getOverview() {
  const today = daysAgo(0);
  const last7 = daysAgo(6);
  const last30 = daysAgo(29);

  const [users, activeUsers, roles, summariesTotal, summariesToday, summaries7d, summaries30d, failed7d] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.role.count(),
      prisma.summary.count(),
      prisma.summary.count({ where: { createdAt: { gte: today }, status: 'COMPLETED' } }),
      prisma.summary.count({ where: { createdAt: { gte: last7 }, status: 'COMPLETED' } }),
      prisma.summary.count({ where: { createdAt: { gte: last30 }, status: 'COMPLETED' } }),
      prisma.summary.count({ where: { createdAt: { gte: last7 }, status: 'FAILED' } }),
    ]);

  return {
    users: { total: users, active: activeUsers, inactive: users - activeUsers },
    roles: { total: roles },
    summaries: { total: summariesTotal, today: summariesToday, last7d: summaries7d, last30d: summaries30d, failedLast7d: failed7d },
  };
}

export async function getUsageSeries({ days = 14 } = {}) {
  const since = daysAgo(days - 1);
  const rows = await prisma.$queryRaw`
    SELECT date_trunc('day', "createdAt") AS day,
           "sourceType",
           COUNT(*)::int AS count
    FROM "Summary"
    WHERE "createdAt" >= ${since} AND "status" = 'COMPLETED'
    GROUP BY day, "sourceType"
    ORDER BY day ASC
  `;
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    sourceType: r.sourceType,
    count: r.count,
  }));
}

export async function getGrowthSeries({ days = 30 } = {}) {
  const since = daysAgo(days - 1);
  const rows = await prisma.$queryRaw`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: r.count }));
}

export async function getSummaryTypeBreakdown({ days = 30 } = {}) {
  const since = daysAgo(days - 1);
  const rows = await prisma.summary.groupBy({
    by: ['summaryType'],
    where: { createdAt: { gte: since }, status: 'COMPLETED' },
    _count: { _all: true },
  });
  return rows.map((r) => ({ summaryType: r.summaryType, count: r._count._all }));
}

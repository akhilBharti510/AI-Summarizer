import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Enforces per-role daily limits.
 *  - Authenticated: counts user's COMPLETED summaries today against role.dailyLimit.
 *  - Guest (no req.user): counts summaries linked to the session id against Guest role's limit.
 *  - dailyLimit === -1 → unlimited.
 *
 * On first exceed of the day, writes a single 'limit.exceeded' notification (auth only).
 */
export async function quotaGuard(req, _res, next) {
  try {
    const today = startOfTodayUtc();

    if (req.user) {
      const limit = req.user.role?.dailyLimit ?? 0;
      if (limit === -1) return next();
      const since = req.user.quotaResetAt && req.user.quotaResetAt > today ? req.user.quotaResetAt : today;
      const used = await prisma.summary.count({
        where: { userId: req.user.id, status: 'COMPLETED', createdAt: { gte: since } },
      });
      if (used >= limit) {
        await notifyOnce(req.user.id, limit);
        return next(
          ApiError.quotaExceeded('Daily summary limit reached', { limit, used, remaining: 0 }),
        );
      }
      req.quota = { limit, used, remaining: limit - used };
      return next();
    }

    // Guest path
    const sid = req.sessionID;
    if (!sid) throw ApiError.unauthenticated('Session unavailable');
    // Mark the session so express-session (saveUninitialized: false) persists it
    // and the `sid` cookie round-trips on the next request — otherwise every guest
    // request gets a fresh sessionID and the quota never increments.
    req.session.guest = true;
    const guestRole = await prisma.role.findUnique({ where: { name: ROLES.GUEST } });
    const limit = guestRole?.dailyLimit ?? 3;
    if (limit === -1) return next();
    const used = await prisma.summary.count({
      where: { guestSid: sid, status: 'COMPLETED' },
    });
    if (used >= limit) {
      return next(
        ApiError.quotaExceeded('Guest summary limit reached for this session', {
          limit,
          used,
          remaining: 0,
        }),
      );
    }
    req.quota = { limit, used, remaining: limit - used };
    return next();
  } catch (e) {
    next(e);
  }
}

async function notifyOnce(userId, limit) {
  const today = startOfTodayUtc();
  const existing = await prisma.notification.findFirst({
    where: { userId, type: 'limit.exceeded', createdAt: { gte: today } },
    select: { id: true },
  });
  if (existing) return;
  await prisma.notification
    .create({
      data: {
        userId,
        type: 'limit.exceeded',
        title: 'Daily summary limit reached',
        body: `You've used all ${limit} summaries for today. Limit resets tomorrow (UTC).`,
      },
    })
    .catch(() => {});
}

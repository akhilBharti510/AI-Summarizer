import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';
import { readAccessFromReq, verifyAccess } from '../services/tokens.js';

/**
 * Attach req.user (with role) if a valid access cookie is present. Otherwise pass.
 * Use for routes accessible by guests AND users (e.g. summarize).
 */
export async function optionalAuth(req, _res, next) {
  try {
    const token = readAccessFromReq(req);
    if (!token) return next();
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (user?.isActive && user.role?.status === 'ACTIVE') {
      req.user = user;
    }
    next();
  } catch {
    // Invalid access token in optional mode → just skip
    next();
  }
}

/** Require a valid authenticated user. */
export async function requireAuth(req, _res, next) {
  try {
    const token = readAccessFromReq(req);
    if (!token) throw ApiError.unauthenticated();
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user) throw ApiError.unauthenticated('Account not found');
    if (!user.isActive) throw ApiError.forbidden('Account is deactivated');
    if (user.role?.status !== 'ACTIVE') throw ApiError.forbidden('Role is deactivated');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/** Require a specific permission string present on the user's role. */
export function requirePermission(...perms) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthenticated());
    const granted = new Set(req.user.role?.permissions || []);
    const ok = perms.every((p) => granted.has(p));
    if (!ok) return next(ApiError.forbidden('Insufficient permissions'));
    next();
  };
}

/** Require user has one of the listed role names. */
export function requireRole(...roleNames) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthenticated());
    if (!roleNames.includes(req.user.role?.name)) {
      return next(ApiError.forbidden('Insufficient role'));
    }
    next();
  };
}

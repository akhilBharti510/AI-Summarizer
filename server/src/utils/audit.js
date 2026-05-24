import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

/**
 * Fire-and-forget audit writer.
 * Never throws — auditing failures must not break business operations.
 */
export function writeAudit({ actorId = null, action, target = null, metadata = null, req = null }) {
  const data = {
    actorId,
    action,
    target,
    metadata,
    ip: req?.ip || null,
    userAgent: req?.headers?.['user-agent']?.slice(0, 500) || null,
  };
  prisma.auditLog.create({ data }).catch((err) => {
    logger.error('Audit write failed', { err: err.message, action });
  });
}

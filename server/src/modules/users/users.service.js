import { prisma } from '../../config/db.js';
import { ROLES } from '../../config/constants.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAudit } from '../../utils/audit.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { revokeAllForUser } from '../../services/tokens.js';

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    emailVerified: u.emailVerified,
    isActive: u.isActive,
    role: u.role ? { id: u.role.id, name: u.role.name, dailyLimit: u.role.dailyLimit } : null,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

export async function listUsers({ q, roleId, isActive, page, limit }) {
  const where = {
    ...(roleId ? { roleId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { role: true },
    }),
  ]);
  return { items: rows.map(publicUser), pagination: buildPaginationMeta({ total, page, limit }) };
}

export async function getUser(id) {
  const u = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!u) throw ApiError.notFound('User not found');
  return publicUser(u);
}

export async function updateUser(id, input, { actor, req }) {
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) throw ApiError.notFound('User not found');

  // Self-protection: an admin cannot demote or deactivate themselves
  if (actor.id === id) {
    if (input.isActive === false) throw ApiError.forbidden("You can't deactivate your own account");
    if (input.roleId && input.roleId !== target.roleId) {
      throw ApiError.forbidden("You can't change your own role");
    }
  }

  if (input.roleId) {
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) throw ApiError.badRequest('Role not found');
    if (role.status !== 'ACTIVE') throw ApiError.badRequest('Role is inactive');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: { role: true },
  });

  if (input.roleId && input.roleId !== target.roleId) {
    writeAudit({
      actorId: actor.id,
      action: 'user.role.change',
      target: id,
      metadata: { from: target.role?.name, to: updated.role?.name },
      req,
    });
    await prisma.notification.create({
      data: {
        userId: id,
        type: 'role.changed',
        title: 'Your role was changed',
        body: `Your role is now ${updated.role?.name}.`,
      },
    });
    await revokeAllForUser(id); // force fresh JWT with new role
  }
  if (input.isActive !== undefined && input.isActive !== target.isActive) {
    writeAudit({
      actorId: actor.id,
      action: input.isActive ? 'user.activate' : 'user.deactivate',
      target: id,
      req,
    });
    if (!input.isActive) await revokeAllForUser(id);
  }
  return publicUser(updated);
}

export async function resetUsage(id, { actor, req }) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');
  await prisma.user.update({ where: { id }, data: { quotaResetAt: new Date() } });
  writeAudit({ actorId: actor.id, action: 'user.usage.reset', target: id, req });
  await prisma.notification
    .create({
      data: {
        userId: id,
        type: 'usage.reset',
        title: 'Your daily quota was reset',
        body: 'An administrator reset your daily summary quota.',
      },
    })
    .catch(() => {});
  return { reset: true };
}

export async function deactivate(id, { actor, req }) {
  return updateUser(id, { isActive: false }, { actor, req });
}

export async function updateMyProfile(userId, input) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
    include: { role: true },
  });
  return publicUser(updated);
}

export async function getMyProfile(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!u) throw ApiError.notFound();
  return publicUser(u);
}

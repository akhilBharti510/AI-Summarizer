import { prisma } from '../../config/db.js';
import { ROLES, ALL_PERMISSIONS } from '../../config/constants.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAudit } from '../../utils/audit.js';
import { buildPaginationMeta } from '../../utils/pagination.js';

function assertNotAdminMutation(role, intent) {
  if (role.name === ROLES.ADMIN) {
    if (intent === 'delete') throw ApiError.forbidden('The Admin role cannot be deleted');
    if (intent === 'deactivate') throw ApiError.forbidden('The Admin role cannot be deactivated');
  }
}

export async function listRoles({ q, status, page, limit }) {
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { users: true } } },
    }),
  ]);
  return {
    items: rows.map(serialize),
    pagination: buildPaginationMeta({ total, page, limit }),
  };
}

export async function getRole(id) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw ApiError.notFound('Role not found');
  return serialize(role);
}

export async function createRole(input, { actorId, req }) {
  const exists = await prisma.role.findUnique({ where: { name: input.name } });
  if (exists) throw ApiError.conflict('A role with that name already exists');
  const role = await prisma.role.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      dailyLimit: input.dailyLimit,
      permissions: input.permissions,
      isSystem: false,
    },
    include: { _count: { select: { users: true } } },
  });
  writeAudit({ actorId, action: 'role.create', target: role.id, metadata: { name: role.name }, req });
  return serialize(role);
}

export async function updateRole(id, input, { actorId, req }) {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Role not found');

  if (input.name && input.name !== existing.name) {
    if (existing.isSystem) throw ApiError.forbidden('System roles cannot be renamed');
    const conflict = await prisma.role.findUnique({ where: { name: input.name } });
    if (conflict) throw ApiError.conflict('A role with that name already exists');
  }

  if (input.status === 'INACTIVE') assertNotAdminMutation(existing, 'deactivate');

  // Don't allow stripping admin's required permissions
  if (existing.name === ROLES.ADMIN && input.permissions) {
    const missing = ALL_PERMISSIONS.filter((p) => !input.permissions.includes(p));
    if (missing.length) throw ApiError.forbidden('Admin role must retain all permissions');
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dailyLimit !== undefined ? { dailyLimit: input.dailyLimit } : {}),
      ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: { _count: { select: { users: true } } },
  });

  writeAudit({
    actorId,
    action: 'role.update',
    target: role.id,
    metadata: { name: role.name, changes: Object.keys(input) },
    req,
  });
  await notifyAffectedUsers(role.id, role.name);
  return serialize(role);
}

export async function setRoleStatus(id, status, { actorId, req }) {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Role not found');
  if (status === 'INACTIVE') assertNotAdminMutation(existing, 'deactivate');
  if (existing.status === status) return serialize({ ...existing, _count: { users: 0 } });
  const role = await prisma.role.update({
    where: { id },
    data: { status },
    include: { _count: { select: { users: true } } },
  });
  writeAudit({
    actorId,
    action: status === 'ACTIVE' ? 'role.activate' : 'role.deactivate',
    target: role.id,
    metadata: { name: role.name },
    req,
  });
  return serialize(role);
}

export async function deleteRole(id, { actorId, req }) {
  const existing = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) throw ApiError.notFound('Role not found');
  assertNotAdminMutation(existing, 'delete');
  if (existing.isSystem) throw ApiError.forbidden('System roles cannot be deleted');
  if (existing._count.users > 0) {
    throw ApiError.conflict('Role is assigned to users; reassign them before deleting');
  }
  await prisma.role.delete({ where: { id } });
  writeAudit({ actorId, action: 'role.delete', target: id, metadata: { name: existing.name }, req });
  return { id, deleted: true };
}

export function getPermissionCatalog() {
  return ALL_PERMISSIONS.map((key) => ({ key, group: key.split('.')[0] }));
}

async function notifyAffectedUsers(roleId, roleName) {
  const users = await prisma.user.findMany({ where: { roleId }, select: { id: true } });
  if (!users.length) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: 'role.updated',
      title: 'Your role was updated',
      body: `Your "${roleName}" role's settings were changed by an administrator.`,
    })),
  });
}

function serialize(role) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    dailyLimit: role.dailyLimit,
    permissions: role.permissions,
    isSystem: role.isSystem,
    status: role.status,
    userCount: role._count?.users ?? 0,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

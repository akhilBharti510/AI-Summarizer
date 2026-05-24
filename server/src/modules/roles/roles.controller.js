import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated, noContent } from '../../utils/ApiResponse.js';
import * as svc from './roles.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await svc.listRoles(req.query);
  return paginated(res, items, pagination);
});

export const get = asyncHandler(async (req, res) => {
  const role = await svc.getRole(req.params.id);
  return ok(res, { role });
});

export const create = asyncHandler(async (req, res) => {
  const role = await svc.createRole(req.body, { actorId: req.user.id, req });
  return created(res, { role });
});

export const update = asyncHandler(async (req, res) => {
  const role = await svc.updateRole(req.params.id, req.body, { actorId: req.user.id, req });
  return ok(res, { role });
});

export const activate = asyncHandler(async (req, res) => {
  const role = await svc.setRoleStatus(req.params.id, 'ACTIVE', { actorId: req.user.id, req });
  return ok(res, { role });
});

export const deactivate = asyncHandler(async (req, res) => {
  const role = await svc.setRoleStatus(req.params.id, 'INACTIVE', { actorId: req.user.id, req });
  return ok(res, { role });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteRole(req.params.id, { actorId: req.user.id, req });
  return noContent(res);
});

export const permissionsCatalog = asyncHandler(async (_req, res) => {
  return ok(res, { permissions: svc.getPermissionCatalog() });
});

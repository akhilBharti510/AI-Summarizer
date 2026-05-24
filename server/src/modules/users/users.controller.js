import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import * as svc from './users.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await svc.listUsers(req.query);
  return paginated(res, items, pagination);
});

export const get = asyncHandler(async (req, res) => {
  const user = await svc.getUser(req.params.id);
  return ok(res, { user });
});

export const update = asyncHandler(async (req, res) => {
  const user = await svc.updateUser(req.params.id, req.body, { actor: req.user, req });
  return ok(res, { user });
});

export const resetUsage = asyncHandler(async (req, res) => {
  const result = await svc.resetUsage(req.params.id, { actor: req.user, req });
  return ok(res, result);
});

export const deactivate = asyncHandler(async (req, res) => {
  const user = await svc.deactivate(req.params.id, { actor: req.user, req });
  return ok(res, { user });
});

export const myProfile = asyncHandler(async (req, res) => {
  const user = await svc.getMyProfile(req.user.id);
  return ok(res, { user });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await svc.updateMyProfile(req.user.id, req.body);
  return ok(res, { user });
});

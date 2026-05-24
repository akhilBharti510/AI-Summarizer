import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  requestPasswordReset,
  completePasswordReset,
  changePassword,
  publicUser,
} from './auth.service.js';
import {
  setAuthCookies,
  clearAuthCookies,
  readRefreshFromReq,
} from '../../services/tokens.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, tokens } = await registerUser({ name, email, password, req });
  setAuthCookies(res, tokens.access, tokens.refresh);
  return created(res, { user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, tokens } = await loginUser({ email, password, req });
  setAuthCookies(res, tokens.access, tokens.refresh);
  return ok(res, { user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = readRefreshFromReq(req);
  await logoutUser({ refreshToken, userId: req.user?.id, req });
  clearAuthCookies(res);
  return ok(res, { loggedOut: true });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = readRefreshFromReq(req);
  const { access, refresh: newRefresh, user } = await refreshSession({ refreshToken, req });
  setAuthCookies(res, access, newRefresh);
  return ok(res, { user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, { user: publicUser(req.user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset({ email: req.body.email, req });
  // Generic response — don't leak whether the email exists
  return ok(res, { message: 'If an account exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await completePasswordReset({ token: req.body.token, password: req.body.password, req });
  return ok(res, { message: 'Password updated. Please log in again.' });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  await changePassword({
    user: req.user,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    req,
  });
  clearAuthCookies(res);
  return ok(res, { message: 'Password changed. Please log in again.' });
});

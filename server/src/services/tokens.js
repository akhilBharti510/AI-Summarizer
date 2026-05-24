import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const ACCESS_COOKIE = 'at';
const REFRESH_COOKIE = 'rt';
const REFRESH_PATH = `${env.API_PREFIX}/auth`;

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role?.name, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL },
  );
}

function signRefresh(user, family, jti) {
  return jwt.sign(
    { sub: user.id, family, jti, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL },
  );
}

function cookieOpts(maxAgeMs, path = '/') {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path,
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOpts(ms(env.JWT_ACCESS_TTL)));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(ms(env.JWT_REFRESH_TTL), REFRESH_PATH));
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...cookieOpts(0), maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOpts(0, REFRESH_PATH), maxAge: undefined });
}

export function readAccessFromReq(req) {
  return req.cookies?.[ACCESS_COOKIE] || null;
}
export function readRefreshFromReq(req) {
  return req.cookies?.[REFRESH_COOKIE] || null;
}

export function verifyAccess(token) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw ApiError.unauthenticated('Invalid or expired session');
  }
}

function verifyRefresh(token) {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') throw new Error('wrong token type');
    return payload;
  } catch {
    throw ApiError.unauthenticated('Invalid or expired refresh token');
  }
}

/**
 * Issue a fresh access+refresh pair, persist refresh hash, return both tokens.
 * Starts a new family (call on initial login / register / oauth).
 */
export async function issueTokensForLogin(user, { ip, userAgent } = {}) {
  const family = crypto.randomUUID();
  const jti = crypto.randomUUID();
  const refresh = signRefresh(user, family, jti);
  const access = signAccess(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refresh),
      family,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + ms(env.JWT_REFRESH_TTL)),
    },
  });
  return { access, refresh };
}

/**
 * Rotate refresh. Verifies token, checks DB record, marks old revoked, issues new.
 * Detects reuse: if presented token is already revoked → revoke entire family.
 */
export async function rotateRefresh(presented, { ip, userAgent } = {}) {
  const payload = verifyRefresh(presented);
  const hash = sha256(presented);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!record) {
    // Token signature valid but unknown to DB → treat as compromise of the family if we can.
    await prisma.refreshToken.updateMany({
      where: { family: payload.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthenticated('Refresh token not recognized');
  }

  if (record.revokedAt) {
    // Reuse detected → revoke entire family
    await prisma.refreshToken.updateMany({
      where: { family: record.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthenticated('Refresh token reuse detected');
  }

  if (record.expiresAt < new Date()) {
    throw ApiError.unauthenticated('Refresh token expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    include: { role: true },
  });
  if (!user || !user.isActive) throw ApiError.unauthenticated('Account inactive');

  // Mint new pair in same family
  const newJti = crypto.randomUUID();
  const newRefresh = signRefresh(user, record.family, newJti);
  const newAccess = signAccess(user);

  const newRec = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(newRefresh),
      family: record.family,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + ms(env.JWT_REFRESH_TTL)),
    },
  });
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date(), replacedBy: newRec.id },
  });

  return { access: newAccess, refresh: newRefresh, user };
}

/** Revoke a single refresh token (logout this device). */
export async function revokeRefresh(presented) {
  if (!presented) return;
  try {
    verifyRefresh(presented);
  } catch {
    return;
  }
  const hash = sha256(presented);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revoke ALL refresh tokens for a user (logout everywhere / after password reset). */
export async function revokeAllForUser(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export { sha256 };

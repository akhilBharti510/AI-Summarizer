import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../config/constants.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  issueTokensForLogin,
  rotateRefresh,
  revokeRefresh,
  revokeAllForUser,
  sha256,
} from '../../services/tokens.js';
import { sendMail, buildResetEmail } from '../../services/mailer.js';
import { writeAudit } from '../../utils/audit.js';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 30 * 60 * 1000;

async function getDefaultUserRole() {
  const role = await prisma.role.findUnique({ where: { name: ROLES.USER } });
  if (!role) throw ApiError.internal('Default User role missing — run db:seed');
  return role;
}

export async function registerUser({ name, email, password, req }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const role = await getDefaultUserRole();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, roleId: role.id, emailVerified: false },
    include: { role: true },
  });

  const tokens = await issueTokensForLogin(user, {
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent'],
  });

  writeAudit({ actorId: user.id, action: 'auth.register', target: user.id, req });
  return { user, tokens };
}

export async function loginUser({ email, password, req }) {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user || !user.passwordHash) {
    writeAudit({ action: 'auth.login.failed', metadata: { email, reason: 'no_account' }, req });
    throw ApiError.unauthenticated('Invalid email or password');
  }
  if (!user.isActive) {
    writeAudit({ actorId: user.id, action: 'auth.login.failed', metadata: { reason: 'inactive' }, req });
    throw ApiError.forbidden('Account is deactivated');
  }
  if (user.role?.status !== 'ACTIVE') {
    throw ApiError.forbidden('Role is deactivated');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    writeAudit({ actorId: user.id, action: 'auth.login.failed', metadata: { reason: 'bad_password' }, req });
    throw ApiError.unauthenticated('Invalid email or password');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await issueTokensForLogin(user, {
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent'],
  });
  writeAudit({ actorId: user.id, action: 'auth.login', target: user.id, req });
  return { user, tokens };
}

export async function logoutUser({ refreshToken, userId, req }) {
  await revokeRefresh(refreshToken);
  if (userId) writeAudit({ actorId: userId, action: 'auth.logout', target: userId, req });
}

export async function refreshSession({ refreshToken, req }) {
  if (!refreshToken) throw ApiError.unauthenticated('Missing refresh token');
  return rotateRefresh(refreshToken, {
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent'],
  });
}

export async function requestPasswordReset({ email, req }) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond as if it succeeded — don't leak account existence
  if (!user || !user.isActive) {
    writeAudit({ action: 'auth.password_reset.requested', metadata: { email, hit: false }, req });
    return;
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: sha256(rawToken),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  const link = `${env.APP_URL}/reset-password?token=${rawToken}`;
  const { text, html } = buildResetEmail({ name: user.name, link });
  await sendMail({ to: user.email, subject: 'Reset your AI Summarizer password', text, html });
  writeAudit({ actorId: user.id, action: 'auth.password_reset.requested', target: user.id, req });
}

export async function completePasswordReset({ token, password, req }) {
  const hash = sha256(token);
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: hash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await revokeAllForUser(record.userId);
  writeAudit({ actorId: record.userId, action: 'auth.password_reset.completed', target: record.userId, req });
}

export async function changePassword({ user, currentPassword, newPassword, req }) {
  if (!user.passwordHash) throw ApiError.badRequest('Password is managed by Google sign-in');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.unauthenticated('Current password is incorrect');
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await revokeAllForUser(user.id);
  writeAudit({ actorId: user.id, action: 'auth.password_changed', target: user.id, req });
}

/** Used by OAuth flow: find-or-create a user linked to a Google profile. */
export async function upsertGoogleUser({ googleId, email, name, avatarUrl, req }) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    include: { role: true },
  });
  if (user) {
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, emailVerified: true, avatarUrl: user.avatarUrl || avatarUrl },
        include: { role: true },
      });
    }
  } else {
    const role = await getDefaultUserRole();
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatarUrl,
        googleId,
        emailVerified: true,
        roleId: role.id,
      },
      include: { role: true },
    });
  }
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await issueTokensForLogin(user, {
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent'],
  });
  writeAudit({ actorId: user.id, action: 'auth.login.google', target: user.id, req });
  return { user, tokens };
}

export function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    emailVerified: u.emailVerified,
    role: u.role
      ? {
          id: u.role.id,
          name: u.role.name,
          permissions: u.role.permissions,
          dailyLimit: u.role.dailyLimit,
        }
      : null,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

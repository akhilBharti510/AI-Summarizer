export const ROLES = Object.freeze({
  GUEST: 'Guest',
  USER: 'User',
  PREMIUM: 'Premium',
  ADMIN: 'Admin',
});

export const PERMISSIONS = Object.freeze({
  SUMMARY_CREATE: 'summary.create',
  SUMMARY_READ_OWN: 'summary.read.own',
  SUMMARY_DELETE_OWN: 'summary.delete.own',
  SUMMARY_EXPORT: 'summary.export',
  BOOKMARK_MANAGE: 'bookmark.manage.own',

  ADMIN_USERS_READ: 'admin.users.read',
  ADMIN_USERS_UPDATE: 'admin.users.update',
  ADMIN_USERS_DELETE: 'admin.users.delete',

  ADMIN_ROLES_READ: 'admin.roles.read',
  ADMIN_ROLES_CREATE: 'admin.roles.create',
  ADMIN_ROLES_UPDATE: 'admin.roles.update',
  ADMIN_ROLES_DELETE: 'admin.roles.delete',

  ADMIN_AUDIT_READ: 'admin.audit.read',
  ADMIN_ANALYTICS_READ: 'admin.analytics.read',
});

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_ROLE_PRESETS = {
  [ROLES.GUEST]: {
    description: 'Anonymous session-based access',
    dailyLimit: 3,
    permissions: [PERMISSIONS.SUMMARY_CREATE],
    isSystem: true,
  },
  [ROLES.USER]: {
    description: 'Free authenticated user',
    dailyLimit: 20,
    permissions: [
      PERMISSIONS.SUMMARY_CREATE,
      PERMISSIONS.SUMMARY_READ_OWN,
      PERMISSIONS.SUMMARY_DELETE_OWN,
      PERMISSIONS.SUMMARY_EXPORT,
      PERMISSIONS.BOOKMARK_MANAGE,
    ],
    isSystem: true,
  },
  [ROLES.PREMIUM]: {
    description: 'Paid premium tier',
    dailyLimit: 100,
    permissions: [
      PERMISSIONS.SUMMARY_CREATE,
      PERMISSIONS.SUMMARY_READ_OWN,
      PERMISSIONS.SUMMARY_DELETE_OWN,
      PERMISSIONS.SUMMARY_EXPORT,
      PERMISSIONS.BOOKMARK_MANAGE,
    ],
    isSystem: true,
  },
  [ROLES.ADMIN]: {
    description: 'Platform administrator',
    dailyLimit: -1,
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  },
};

export const SUMMARY_LIMITS = Object.freeze({
  TEXT_MAX_CHARS: 100_000,
  EXTRACT_MAX_CHARS: 200_000,
});

export const ERROR_CODES = Object.freeze({
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA: 'UNSUPPORTED_MEDIA',
  INTERNAL: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  CSRF: 'CSRF_FAILED',
});

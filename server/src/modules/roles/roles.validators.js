import { z } from 'zod';
import { ALL_PERMISSIONS } from '../../config/constants.js';

const PERM_SET = new Set(ALL_PERMISSIONS);

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9 _-]+$/, 'Letters, numbers, spaces, _ and - only'),
  description: z.string().trim().max(280).optional().nullable(),
  dailyLimit: z.number().int().refine((v) => v === -1 || v >= 0, 'dailyLimit must be -1 or >=0'),
  permissions: z
    .array(z.string())
    .max(64)
    .refine((arr) => arr.every((p) => PERM_SET.has(p)), 'Unknown permission'),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const listRolesQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const roleIdParamSchema = z.object({
  id: z.string().min(1),
});

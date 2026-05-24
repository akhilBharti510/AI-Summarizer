import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  roleId: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserSchema = z
  .object({
    roleId: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'At least one field required');

export const idParamSchema = z.object({ id: z.string().min(1) });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

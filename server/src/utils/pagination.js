import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function parsePagination(query) {
  const { page, limit } = paginationQuerySchema.parse({
    page: query.page,
    limit: query.limit,
  });
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildPaginationMeta({ total, page, limit }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

import { z } from 'zod';

export const SOURCE_TYPES = ['TEXT', 'URL', 'PDF', 'DOCX', 'IMAGE'];
export const SUMMARY_TYPES = [
  'QUICK',
  'DETAILED',
  'BULLETS',
  'TLDR',
  'KEY_TAKEAWAYS',
  'EXECUTIVE',
  'ELI_BEGINNER',
];
export const LENGTHS = ['SHORT', 'MEDIUM', 'LONG'];
export const TONES = ['SIMPLE', 'PROFESSIONAL', 'ACADEMIC'];

const languageSchema = z
  .string()
  .min(1)
  .max(60)
  .refine(
    (v) => /^(en|hi|fr|es|de)$/.test(v) || v.startsWith('custom:'),
    'Language must be en|hi|fr|es|de or "custom:<name>"',
  );

export const createSummarySchema = z.object({
  sourceType: z.enum(SOURCE_TYPES),
  text: z.string().max(100_000).optional(),
  url: z.string().url().optional(),
  title: z.string().trim().min(1).max(160).optional(),
  summaryType: z.enum(SUMMARY_TYPES).default('QUICK'),
  length: z.enum(LENGTHS).default('MEDIUM'),
  tone: z.enum(TONES).default('SIMPLE'),
  language: languageSchema.default('en'),
});

export const regenerateSummarySchema = z.object({
  summaryType: z.enum(SUMMARY_TYPES).optional(),
  length: z.enum(LENGTHS).optional(),
  tone: z.enum(TONES).optional(),
  language: languageSchema.optional(),
});

export const listSummariesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(SUMMARY_TYPES).optional(),
  sourceType: z.enum(SOURCE_TYPES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const renameSummarySchema = z.object({
  title: z.string().trim().min(1).max(160),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export const exportQuerySchema = z.object({
  format: z.enum(['txt', 'pdf']).default('txt'),
});

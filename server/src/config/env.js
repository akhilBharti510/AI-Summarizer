import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().default('AI Summarizer'),
  API_PREFIX: z.string().default('/api/v1'),
  APP_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >=32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be >=32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('90d'),

  COOKIE_DOMAIN: z.string().optional().or(z.literal('')),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be >=16 chars'),

  GOOGLE_CLIENT_ID: z.string().optional().or(z.literal('')),
  GOOGLE_CLIENT_SECRET: z.string().optional().or(z.literal('')),
  GOOGLE_CALLBACK_URL: z.string().url().optional().or(z.literal('')),
  OAUTH_SUCCESS_REDIRECT: z.string().url().default('http://localhost:5173/dashboard'),
  OAUTH_FAILURE_REDIRECT: z.string().url().default('http://localhost:5173/login?error=oauth'),

  GEMINI_API_KEY: z.string().optional().or(z.literal('')),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  SMTP_HOST: z.string().optional().or(z.literal('')),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().or(z.literal('')),
  SMTP_PASS: z.string().optional().or(z.literal('')),
  MAIL_FROM: z.string().default('AI Summarizer <no-reply@example.com>'),

  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(8).default('ChangeMe!2025'),
  ADMIN_NAME: z.string().default('Administrator'),

  SENTRY_DSN: z.string().optional().or(z.literal('')),

  UPLOAD_MAX_MB: z.coerce.number().positive().default(10),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const e = parsed.data;

// Production hardening: things that are merely "weird" in dev are deploy-breakers in prod.
if (e.NODE_ENV === 'production') {
  const prodIssues = [];
  if (!e.COOKIE_SECURE) prodIssues.push('COOKIE_SECURE must be "true" in production (cross-site cookies require Secure).');
  if (/replace-me/i.test(e.JWT_ACCESS_SECRET) || /replace-me/i.test(e.JWT_REFRESH_SECRET)) {
    prodIssues.push('JWT secrets are still the example placeholders — rotate to random 64-byte values.');
  }
  if (/replace-me/i.test(e.SESSION_SECRET)) {
    prodIssues.push('SESSION_SECRET is still the example placeholder.');
  }
  if (/localhost|127\.0\.0\.1/.test(e.OAUTH_SUCCESS_REDIRECT) || /localhost|127\.0\.0\.1/.test(e.OAUTH_FAILURE_REDIRECT)) {
    prodIssues.push('OAUTH_*_REDIRECT still points at localhost.');
  }
  if (e.CORS_ORIGINS.split(',').some((o) => /localhost|127\.0\.0\.1/.test(o))) {
    prodIssues.push('CORS_ORIGINS contains a localhost entry — production should only allow your public frontend origin(s).');
  }
  if (e.ADMIN_PASSWORD === 'ChangeMe!2025') {
    prodIssues.push('ADMIN_PASSWORD is still the seed default — rotate before db:seed.');
  }
  if (prodIssues.length) {
    // eslint-disable-next-line no-console
    console.error('❌ Production env validation failed:\n  - ' + prodIssues.join('\n  - '));
    process.exit(1);
  }
}

export const env = {
  ...e,
  isProd: e.NODE_ENV === 'production',
  isDev: e.NODE_ENV === 'development',
  isTest: e.NODE_ENV === 'test',
  corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  uploadMaxBytes: e.UPLOAD_MAX_MB * 1024 * 1024,
};

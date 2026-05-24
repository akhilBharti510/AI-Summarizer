#!/usr/bin/env node
/**
 * Lightweight diagnostic — verifies third-party wiring without exercising it.
 * Usage:  node scripts/check-integrations.js
 */
import 'dotenv/config';

const checks = [];
function check(name, ok, hint) {
  checks.push({ name, ok, hint });
}

check('DATABASE_URL set', Boolean(process.env.DATABASE_URL), 'Set DATABASE_URL to a Postgres connection string (Neon).');
check('JWT secrets set', (process.env.JWT_ACCESS_SECRET?.length || 0) >= 32 && (process.env.JWT_REFRESH_SECRET?.length || 0) >= 32, 'Both JWT_*_SECRET must be ≥32 chars.');
check('SESSION_SECRET set', (process.env.SESSION_SECRET?.length || 0) >= 16, 'Set SESSION_SECRET (≥16 chars).');
check('CORS_ORIGINS set', Boolean(process.env.CORS_ORIGINS), 'Set CORS_ORIGINS=https://your-frontend');
check('Gemini API key', Boolean(process.env.GEMINI_API_KEY), 'GEMINI_API_KEY missing — summarization will 500.');
check('SMTP configured', Boolean(process.env.SMTP_HOST), 'Mail not configured — forgot-password will fail in production.');
check('Google OAuth configured', Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), 'Google sign-in disabled (optional).');
check('Sentry DSN set', Boolean(process.env.SENTRY_DSN), 'Sentry off (optional).');
check('Admin seed creds', Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD), 'Set ADMIN_EMAIL/ADMIN_PASSWORD before running db:seed.');

let failures = 0;
for (const c of checks) {
  const icon = c.ok ? '✅' : '⚠️ ';
  console.log(`${icon} ${c.name}${c.ok ? '' : ` — ${c.hint}`}`);
  if (!c.ok && ['DATABASE_URL set', 'JWT secrets set', 'SESSION_SECRET set'].includes(c.name)) failures++;
}
if (failures) {
  console.error(`\n${failures} required check(s) failed.`);
  process.exit(1);
}
console.log('\nAll required integrations look OK.');

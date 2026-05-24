import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import { env } from '../config/env.js';

const PgStore = ConnectPgSimple(session);

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : undefined,
});

/**
 * Guest session middleware.
 * - Session cookie (no maxAge) → cleared when browser closes (per spec).
 * - Server-side store in Postgres so it survives restarts but still expires
 *   via TTL sweep, and the cookie itself is gone after browser close.
 */
export const guestSession = session({
  name: 'sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: false,
  store: new PgStore({
    pool,
    tableName: 'guest_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 60, // hourly
  }),
  cookie: {
    httpOnly: true,
    // Cross-site cookies (Vercel ↔ Railway) require SameSite=None + Secure.
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    // no maxAge → browser session cookie
  },
});

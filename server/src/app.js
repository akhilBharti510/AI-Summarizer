import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import passport from 'passport';

import { env } from './config/env.js';
import { logger, httpLogStream } from './config/logger.js';
import { initSentry } from './config/sentry.js';
import { prisma } from './config/db.js';

import { guestSession } from './middlewares/guestSession.js';
import { sanitize } from './middlewares/sanitize.js';
import { globalLimiter } from './middlewares/rateLimit.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

import { configureGoogleOAuth } from './modules/auth/auth.oauth.js';
import apiRoutes from './routes/index.js';

const app = express();

// Trust first proxy (Railway/Vercel/etc.)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ─── Sentry (must be first) ───────────────────────────────
initSentry(app);

// ─── Core security headers ────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: env.isProd ? undefined : false,
  }),
);

// ─── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // mobile/curl
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
  }),
);

// ─── Parsers ──────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(hpp());
app.use(compression());

// ─── Guest session (only attaches, never required) ────────
app.use(guestSession);

// ─── Passport (used statelessly for Google OAuth) ─────────
configureGoogleOAuth();
app.use(passport.initialize());

// ─── Sanitize input (after parsers) ───────────────────────
app.use(sanitize);

// ─── HTTP access logs ─────────────────────────────────────
app.use(
  morgan(env.isProd ? 'combined' : 'dev', {
    stream: httpLogStream,
    skip: (req) => req.path === '/healthz' || req.path === '/readyz',
  }),
);

// ─── Global rate limit ────────────────────────────────────
app.use(globalLimiter);

// ─── Health probes ────────────────────────────────────────
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.get('/readyz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true });
  } catch (e) {
    logger.error('Readiness check failed', { err: e.message });
    res.status(503).json({ ok: false });
  }
});

// ─── API routes ───────────────────────────────────────────
app.use(env.API_PREFIX, apiRoutes);

// ─── 404 + error handler (last) ───────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;

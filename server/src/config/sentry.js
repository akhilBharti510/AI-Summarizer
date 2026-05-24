import * as Sentry from '@sentry/node';
import { env } from './env.js';
import { logger } from './logger.js';

let initialized = false;

export function initSentry(app) {
  if (!env.SENTRY_DSN) {
    logger.info('Sentry disabled (no DSN)');
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.isProd ? 0.1 : 1.0,
  });
  Sentry.setupExpressErrorHandler(app);
  initialized = true;
  logger.info('Sentry initialized');
}

export function captureError(err, context = {}) {
  if (!initialized) return;
  Sentry.captureException(err, { extra: context });
}

export { Sentry };

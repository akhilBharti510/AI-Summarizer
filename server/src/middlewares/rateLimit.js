import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

const handler = (_req, _res, next) => next(ApiError.rateLimited());

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

export const summarizeLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.sessionID || req.ip,
  handler,
});

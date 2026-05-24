import { ZodError } from 'zod';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import { logger } from '../config/logger.js';
import { captureError } from '../config/sentry.js';
import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let apiErr;

  if (err instanceof ApiError) {
    apiErr = err;
  } else if (err instanceof ZodError) {
    apiErr = ApiError.validation(
      'Invalid input',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  } else if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') apiErr = ApiError.tooLarge('File too large');
    else apiErr = ApiError.badRequest(err.message);
  } else if (err instanceof jwt.TokenExpiredError) {
    apiErr = ApiError.unauthenticated('Token expired');
  } else if (err instanceof jwt.JsonWebTokenError) {
    apiErr = ApiError.unauthenticated('Invalid token');
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      apiErr = ApiError.conflict('Resource already exists', { target: err.meta?.target });
    } else if (err.code === 'P2025') {
      apiErr = ApiError.notFound('Resource not found');
    } else {
      apiErr = ApiError.badRequest('Database request error');
    }
  } else if (err?.code === 'EBADCSRFTOKEN') {
    apiErr = new ApiError(403, ERROR_CODES.CSRF, 'Invalid CSRF token');
  } else {
    apiErr = ApiError.internal(err.message || 'Internal server error');
  }

  if (apiErr.statusCode >= 500) {
    logger.error('Unhandled error', { err: err.stack || err.message, path: req.originalUrl });
    captureError(err, { path: req.originalUrl, method: req.method });
  } else {
    logger.warn(`${apiErr.statusCode} ${apiErr.code} ${apiErr.message}`, {
      path: req.originalUrl,
    });
  }

  // In production, mask the raw message for 5xx (it can leak DB column names,
  // library internals, file paths). Full error is still logged above.
  const publicMessage =
    env.isProd && apiErr.statusCode >= 500 && !(err instanceof ApiError)
      ? 'Internal server error'
      : apiErr.message;

  res.status(apiErr.statusCode).json({
    success: false,
    error: {
      code: apiErr.code,
      message: publicMessage,
      ...(apiErr.details ? { details: apiErr.details } : {}),
      ...(env.isDev && apiErr.statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}

import { ERROR_CODES } from '../config/constants.js';

export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, ERROR_CODES.BAD_REQUEST, message, details);
  }
  static unauthenticated(message = 'Authentication required') {
    return new ApiError(401, ERROR_CODES.UNAUTHENTICATED, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, ERROR_CODES.FORBIDDEN, message);
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, ERROR_CODES.NOT_FOUND, message);
  }
  static conflict(message = 'Conflict', details) {
    return new ApiError(409, ERROR_CODES.CONFLICT, message, details);
  }
  static validation(message = 'Validation failed', details) {
    return new ApiError(422, ERROR_CODES.VALIDATION, message, details);
  }
  static tooLarge(message = 'Payload too large') {
    return new ApiError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, message);
  }
  static unsupportedMedia(message = 'Unsupported media type') {
    return new ApiError(415, ERROR_CODES.UNSUPPORTED_MEDIA, message);
  }
  static rateLimited(message = 'Too many requests') {
    return new ApiError(429, ERROR_CODES.RATE_LIMITED, message);
  }
  static quotaExceeded(message = 'Quota exceeded', details) {
    return new ApiError(429, ERROR_CODES.QUOTA_EXCEEDED, message, details);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, ERROR_CODES.INTERNAL, message);
  }
}

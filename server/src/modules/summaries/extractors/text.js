import { SUMMARY_LIMITS } from '../../../config/constants.js';
import { ApiError } from '../../../utils/ApiError.js';

export function extractFromText({ text }) {
  if (!text || !text.trim()) throw ApiError.badRequest('Text is required');
  if (text.length > SUMMARY_LIMITS.TEXT_MAX_CHARS) {
    throw ApiError.tooLarge(`Text exceeds ${SUMMARY_LIMITS.TEXT_MAX_CHARS} characters`);
  }
  return { text: text.slice(0, SUMMARY_LIMITS.EXTRACT_MAX_CHARS), meta: { chars: text.length } };
}

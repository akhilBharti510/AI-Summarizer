import mammoth from 'mammoth';
import { SUMMARY_LIMITS } from '../../../config/constants.js';
import { ApiError } from '../../../utils/ApiError.js';

export async function extractFromDocx({ file }) {
  if (!file) throw ApiError.badRequest('DOCX file is required');
  let result;
  try {
    result = await mammoth.extractRawText({ buffer: file.buffer });
  } catch (e) {
    throw ApiError.badRequest(`Failed to parse DOCX: ${e.message}`);
  }
  const text = (result.value || '').trim();
  if (!text) throw ApiError.badRequest('Document contains no extractable text');
  return {
    text: text.slice(0, SUMMARY_LIMITS.EXTRACT_MAX_CHARS),
    meta: { filename: file.originalname, mime: file.mimetype, chars: text.length },
  };
}

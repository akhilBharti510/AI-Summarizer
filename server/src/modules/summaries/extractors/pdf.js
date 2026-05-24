import { createRequire } from 'node:module';
import { SUMMARY_LIMITS } from '../../../config/constants.js';
import { ApiError } from '../../../utils/ApiError.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function extractFromPdf({ file }) {
  if (!file) throw ApiError.badRequest('PDF file is required');
  let parsed;
  try {
    parsed = await pdfParse(file.buffer);
  } catch (e) {
    throw ApiError.badRequest(`Failed to parse PDF: ${e.message}`);
  }
  const text = (parsed.text || '').replace(/\s+\n/g, '\n').trim();
  if (!text) throw ApiError.badRequest('PDF contains no extractable text');
  return {
    text: text.slice(0, SUMMARY_LIMITS.EXTRACT_MAX_CHARS),
    meta: {
      filename: file.originalname,
      mime: file.mimetype,
      pages: parsed.numpages,
      chars: text.length,
    },
  };
}

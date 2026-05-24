import { ApiError } from '../../../utils/ApiError.js';

/**
 * Image "extraction" is just a passthrough that bundles the buffer for the AI provider.
 * The actual OCR + summarization is done by Gemini vision in a single round trip.
 */
export function prepareImage({ file }) {
  if (!file) throw ApiError.badRequest('Image file is required');
  return {
    image: { buffer: file.buffer, mimeType: file.mimetype },
    meta: { filename: file.originalname, mime: file.mimetype, bytes: file.size },
  };
}

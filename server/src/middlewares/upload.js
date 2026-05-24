import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
};
const ALL_ALLOWED = [...ALLOWED.pdf, ...ALLOWED.docx, ...ALLOWED.image];

export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.uploadMaxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALL_ALLOWED.includes(file.mimetype)) {
      return cb(ApiError.unsupportedMedia(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
}).single('file');

/** Verify magic bytes match the claimed mimetype. Must run after multer parses the body. */
export async function verifyFileMagic(req, _res, next) {
  if (!req.file) return next();
  try {
    const detected = await fileTypeFromBuffer(req.file.buffer);
    // DOCX is a zip — file-type returns 'zip' or sometimes the office subtype depending on lib version.
    const isDocx =
      req.file.mimetype === ALLOWED.docx[0] &&
      (detected?.mime === 'application/zip' || detected?.mime === ALLOWED.docx[0]);
    const claimed = req.file.mimetype;
    const ok = isDocx || (detected && detected.mime === claimed);
    if (!ok) return next(ApiError.unsupportedMedia('File content does not match its type'));
    next();
  } catch (e) {
    next(ApiError.badRequest(`File validation failed: ${e.message}`));
  }
}

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated, noContent } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as svc from './summaries.service.js';
import { getOwned } from './summaries.service.js';
import { buildTxt } from '../../services/exports/txt.js';
import { streamSummaryPdf } from '../../services/exports/pdf.js';

/**
 * Multipart fields arrive as strings; coerce known options before validation.
 * The router runs upload → parseMultipartFields → validate(createSummarySchema).
 */
export function parseMultipartFields(req, _res, next) {
  if (req.is('multipart/form-data') && req.body) {
    // multer already converted simple text fields to strings; keep `file` separate.
    for (const k of ['summaryType', 'length', 'tone', 'language', 'sourceType', 'title', 'text', 'url']) {
      if (typeof req.body[k] === 'string') req.body[k] = req.body[k].trim();
    }
  }
  next();
}

export const create = asyncHandler(async (req, res) => {
  // Cross-field validation: file required for PDF/DOCX/IMAGE, text/url for the rest
  const t = req.body.sourceType;
  if ((t === 'PDF' || t === 'DOCX' || t === 'IMAGE') && !req.file) {
    throw ApiError.badRequest(`A file is required for ${t} summaries`);
  }
  if (t === 'TEXT' && !req.body.text) throw ApiError.badRequest('text is required');
  if (t === 'URL' && !req.body.url) throw ApiError.badRequest('url is required');

  const summary = await svc.createSummary({ input: req.body, file: req.file, req });
  return created(res, { summary: { id: summary.id, title: summary.title, output: summary.output, createdAt: summary.createdAt, status: summary.status, summaryType: summary.summaryType } });
});

export const regenerate = asyncHandler(async (req, res) => {
  const summary = await svc.regenerate({ id: req.params.id, options: req.body, req });
  return created(res, { summary: { id: summary.id, title: summary.title, output: summary.output, createdAt: summary.createdAt } });
});

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await svc.listSummaries({ ...req.query, req });
  return paginated(res, items, pagination);
});

export const get = asyncHandler(async (req, res) => {
  const summary = await svc.getSummary({ id: req.params.id, req });
  return ok(res, { summary });
});

export const rename = asyncHandler(async (req, res) => {
  const summary = await svc.renameSummary({ id: req.params.id, title: req.body.title, req });
  return ok(res, { summary });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteSummary({ id: req.params.id, req });
  return noContent(res);
});

export const bookmark = asyncHandler(async (req, res) => {
  const result = await svc.toggleBookmark({ id: req.params.id, req });
  return ok(res, result);
});

export const exportFile = asyncHandler(async (req, res) => {
  const summary = await getOwned(req.params.id, req);
  if (req.query.format === 'pdf') {
    return streamSummaryPdf(summary, res);
  }
  const txt = buildTxt(summary);
  const filename = (summary.title || 'summary').replace(/[^a-z0-9-_ ]/gi, '_').slice(0, 80) + '.txt';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(txt);
});

import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAudit } from '../../utils/audit.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { ROLES } from '../../config/constants.js';
import { aiProvider } from '../../services/ai/GeminiProvider.js';
import { buildSummaryPrompt, buildImagePrompt } from '../../services/ai/promptBuilder.js';
import { extractFromText } from './extractors/text.js';
import { extractFromUrl } from './extractors/url.js';
import { extractFromPdf } from './extractors/pdf.js';
import { extractFromDocx } from './extractors/docx.js';
import { prepareImage } from './extractors/image.js';

const GENERATION_TIMEOUT_MS = 60_000;

function deriveTitle(input, extracted) {
  if (input.title) return input.title.trim();
  if (input.sourceType === 'URL') return extracted.meta?.title || extracted.meta?.url || 'URL summary';
  if (input.sourceType === 'TEXT') {
    const first = (input.text || '').trim().split(/\s+/).slice(0, 8).join(' ');
    return first || 'Text summary';
  }
  return extracted.meta?.filename || `${input.sourceType.toLowerCase()} summary`;
}

async function extract(input, file) {
  switch (input.sourceType) {
    case 'TEXT':
      return extractFromText({ text: input.text });
    case 'URL':
      if (!input.url) throw ApiError.badRequest('URL is required');
      return extractFromUrl({ url: input.url });
    case 'PDF':
      return extractFromPdf({ file });
    case 'DOCX':
      return extractFromDocx({ file });
    case 'IMAGE':
      return prepareImage({ file });
    default:
      throw ApiError.badRequest('Unsupported source type');
  }
}

async function runAi(input, extracted) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);
  try {
    if (input.sourceType === 'IMAGE') {
      return await aiProvider.summarizeImage({
        prompt: buildImagePrompt({
          summaryType: input.summaryType,
          length: input.length,
          tone: input.tone,
          language: input.language,
        }),
        image: extracted.image,
        signal: controller.signal,
      });
    }
    return await aiProvider.summarizeText({
      prompt: buildSummaryPrompt({
        summaryType: input.summaryType,
        length: input.length,
        tone: input.tone,
        language: input.language,
        sourceHint: extracted.meta?.url || extracted.meta?.filename,
      }),
      text: extracted.text,
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw ApiError.internal('AI request timed out');
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export async function createSummary({ input, file, req, parent = null }) {
  const extracted = await extract(input, file);
  const title = deriveTitle(input, extracted);

  let aiResult;
  try {
    aiResult = await runAi(input, extracted);
  } catch (e) {
    // Persist a FAILED record only for authenticated users (helps debug; guests don't pay quota)
    if (req.user) {
      await prisma.summary
        .create({
          data: {
            userId: req.user.id,
            title,
            sourceType: input.sourceType,
            sourceMeta: extracted.meta || {},
            inputText: extracted.text?.slice(0, 50_000) || '',
            output: '',
            summaryType: input.summaryType,
            length: input.length,
            tone: input.tone,
            language: input.language,
            model: 'gemini',
            status: 'FAILED',
          },
        })
        .catch(() => {});
    }
    throw e;
  }

  const data = {
    title,
    sourceType: input.sourceType,
    sourceMeta: extracted.meta || {},
    inputText: extracted.text?.slice(0, 50_000) || '',
    output: aiResult.output,
    summaryType: input.summaryType,
    length: input.length,
    tone: input.tone,
    language: input.language,
    tokensIn: aiResult.tokensIn,
    tokensOut: aiResult.tokensOut,
    model: aiResult.model,
    status: 'COMPLETED',
  };
  if (req.user) data.userId = req.user.id;
  else data.guestSid = req.sessionID;

  // Version-chain wiring when called via regenerate().
  if (parent) {
    data.parentId = parent.id;
    data.version = (parent.version ?? 1) + 1;
    data.rootId = parent.rootId ?? parent.id;
  }

  // Build the transaction. When this is a regenerate against a v1 that has no
  // rootId yet, backfill the parent's rootId so the whole chain is fetchable
  // with a single `WHERE rootId = root.id` query.
  const ops = [
    prisma.summary.create({ data }),
    prisma.usageLog.create({
      data: {
        userId: req.user?.id ?? null,
        guestSid: req.user ? null : req.sessionID,
        action: 'summary.create',
        sourceType: input.sourceType,
      },
    }),
  ];
  if (parent && !parent.rootId) {
    ops.push(
      prisma.summary.update({ where: { id: parent.id }, data: { rootId: parent.id } }),
    );
  }
  const [summary] = await prisma.$transaction(ops);

  if (req.user) {
    await prisma.notification
      .create({
        data: {
          userId: req.user.id,
          type: 'summary.completed',
          title: 'Summary ready',
          body: title,
          data: { summaryId: summary.id },
        },
      })
      .catch(() => {});
  }

  writeAudit({
    actorId: req.user?.id ?? null,
    action: 'summary.create',
    target: summary.id,
    metadata: { sourceType: input.sourceType, summaryType: input.summaryType },
    req,
  });

  return summary;
}

export async function regenerate({ id, options, req }) {
  const existing = await getOwned(id, req);
  if (!existing.inputText && existing.sourceType !== 'IMAGE') {
    throw ApiError.badRequest('Original input is no longer available for regeneration');
  }
  if (existing.sourceType === 'IMAGE') {
    throw ApiError.badRequest('Image summaries cannot be regenerated without the original image');
  }
  const input = {
    sourceType: 'TEXT',
    text: existing.inputText,
    title: existing.title,
    summaryType: options.summaryType ?? existing.summaryType,
    length: options.length ?? existing.length,
    tone: options.tone ?? existing.tone,
    language: options.language ?? existing.language,
  };
  return createSummary({ input, file: null, req, parent: existing });
}

export async function listSummaries({ q, type, sourceType, from, to, page, limit, req }) {
  const where = buildOwnerWhere(req);
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { output: { contains: q, mode: 'insensitive' } }];
  if (type) where.summaryType = type;
  if (sourceType) where.sourceType = sourceType;
  if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) };

  const [total, rows] = await Promise.all([
    prisma.summary.count({ where }),
    prisma.summary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: req.user
        ? { bookmarks: { where: { userId: req.user.id }, select: { id: true } } }
        : undefined,
    }),
  ]);
  return {
    items: rows.map((r) => serialize(r, { includeOutput: false })),
    pagination: buildPaginationMeta({ total, page, limit }),
  };
}

export async function getSummary({ id, req }) {
  const summary = await getOwned(id, req, true);
  // Fetch the version chain (root + descendants). For a v1 that's never been
  // regenerated, rootId is still null — that's fine, the chain is just [self].
  const baseRoot = summary.rootId ?? summary.id;
  const versionRows = await prisma.summary.findMany({
    where: {
      OR: [{ id: baseRoot }, { rootId: baseRoot }],
      // Same owner — getOwned already authorized this user; chain inherits that.
      ...(summary.userId ? { userId: summary.userId } : { guestSid: summary.guestSid }),
    },
    orderBy: { version: 'asc' },
    select: {
      id: true,
      version: true,
      summaryType: true,
      length: true,
      tone: true,
      language: true,
      createdAt: true,
    },
  });
  return serialize(summary, { includeOutput: true, versions: versionRows });
}

export async function renameSummary({ id, title, req }) {
  await getOwned(id, req);
  const updated = await prisma.summary.update({ where: { id }, data: { title } });
  writeAudit({ actorId: req.user?.id ?? null, action: 'summary.rename', target: id, req });
  return serialize(updated, { includeOutput: true });
}

export async function deleteSummary({ id, req }) {
  await getOwned(id, req);
  await prisma.summary.delete({ where: { id } });
  writeAudit({ actorId: req.user?.id ?? null, action: 'summary.delete', target: id, req });
}

export async function toggleBookmark({ id, req }) {
  if (!req.user) throw ApiError.unauthenticated();
  const summary = await prisma.summary.findUnique({ where: { id } });
  if (!summary) throw ApiError.notFound('Summary not found');
  // Authorization: must be owner OR admin
  if (summary.userId !== req.user.id && req.user.role.name !== ROLES.ADMIN) {
    throw ApiError.forbidden();
  }
  const existing = await prisma.bookmark.findUnique({
    where: { userId_summaryId: { userId: req.user.id, summaryId: id } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    writeAudit({ actorId: req.user.id, action: 'bookmark.remove', target: id, req });
    return { bookmarked: false };
  }
  await prisma.bookmark.create({ data: { userId: req.user.id, summaryId: id } });
  writeAudit({ actorId: req.user.id, action: 'bookmark.add', target: id, req });
  return { bookmarked: true };
}

function buildOwnerWhere(req) {
  if (req.user) return { userId: req.user.id };
  return { guestSid: req.sessionID };
}

async function getOwned(id, req, fullInclude = false) {
  const summary = await prisma.summary.findUnique({
    where: { id },
    ...(fullInclude && req.user
      ? { include: { bookmarks: { where: { userId: req.user.id }, select: { id: true } } } }
      : {}),
  });
  if (!summary) throw ApiError.notFound('Summary not found');
  const isOwner = req.user
    ? summary.userId === req.user.id
    : summary.guestSid && summary.guestSid === req.sessionID;
  const isAdmin = req.user?.role?.name === ROLES.ADMIN;
  if (!isOwner && !isAdmin) throw ApiError.forbidden();
  return summary;
}

export { getOwned };

function serialize(s, { includeOutput, versions }) {
  return {
    id: s.id,
    title: s.title,
    sourceType: s.sourceType,
    sourceMeta: s.sourceMeta,
    summaryType: s.summaryType,
    length: s.length,
    tone: s.tone,
    language: s.language,
    model: s.model,
    status: s.status,
    parentId: s.parentId ?? null,
    rootId: s.rootId ?? null,
    version: s.version ?? 1,
    bookmarked: Array.isArray(s.bookmarks) ? s.bookmarks.length > 0 : undefined,
    ...(includeOutput ? { output: s.output, inputPreview: s.inputText?.slice(0, 1000) } : {}),
    ...(versions ? { versions } : {}),
    createdAt: s.createdAt,
  };
}

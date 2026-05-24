import axios from 'axios';
import * as cheerio from 'cheerio';
import { SUMMARY_LIMITS } from '../../../config/constants.js';
import { ApiError } from '../../../utils/ApiError.js';

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const MAX_BYTES = 5 * 1024 * 1024;

function assertSafeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw ApiError.badRequest('Invalid URL');
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw ApiError.badRequest('Only http(s) URLs are supported');
  }
  if (
    BLOCKED_HOSTS.includes(u.hostname) ||
    /^10\./.test(u.hostname) ||
    /^192\.168\./.test(u.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname) ||
    /^169\.254\./.test(u.hostname)
  ) {
    throw ApiError.badRequest('Refusing to fetch private/internal URL');
  }
  return u.toString();
}

export async function extractFromUrl({ url }) {
  const safe = assertSafeUrl(url);
  let res;
  try {
    res = await axios.get(safe, {
      timeout: 15_000,
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,
      responseType: 'text',
      headers: {
        'User-Agent': 'AI-Summarizer/1.0 (+https://example.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      validateStatus: (s) => s >= 200 && s < 400,
    });
  } catch (e) {
    throw ApiError.badRequest(`Failed to fetch URL: ${e.message}`);
  }

  const $ = cheerio.load(res.data);
  $('script, style, noscript, iframe, svg, nav, footer, header, aside').remove();
  const title = $('title').first().text().trim() || safe;
  const main = $('article').text() || $('main').text() || $('body').text();
  const clean = main.replace(/\s+/g, ' ').trim();
  if (!clean) throw ApiError.badRequest('No readable content at URL');

  return {
    text: clean.slice(0, SUMMARY_LIMITS.EXTRACT_MAX_CHARS),
    meta: { url: safe, title, chars: clean.length },
  };
}

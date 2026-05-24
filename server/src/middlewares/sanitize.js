import sanitizeHtml from 'sanitize-html';

const STRIP = { allowedTags: [], allowedAttributes: {} };

function clean(value) {
  if (typeof value === 'string') return sanitizeHtml(value, STRIP);
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = clean(value[k]);
    return out;
  }
  return value;
}

/**
 * Strip HTML from string fields in body/query/params to defang stored-XSS.
 * NOTE: applied early so downstream validators see cleaned input.
 * Long-form fields that legitimately allow markup (none in this app) must opt out.
 */
export function sanitize(req, _res, next) {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
}

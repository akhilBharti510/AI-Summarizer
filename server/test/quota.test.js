/**
 * Regression: deleting a summary must NOT refund quota.
 *
 * Quota is measured from the append-only UsageLog. The Summary table is
 * "stored history" — orthogonal to consumption.
 *
 * Prereqs (same as smoke.test.js):
 *   • Server running locally with DATABASE_URL pointing at a scratch DB.
 *   • `npm run db:seed` executed against that DB.
 *   • GEMINI_API_KEY configured (this test creates one real summary).
 *
 * Run:    npm test
 * Env:    API_URL=http://localhost:4000/api/v1  (default)
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:4000/api/v1';

let csrfToken = null;
const cookieJar = new Map();

function serializeCookies() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeCookies(setCookieHeader) {
  if (!setCookieHeader) return;
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader.split(/, (?=[A-Za-z]+=)/);
  for (const c of list) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) cookieJar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function request(method, path, { body, headers = {} } = {}) {
  const isJson = body && typeof body === 'object';
  const finalHeaders = { ...headers, Cookie: serializeCookies() };
  if (isJson) finalHeaders['Content-Type'] = 'application/json';
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    finalHeaders['X-CSRF-Token'] = csrfToken;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body: isJson ? JSON.stringify(body) : body,
  });
  storeCookies(res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.get('set-cookie'));
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, body: json };
}

const TEST_EMAIL = `quota+${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123';

before(async () => {
  const probe = await fetch(`${API.replace('/api/v1', '')}/healthz`).catch(() => null);
  assert.ok(probe && probe.ok, 'Server must be running at ' + API);

  const csrf = await request('GET', '/auth/csrf');
  csrfToken = csrf.body?.data?.csrfToken;
  assert.ok(csrfToken, 'csrfToken returned');

  const reg = await request('POST', '/auth/register', {
    body: { name: 'Quota', email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  assert.equal(reg.status, 201, JSON.stringify(reg.body));
});

test('delete does NOT refund quota — usage stays after summary is removed', async (t) => {
  // The server (not this test process) needs Gemini configured. Default: run.
  // Set SKIP_QUOTA_TEST=1 to skip in environments without the live AI provider.
  if (process.env.SKIP_QUOTA_TEST) {
    t.skip('SKIP_QUOTA_TEST set');
    return;
  }

  const before = await request('GET', '/dashboard/me');
  assert.equal(before.status, 200);
  const usedBefore = before.body?.data?.quota?.used;
  assert.equal(typeof usedBefore, 'number');

  const create = await request('POST', '/summaries', {
    body: {
      sourceType: 'TEXT',
      text: 'The mitochondrion is the powerhouse of the cell. It generates most of the cell\'s supply of ATP, used as a source of chemical energy.',
      summaryType: 'QUICK',
      length: 'SHORT',
      tone: 'SIMPLE',
      language: 'en',
    },
  });
  assert.equal(create.status, 201, JSON.stringify(create.body));
  const summaryId = create.body?.data?.summary?.id;
  assert.ok(summaryId, 'summary id returned');

  const afterCreate = await request('GET', '/dashboard/me');
  assert.equal(afterCreate.status, 200);
  const usedAfterCreate = afterCreate.body?.data?.quota?.used;
  assert.equal(usedAfterCreate, usedBefore + 1, 'quota incremented by 1 after create');

  const del = await request('DELETE', `/summaries/${summaryId}`);
  assert.equal(del.status, 204, JSON.stringify(del.body));

  const afterDelete = await request('GET', '/dashboard/me');
  assert.equal(afterDelete.status, 200);
  const usedAfterDelete = afterDelete.body?.data?.quota?.used;
  assert.equal(
    usedAfterDelete,
    usedAfterCreate,
    `quota MUST persist after delete — was ${usedAfterCreate}, now ${usedAfterDelete}`,
  );

  // And totals.summaries (stored count) SHOULD have decremented — those are orthogonal.
  const totalsAfterDelete = afterDelete.body?.data?.totals?.summaries;
  const totalsAfterCreate = afterCreate.body?.data?.totals?.summaries;
  assert.equal(
    totalsAfterDelete,
    totalsAfterCreate - 1,
    'stored summary count should drop by 1 after delete (orthogonal to quota)',
  );
});

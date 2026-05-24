/**
 * End-to-end smoke tests using Node's built-in test runner + fetch.
 *
 * Prereqs:
 *   • The server must be running locally with TEST DATABASE_URL pointing at a
 *     scratch Postgres database (the test will create + clean up users).
 *   • `npm run db:seed` has been executed against that database.
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

async function request(method, path, { body, headers = {}, raw = false } = {}) {
  const isJson = body && typeof body === 'object' && !(body instanceof FormData);
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
  return raw ? { res, text } : { status: res.status, body: json };
}

const TEST_EMAIL = `smoke+${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123';

before(async () => {
  const probe = await fetch(`${API.replace('/api/v1', '')}/healthz`).catch(() => null);
  assert.ok(probe && probe.ok, 'Server must be running at ' + API);
});

test('health & readiness', async () => {
  const h = await fetch(`${API.replace('/api/v1', '')}/healthz`);
  assert.equal(h.status, 200);
  const r = await fetch(`${API.replace('/api/v1', '')}/readyz`);
  assert.equal(r.status, 200);
});

test('CSRF token can be fetched', async () => {
  const r = await request('GET', '/auth/csrf');
  assert.equal(r.status, 200);
  csrfToken = r.body?.data?.csrfToken;
  assert.ok(csrfToken, 'csrfToken returned');
});

test('register issues access + refresh cookies', async () => {
  const r = await request('POST', '/auth/register', {
    body: { name: 'Smoke', email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body?.data?.user?.email, TEST_EMAIL);
  assert.ok(cookieJar.get('at'), 'access cookie set');
  assert.ok(cookieJar.get('rt'), 'refresh cookie set');
});

test('/auth/me returns the new user with role', async () => {
  const r = await request('GET', '/auth/me');
  assert.equal(r.status, 200);
  assert.equal(r.body?.data?.user?.role?.name, 'User');
});

test('login fails with wrong password', async () => {
  const r = await request('POST', '/auth/login', {
    body: { email: TEST_EMAIL, password: 'WrongPass1' },
  });
  assert.equal(r.status, 401);
  assert.equal(r.body?.error?.code, 'UNAUTHENTICATED');
});

test('refresh rotates the cookie', async () => {
  const oldRt = cookieJar.get('rt');
  const r = await request('POST', '/auth/refresh');
  assert.equal(r.status, 200);
  assert.notEqual(cookieJar.get('rt'), oldRt, 'refresh token rotated');
});

test('user cannot access admin endpoints', async () => {
  const r = await request('GET', '/users');
  assert.equal(r.status, 403);
});

test('user cannot list audit logs', async () => {
  const r = await request('GET', '/audit-logs');
  assert.equal(r.status, 403);
});

test('dashboard returns quota + totals', async () => {
  const r = await request('GET', '/dashboard/me');
  assert.equal(r.status, 200);
  assert.ok(typeof r.body?.data?.quota?.limit === 'number');
});

test('notifications endpoint returns list', async () => {
  const r = await request('GET', '/notifications');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body?.data));
});

test('logout clears cookies', async () => {
  const r = await request('POST', '/auth/logout');
  assert.equal(r.status, 200);
  // server clears cookies; we can verify by hitting /auth/me
  const me = await request('GET', '/auth/me');
  assert.equal(me.status, 401);
});

test('admin role exists in seed', async () => {
  // login as seeded admin if creds are available via env
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('Skipping admin smoke (ADMIN_EMAIL/PASSWORD not provided)');
    return;
  }
  const r = await request('POST', '/auth/login', { body: { email, password } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body?.data?.user?.role?.name, 'Admin');

  const rolesList = await request('GET', '/roles');
  assert.equal(rolesList.status, 200);
  assert.ok(rolesList.body?.data?.length >= 4, 'seeded roles present');

  const perms = await request('GET', '/roles/permissions/catalog');
  assert.equal(perms.status, 200);
  assert.ok((perms.body?.data?.permissions || []).length > 0);
});

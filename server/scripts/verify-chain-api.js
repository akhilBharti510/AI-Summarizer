// Insert a synthetic 3-version chain via prisma, log in as the owner over HTTP,
// hit GET /summaries/:id, and assert `versions[]` is returned correctly.
import 'dotenv/config';
import { prisma } from '../src/config/db.js';
import bcrypt from 'bcrypt';

const API = process.env.API_URL || 'http://localhost:4000/api/v1';

const cookieJar = new Map();
function serializeCookies() { return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; '); }
function storeCookies(setCookie) {
  if (!setCookie) return;
  const list = Array.isArray(setCookie) ? setCookie : setCookie.split(/, (?=[A-Za-z]+=)/);
  for (const c of list) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) cookieJar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}
let csrf = null;
async function req(method, path, body) {
  const headers = { Cookie: serializeCookies() };
  if (body) headers['Content-Type'] = 'application/json';
  if (csrf && ['POST','PATCH','PUT','DELETE'].includes(method)) headers['X-CSRF-Token'] = csrf;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  storeCookies(r.headers.getSetCookie?.() || r.headers.get('set-cookie'));
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, body: json };
}

async function main() {
  // 1) Make a user owner directly in DB (skip register, which would otherwise hit Gemini-unrelated DB)
  const role = await prisma.role.findUnique({ where: { name: 'User' } });
  if (!role) throw new Error('User role missing');
  const email = `chain+${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash('TestPass123', 12);
  const user = await prisma.user.create({
    data: { email, name: 'Chain', passwordHash, roleId: role.id, emailVerified: false },
  });
  console.log('user', user.id);

  // 2) Insert synthetic chain v1→v2→v3 owned by this user
  const common = {
    userId: user.id, title: 'Chain test', sourceType: 'TEXT', sourceMeta: {},
    inputText: 'Source body for chain test.', summaryType: 'QUICK', length: 'SHORT',
    tone: 'SIMPLE', language: 'en', model: 'gemini-synth', status: 'COMPLETED',
  };
  const v1 = await prisma.summary.create({ data: { ...common, output: 'v1 output content X' } });
  const v2 = await prisma.summary.create({
    data: { ...common, output: 'v2 output content Y', parentId: v1.id, version: 2, rootId: v1.id },
  });
  const v3 = await prisma.summary.create({
    data: { ...common, output: 'v3 output content Z', parentId: v2.id, version: 3, rootId: v1.id },
  });
  await prisma.summary.update({ where: { id: v1.id }, data: { rootId: v1.id } });
  console.log('inserted chain', { v1: v1.id, v2: v2.id, v3: v3.id });

  // 3) Login via HTTP so we have auth cookies
  const csrfRes = await req('GET', '/auth/csrf');
  csrf = csrfRes.body?.data?.csrfToken;
  const login = await req('POST', '/auth/login', { email, password: 'TestPass123' });
  if (login.status !== 200) throw new Error('login failed: ' + JSON.stringify(login.body));
  console.log('logged in');

  // 4) Hit GET /summaries/:id for each version
  for (const [label, id] of [['v1', v1.id], ['v2', v2.id], ['v3', v3.id]]) {
    const r = await req('GET', `/summaries/${id}`);
    if (r.status !== 200) throw new Error(`${label} GET status ${r.status}: ${JSON.stringify(r.body)}`);
    const s = r.body.data.summary;
    const chain = s.versions.map((v) => `v${v.version}:${v.id.slice(-6)}`).join(' → ');
    console.log(`GET ${label} id=${id.slice(-6)} version=${s.version} parentId=${s.parentId?.slice(-6) || 'null'} rootId=${s.rootId?.slice(-6) || 'null'} chain=[${chain}] output="${s.output}"`);
    if (s.versions.length !== 3) throw new Error(`${label} expected 3 versions, got ${s.versions.length}`);
  }

  // 5) Confirm content differs between versions (sanity for "regenerated entry shows same content" report)
  const outs = [v1.output, v2.output, v3.output];
  if (new Set(outs).size !== 3) throw new Error('versions had duplicate outputs');
  console.log('all 3 outputs are distinct');

  // 6) Confirm delete v2 does NOT break chain (parentId of v3 becomes null per SetNull)
  await req('GET', '/auth/csrf'); // refresh CSRF on jar
  csrf = (await req('GET', '/auth/csrf')).body?.data?.csrfToken;
  const del = await req('DELETE', `/summaries/${v2.id}`);
  if (del.status !== 204) throw new Error('delete v2 failed: ' + JSON.stringify(del.body));
  const v3After = await req('GET', `/summaries/${v3.id}`);
  console.log('after deleting v2, v3.parentId=', v3After.body.data.summary.parentId, '(expected null) chain length=', v3After.body.data.summary.versions.length);

  // Cleanup
  await prisma.summary.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('cleanup done');
  process.exit(0);
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });

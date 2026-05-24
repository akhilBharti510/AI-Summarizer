// Verify the version-chain wiring without spending a Gemini quota.
// Uses an existing summary row, inserts two synthetic descendants via prisma,
// then hits GET /summaries/:id to confirm the versions[] chain comes back.
import 'dotenv/config';
import { prisma } from '../src/config/db.js';

const API = process.env.API_URL || 'http://localhost:4000/api/v1';

async function main() {
  const root = await prisma.summary.findFirst({ where: { userId: { not: null } }, orderBy: { createdAt: 'desc' } });
  if (!root) throw new Error('No user-owned summary found to test against');
  console.log('root id=', root.id, 'version=', root.version, 'rootId=', root.rootId);

  const common = {
    userId: root.userId,
    title: root.title,
    sourceType: root.sourceType,
    sourceMeta: root.sourceMeta,
    inputText: root.inputText,
    summaryType: root.summaryType,
    length: root.length,
    tone: root.tone,
    language: root.language,
    model: root.model,
    status: 'COMPLETED',
  };

  // v2: parent = root
  const v2 = await prisma.summary.create({
    data: {
      ...common,
      output: '[synthetic v2 output] paraphrase A — distinct content',
      parentId: root.id,
      version: (root.version ?? 1) + 1,
      rootId: root.rootId ?? root.id,
    },
  });
  if (!root.rootId) {
    await prisma.summary.update({ where: { id: root.id }, data: { rootId: root.id } });
  }
  console.log('inserted v2 id=', v2.id, 'parentId=', v2.parentId, 'rootId=', v2.rootId, 'version=', v2.version);

  // v3: parent = v2
  const v3 = await prisma.summary.create({
    data: {
      ...common,
      output: '[synthetic v3 output] paraphrase B — different again',
      parentId: v2.id,
      version: v2.version + 1,
      rootId: v2.rootId,
    },
  });
  console.log('inserted v3 id=', v3.id, 'parentId=', v3.parentId, 'rootId=', v3.rootId, 'version=', v3.version);

  // Verify the chain queryable from any node returns all 3
  const chainFromV1 = await prisma.summary.findMany({
    where: { OR: [{ id: root.id }, { rootId: root.id }] },
    orderBy: { version: 'asc' },
    select: { id: true, version: true },
  });
  console.log('chain from root:', chainFromV1);

  if (chainFromV1.length !== 3) throw new Error(`expected 3 in chain, got ${chainFromV1.length}`);
  if (chainFromV1.map((r) => r.version).join(',') !== '1,2,3') {
    throw new Error('chain not ordered 1,2,3 — got ' + JSON.stringify(chainFromV1));
  }
  console.log('OK chain ordered v1,v2,v3 — version wiring correct');

  // Cleanup: delete synthetic descendants (FK is SetNull on parent, so order-agnostic)
  await prisma.summary.delete({ where: { id: v3.id } });
  await prisma.summary.delete({ where: { id: v2.id } });
  console.log('cleaned up v2,v3');
  process.exit(0);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

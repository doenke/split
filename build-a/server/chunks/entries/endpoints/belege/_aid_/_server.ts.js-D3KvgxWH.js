import { C as error } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq } from 'drizzle-orm';
import { d as db, b as expenses, a as attachments } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, f as canEditExpense } from '../../../../chunks/groups.js-By2r4Rg8.js';
import { d as deleteUpload, r as readUpload } from '../../../../chunks/uploads.js-Cm1gopuF.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../../chunks/split.js-Diu3SqNm.js';
import 'node:fs/promises';
import 'node:path';
import '../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

async function load(aid) {
  const [a] = await db.select().from(attachments).where(eq(attachments.id, aid));
  if (!a) error(404, "Beleg nicht gefunden.");
  return a;
}
const GET = async ({ params, locals }) => {
  const a = await load(params.aid);
  await requireGroup(a.groupId, locals.user);
  const body = await readUpload(a.fileName).catch(() => error(404, "Datei fehlt."));
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": a.mime,
      "cache-control": "private, max-age=31536000, immutable",
      "content-disposition": `inline; filename="${(a.originalName ?? a.fileName).replace(/"/g, "")}"`,
      "x-content-type-options": "nosniff"
    }
  });
};
const DELETE = async ({ params, locals }) => {
  const a = await load(params.aid);
  const g = await requireGroup(a.groupId, locals.user);
  if (a.uploadedBy !== g.user.id) {
    const [e] = a.expenseId ? await db.select().from(expenses).where(and(eq(expenses.id, a.expenseId), eq(expenses.groupId, a.groupId))) : [];
    if (!e || !canEditExpense(g, g.user.id, e)) error(403);
  }
  await deleteUpload(a.id);
  return new Response(null, { status: 204 });
};

export { DELETE, GET };
//# sourceMappingURL=_server.ts.js-D3KvgxWH.js.map

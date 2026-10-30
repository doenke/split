import { C as error, j as json } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { eq } from 'drizzle-orm';
import { d as db, a as attachments } from '../../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, e as loadCategories } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { r as receiptRecognitionEnabled, a as recognizeReceipt } from '../../../../../chunks/receipts.js-DUrhzTGM.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../../../chunks/split.js-Diu3SqNm.js';
import '@anthropic-ai/sdk';
import '@anthropic-ai/sdk/helpers/beta/json-schema';
import '../../../../../chunks/currency.js-B45uFFG3.js';
import '../../../../../chunks/uploads.js-Cm1gopuF.js';
import 'node:fs/promises';
import 'node:path';
import '../../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const POST = async ({ params, locals }) => {
  const [a] = await db.select().from(attachments).where(eq(attachments.id, params.aid));
  if (!a) error(404, "Beleg nicht gefunden.");
  const g = await requireGroup(a.groupId, locals.user);
  if (!receiptRecognitionEnabled()) return json({ message: "Die Bon-Erkennung ist nicht eingerichtet." }, { status: 501 });
  try {
    const categories = (await loadCategories(a.groupId)).filter((c) => !c.hidden);
    return json(await recognizeReceipt(a.id, categories, g.group.baseCurrency));
  } catch (e) {
    return json({ message: e.message }, { status: 503 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts.js-DdYX4rIU.js.map

import { C as error, j as json } from '../../../../../../chunks/utils.js-BjQHIhHk.js';
import { eq } from 'drizzle-orm';
import { d as db, b as expenses, j as expensePayers, a as attachments } from '../../../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, e as loadCategories } from '../../../../../../chunks/groups.js-By2r4Rg8.js';
import { n as newId } from '../../../../../../chunks/ids.js-2U6-pnrm.js';
import { a as audit } from '../../../../../../chunks/audit.js-DeGbxmfN.js';
import { s as storeUpload, U as UploadError } from '../../../../../../chunks/uploads.js-Cm1gopuF.js';
import { r as receiptRecognitionEnabled, a as recognizeReceipt } from '../../../../../../chunks/receipts.js-DUrhzTGM.js';
import { t as today } from '../../../../../../chunks/format.js-Cn5c-OM3.js';
import '../../../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../../../../chunks/split.js-Diu3SqNm.js';
import 'node:crypto';
import 'node:fs/promises';
import 'node:path';
import '@anthropic-ai/sdk';
import '@anthropic-ai/sdk/helpers/beta/json-schema';
import '../../../../../../chunks/currency.js-B45uFFG3.js';

const POST = async ({ params, locals, request }) => {
  const g = await requireGroup(params.id, locals.user);
  if (g.group.status === "settled") error(400, "Die Endabrechnung steht bereits.");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) error(400, "Kein Foto.");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(form.get("date"))) ? String(form.get("date")) : today();
  let attachmentId;
  try {
    attachmentId = await storeUpload(file, params.id, g.user.id);
  } catch (e) {
    if (e instanceof UploadError) return json({ message: e.message }, { status: 400 });
    throw e;
  }
  const id = newId();
  await db.transaction(async (tx) => {
    await tx.insert(expenses).values({
      id,
      groupId: params.id,
      status: "draft",
      title: "Bon",
      date,
      amount: 0,
      currency: g.group.baseCurrency,
      baseAmount: 0,
      createdBy: g.user.id
    });
    await tx.insert(expensePayers).values({ expenseId: id, personId: g.user.id, amount: 0 });
    await tx.update(attachments).set({ expenseId: id }).where(eq(attachments.id, attachmentId));
    await audit(tx, { groupId: params.id, personId: g.user.id, action: "expense.draft", entityId: id });
  });
  if (receiptRecognitionEnabled()) {
    void loadCategories(params.id).then((cats) => recognizeReceipt(attachmentId, cats.filter((c) => !c.hidden), g.group.baseCurrency)).catch((e) => console.warn("Bon-Erkennung im Hintergrund fehlgeschlagen:", e.message));
  }
  return json({ id });
};

export { POST };
//# sourceMappingURL=_server.ts.js-Dj-iAhAB.js.map

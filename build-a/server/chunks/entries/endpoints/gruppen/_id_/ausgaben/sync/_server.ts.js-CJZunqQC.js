import { j as json } from '../../../../../../chunks/utils.js-BjQHIhHk.js';
import { f as formatAmount } from '../../../../../../chunks/currency.js-B45uFFG3.js';
import { i as isClosed } from '../../../../../../chunks/closing.js-BokfKRie.js';
import { p as prepareExpense, s as saveExpense, I as InputError } from '../../../../../../chunks/expenses.js-CZuVyTN3.js';
import { r as requireGroup, l as loadMembers, b as loadProfiles } from '../../../../../../chunks/groups.js-By2r4Rg8.js';
import { g as groupRecipients, n as notify } from '../../../../../../chunks/push.js-x-TdAYqk.js';
import '../../../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm';
import '../../../../../../chunks/split.js-Diu3SqNm.js';
import '../../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../../../../chunks/audit.js-DeGbxmfN.js';
import '../../../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';
import '../../../../../../chunks/rates.js-C_LWDk2B.js';
import 'web-push';
import '../../../../../../chunks/config.js-oO6Fsv50.js';

const POST = async ({ params, locals, request }) => {
  const g = await requireGroup(params.id, locals.user);
  const payload = await request.json();
  if (!payload?.clientId) return json({ message: "clientId fehlt" }, { status: 400 });
  const [members, profiles] = await Promise.all([loadMembers(params.id), loadProfiles(params.id)]);
  try {
    const prepared = await prepareExpense(payload, g.group, members, profiles);
    if (isClosed(g.group, prepared.row.date)) {
      return json({ message: `Die Abrechnung ist bis ${g.group.closedUntil} abgeschlossen.` }, { status: 409 });
    }
    const id = await saveExpense(params.id, g.user.id, prepared);
    void groupRecipients(params.id, g.user.id).then(
      (ids) => notify(ids, {
        title: `${g.group.emoji} ${g.group.name}`,
        body: `${g.user.name}: ${prepared.row.title} – ${formatAmount(prepared.row.amount, prepared.row.currency)}`,
        url: `/gruppen/${params.id}/ausgaben/${id}`
      })
    );
    return json({ id });
  } catch (e) {
    if (e instanceof InputError) return json({ message: e.message }, { status: 422 });
    throw e;
  }
};

export { POST };
//# sourceMappingURL=_server.ts.js-CJZunqQC.js.map

import { O as fail, N as redirect } from '../../../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq, isNull } from 'drizzle-orm';
import { d as db, a as attachments } from '../../../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, l as loadMembers, b as loadProfiles } from '../../../../../../chunks/groups.js-By2r4Rg8.js';
import { p as prepareExpense, I as InputError, s as saveExpense, a as announceExpense } from '../../../../../../chunks/expenses.js-CZuVyTN3.js';
import { c as currencyOptions } from '../../../../../../chunks/currencies.js-C6qrEbVA.js';
import { i as isClosed } from '../../../../../../chunks/closing.js-BokfKRie.js';

const load = async ({ parent, url }) => {
  const data = await parent();
  if (data.group.status === "settled") redirect(303, `/gruppen/${data.group.id}`);
  const used = [...new Set(data.expenses.map((e) => e.currency))];
  const beleg = url.searchParams.get("beleg");
  const shared = beleg ? await db.select({ id: attachments.id, mime: attachments.mime, ocr: attachments.ocrResult }).from(attachments).where(
    and(
      eq(attachments.id, beleg),
      eq(attachments.groupId, data.group.id),
      eq(attachments.uploadedBy, data.user.id),
      isNull(attachments.expenseId)
    )
  ) : [];
  return { currencies: await currencyOptions(data.group.baseCurrency, used), lastCurrency: data.expenses[0]?.currency, shared };
};
const actions = {
  save: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const [members, profiles] = await Promise.all([loadMembers(params.id), loadProfiles(params.id)]);
    let prepared;
    try {
      prepared = await prepareExpense(JSON.parse(String((await request.formData()).get("payload"))), g.group, members, profiles);
    } catch (e) {
      if (e instanceof InputError || e instanceof SyntaxError) return fail(400, { message: e.message });
      throw e;
    }
    if (isClosed(g.group, prepared.row.date)) {
      return fail(400, { message: `Die Abrechnung ist bis ${g.group.closedUntil} abgeschlossen. Wähle ein späteres Datum oder öffne die Abrechnung wieder.` });
    }
    const expenseId = await saveExpense(params.id, g.user.id, prepared);
    announceExpense(g.group, g.user, prepared.row, expenseId);
    redirect(303, `/gruppen/${params.id}`);
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-wlRPXbRc.js.map

import { C as error, O as fail } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq } from 'drizzle-orm';
import { d as db, b as expenses } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { p as parseAmount, r as rateFromCharged } from '../../../../chunks/currency.js-B45uFFG3.js';
import { a as audit } from '../../../../chunks/audit.js-DeGbxmfN.js';
import { r as requireGroup, f as canEditExpense, a as loadExpenses } from '../../../../chunks/groups.js-By2r4Rg8.js';
import { m as markDone, f as finalizeIfComplete } from '../../../../chunks/completion.js-DPOSbHRR.js';

async function setDone(params, locals, request, done) {
  const g = await requireGroup(params.id, locals.user);
  if (g.group.status === "settled") {
    return fail(400, { message: "Die Endabrechnung steht bereits. Ein Gruppenadmin kann sie in den Einstellungen wieder öffnen." });
  }
  const f = await request.formData();
  const kind = String(f.get("scope"));
  let scope;
  if (kind === "kasse") scope = { type: "kasse" };
  else if (kind === "all" || kind === "person") {
    if (!g.isAdmin) error(403, "Nur Gruppenadmins dürfen andere abschließen.");
    scope = kind === "all" ? { type: "all" } : { type: "person", personId: String(f.get("personId")) };
  } else scope = { type: "self" };
  if (done) {
    const drafts = await loadExpenses(params.id, "draft");
    const mine = drafts.filter((d) => d.createdBy === g.user.id);
    if (mine.length && scope.type !== "all") {
      return fail(400, { message: `Du hast noch ${mine.length} vorbereitete Ausgabe(n). Bitte erst vervollständigen oder löschen.` });
    }
  }
  await markDone(params.id, g.user, g.membership.kasseId, scope, done);
  await audit(db, {
    groupId: params.id,
    personId: g.user.id,
    action: done ? "member.done" : "member.undone",
    entityId: scope.type === "person" ? scope.personId : void 0,
    data: { scope: scope.type }
  });
  const final = done ? await finalizeIfComplete(params.id, g.user.id) : false;
  return { final };
}
const actions = {
  done: ({ params, locals, request }) => setDone(params, locals, request, true),
  undone: ({ params, locals, request }) => setDone(params, locals, request, false),
  /** Enters the amount actually charged in base currency for a foreign-currency expense. */
  charged: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const f = await request.formData();
    const id = String(f.get("id"));
    const [e] = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.groupId, params.id)));
    if (!e || e.deletedAt) error(404);
    if (!canEditExpense(g, g.user.id, e)) error(403);
    if (e.frozenShares) return fail(400, { message: "Diese Ausgabe gehört zu einer abgeschlossenen Abrechnung." });
    const charged = parseAmount(String(f.get("charged") ?? ""), g.group.baseCurrency);
    if (!charged || charged <= 0) return fail(400, { message: "Bitte den abgebuchten Betrag angeben." });
    await db.update(expenses).set({
      baseAmount: charged,
      rate: rateFromCharged(e.amount, e.currency, charged, g.group.baseCurrency),
      rateSource: "charged",
      rateProvisional: false,
      awaitingCharge: false,
      // the private part keeps its share of the total
      privateAmount: e.baseAmount ? Math.round(e.privateAmount * charged / e.baseAmount) : 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(expenses.id, id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "expense.update", entityId: id, data: { title: e.title, charged } });
    return { chargedSaved: id };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-h9vcxOn-.js.map

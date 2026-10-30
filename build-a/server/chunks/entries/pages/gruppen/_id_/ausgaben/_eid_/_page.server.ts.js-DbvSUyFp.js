import { C as error, O as fail, N as redirect } from '../../../../../../chunks/utils.js-BjQHIhHk.js';
import { eq, and } from 'drizzle-orm';
import { d as db, b as expenses, l as auditLog } from '../../../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, f as canEditExpense, l as loadMembers, b as loadProfiles, c as toCoreExpense, t as toCoreMember } from '../../../../../../chunks/groups.js-By2r4Rg8.js';
import { p as prepareExpense, I as InputError, s as saveExpense } from '../../../../../../chunks/expenses.js-CZuVyTN3.js';
import { c as currencyOptions } from '../../../../../../chunks/currencies.js-C6qrEbVA.js';
import { i as isClosed } from '../../../../../../chunks/closing.js-BokfKRie.js';
import { g as groupRecipients, n as notify } from '../../../../../../chunks/push.js-x-TdAYqk.js';
import { f as formatAmount } from '../../../../../../chunks/currency.js-B45uFFG3.js';
import { a as audit } from '../../../../../../chunks/audit.js-DeGbxmfN.js';
import { e as effectiveFactor, a as computeShares } from '../../../../../../chunks/split.js-Diu3SqNm.js';

async function requireExpense(groupId, expenseId) {
  const [e] = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)));
  if (!e || e.deletedAt) error(404, "Ausgabe nicht gefunden.");
  return e;
}
const load = async ({ params, parent, locals }) => {
  const data = await parent();
  const expense = data.expenses.find((e) => e.id === params.eid) ?? data.drafts.find((e) => e.id === params.eid);
  const draft = expense?.status === "draft";
  if (!expense) error(404, "Ausgabe nicht gefunden.");
  const g = await requireGroup(params.id, locals.user);
  const privateOriginal = expense.baseAmount === 0 ? 0 : Math.round(expense.privateAmount * expense.amount / expense.baseAmount);
  const initial = {
    type: expense.type,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    date: expense.date,
    payers: expense.payers.map((p) => ({ personId: p.personId, amount: p.amount })),
    categoryId: expense.categoryId,
    // an explicit rule overrides the profile
    profileId: expense.rule && !expense.rule.equalWeights ? null : expense.profileId,
    equalWeights: expense.rule?.equalWeights === true,
    awaitingCharge: expense.awaitingCharge,
    rule: expense.rule ?? { type: "all" },
    privateAmount: privateOriginal,
    rate: {
      source: expense.rateSource === "manual" ? "manual" : expense.rateSource === "charged" ? "charged" : "auto",
      value: expense.rateSource === "manual" ? expense.rate : void 0,
      charged: expense.rateSource === "charged" ? expense.baseAmount : void 0
    },
    period: expense.periodFrom && expense.periodTo && expense.periodUnit ? { from: expense.periodFrom, to: expense.periodTo, unit: expense.periodUnit } : null,
    notes: expense.notes ?? ""
  };
  let shares = {};
  const factors = {};
  const core = toCoreExpense(expense, data.profiles);
  if (core.rule.type !== "individual" && !core.frozenShares) {
    const profile = data.profiles.find((p) => p.id === expense.profileId);
    const where = profile ? `Profil „${profile.name}“` : "dieser Ausgabe";
    for (const m of data.members) {
      const o = core.rule.factorOverrides;
      const tag = m.tags.find((t) => o?.tags?.[t] !== void 0);
      factors[m.personId] = core.rule.equalWeights ? { value: 1, source: "alle gleich gewichtet" } : {
        value: effectiveFactor(toCoreMember(m), o),
        source: o?.persons?.[m.personId] !== void 0 ? `festgelegt in ${where}` : tag ? `Merkmal „${tag}“ in ${where}` : m.factor === 1 ? "Standard" : `Standardfaktor von ${m.name}`
      };
    }
  }
  try {
    shares = Object.fromEntries(computeShares(toCoreExpense(expense, data.profiles), data.members.map(toCoreMember)));
  } catch {
  }
  const history = await db.select({ action: auditLog.action, personId: auditLog.personId, createdAt: auditLog.createdAt }).from(auditLog).where(eq(auditLog.entityId, expense.id)).orderBy(auditLog.createdAt);
  const used = [...new Set(data.expenses.map((e) => e.currency))];
  return {
    expense,
    initial,
    shares,
    factors,
    history,
    canEdit: canEditExpense(g, g.user.id, expense) && !expense.frozenShares,
    frozen: Boolean(expense.frozenShares),
    draft,
    currencies: await currencyOptions(data.group.baseCurrency, used)
  };
};
const actions = {
  save: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const existing = await requireExpense(params.id, params.eid);
    if (!canEditExpense(g, g.user.id, existing)) error(403, "Du darfst diese Ausgabe nicht bearbeiten.");
    if (existing.frozenShares) return fail(400, { message: "Diese Ausgabe gehört zu einer abgeschlossenen Abrechnung." });
    const [members, profiles] = await Promise.all([loadMembers(params.id), loadProfiles(params.id)]);
    let prepared;
    try {
      prepared = await prepareExpense(
        JSON.parse(String((await request.formData()).get("payload"))),
        g.group,
        members,
        profiles,
        existing
      );
    } catch (e) {
      if (e instanceof InputError || e instanceof SyntaxError) return fail(400, { message: e.message });
      throw e;
    }
    if (isClosed(g.group, prepared.row.date)) {
      return fail(400, { message: `Die Abrechnung ist bis ${g.group.closedUntil} abgeschlossen. Wähle ein späteres Datum.` });
    }
    await saveExpense(params.id, g.user.id, prepared, params.eid);
    if (existing.status === "draft") {
      void groupRecipients(params.id, g.user.id).then(
        (ids) => notify(ids, {
          title: `${g.group.emoji} ${g.group.name}`,
          body: `${g.user.name}: ${prepared.row.title} – ${formatAmount(prepared.row.amount, prepared.row.currency)}`,
          url: `/gruppen/${params.id}/ausgaben/${params.eid}`
        })
      );
      redirect(303, `/gruppen/${params.id}`);
    }
    redirect(303, `/gruppen/${params.id}/ausgaben/${params.eid}`);
  },
  delete: async ({ params, locals }) => {
    const g = await requireGroup(params.id, locals.user);
    const existing = await requireExpense(params.id, params.eid);
    if (!canEditExpense(g, g.user.id, existing)) error(403, "Du darfst diese Ausgabe nicht löschen.");
    if (existing.frozenShares) return fail(400, { message: "Diese Ausgabe gehört zu einer abgeschlossenen Abrechnung." });
    await db.update(expenses).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(expenses.id, params.eid));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "expense.delete", entityId: params.eid, data: { title: existing.title } });
    redirect(303, `/gruppen/${params.id}`);
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-DbvSUyFp.js.map

import { eq, and, inArray } from 'drizzle-orm';
import { f as formatAmount } from './currency.js-B45uFFG3.js';
import { t as today } from './format.js-Cn5c-OM3.js';
import { d as db, m as memberships, g as groups } from './index3.js-LeA4cvVT.js';
import { a as audit } from './audit.js-DeGbxmfN.js';
import { c as closeUntil } from './closing.js-BokfKRie.js';
import { d as loadGroupState, a as loadExpenses } from './groups.js-By2r4Rg8.js';
import { c as claimedPersonIds } from './persons.js-DwTcpoqM.js';
import { k as kasseRecipients, n as notify } from './push.js-x-TdAYqk.js';

async function completionState(members, group) {
  const claimed = await claimedPersonIds(members.map((m) => m.personId));
  const required = members.filter((m) => claimed.has(m.personId) || !m.kassePersonal);
  return {
    required: required.map((m) => m.personId),
    done: required.filter((m) => m.doneAt).map((m) => m.personId),
    final: group.status === "settled"
  };
}
async function markDone(groupId, user, kasseId, scope, done) {
  const inGroup = eq(memberships.groupId, groupId);
  const where = scope.type === "kasse" ? and(inGroup, eq(memberships.kasseId, kasseId)) : scope.type === "person" ? and(inGroup, eq(memberships.personId, scope.personId)) : scope.type === "all" ? inGroup : and(inGroup, eq(memberships.personId, user.id));
  await db.update(memberships).set(done ? { doneAt: /* @__PURE__ */ new Date(), doneBy: user.id } : { doneAt: null, doneBy: null }).where(where);
}
async function finalizeIfComplete(groupId, actorId) {
  const state = await loadGroupState(groupId);
  if (state.group.status === "settled") return false;
  const c = await completionState(state.members, state.group);
  if (!c.required.length || c.done.length < c.required.length) return false;
  if ((await loadExpenses(groupId, "draft")).length) return false;
  const lastDate = state.expenses.reduce((max, e) => e.date > max ? e.date : max, today());
  await closeUntil(groupId, lastDate);
  await db.update(groups).set({ status: "settled" }).where(eq(groups.id, groupId));
  await audit(db, { groupId, personId: actorId, action: "group.final" });
  const fresh = await loadGroupState(groupId);
  const names = new Map(fresh.kassen.map((k) => [k.id, k.name]));
  const title = `${fresh.group.emoji} ${fresh.group.name}: Endabrechnung steht`;
  const url = `/gruppen/${groupId}/salden`;
  const cur = fresh.group.baseCurrency;
  for (const kasseId of new Set(fresh.members.map((m) => m.kasseId))) {
    const out = fresh.transfers.filter((t) => t.from === kasseId);
    const inc = fresh.transfers.filter((t) => t.to === kasseId);
    const body = out.length ? out.map((t) => `Bitte ${formatAmount(t.amount, cur)} an ${names.get(t.to)} zahlen.`).join(" ") : inc.length ? `Du bekommst ${inc.map((t) => `${formatAmount(t.amount, cur)} von ${names.get(t.from)}`).join(", ")}.` : "Bei euch ist alles ausgeglichen.";
    void kasseRecipients(groupId, kasseId, null).then((ids) => notify(ids, { title, body, url, tag: `final-${groupId}` }));
  }
  return true;
}
async function resetCompletion(groupId) {
  await db.update(memberships).set({ doneAt: null, doneBy: null }).where(eq(memberships.groupId, groupId));
  await db.update(groups).set({ status: "active" }).where(and(eq(groups.id, groupId), inArray(groups.status, ["settled"])));
}

export { completionState as c, finalizeIfComplete as f, markDone as m, resetCompletion as r };
//# sourceMappingURL=completion.js-DPOSbHRR.js.map

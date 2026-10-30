import { d as db, s as settlements } from './index3.js-LeA4cvVT.js';
import { a as audit } from './audit.js-DeGbxmfN.js';
import { n as newId } from './ids.js-2U6-pnrm.js';
import { l as loadMembers } from './groups.js-By2r4Rg8.js';
import { k as kasseRecipients, n as notify } from './push.js-x-TdAYqk.js';
import { f as formatAmount } from './currency.js-B45uFFG3.js';
import { t as today } from './format.js-Cn5c-OM3.js';

const paymentMethods = ["cash", "transfer", "paypal", "wero", "other"];
class SettlementError extends Error {
}
async function recordSettlement(g, p) {
  const groupId = g.group.id;
  if (!Number.isInteger(p.amount) || p.amount <= 0) throw new SettlementError("Ungültiger Betrag.");
  const kassen = new Set((await loadMembers(groupId)).map((m) => m.kasseId));
  if (!kassen.has(p.from) || !kassen.has(p.to) || p.from === p.to) throw new SettlementError("Ungültige Zahlung.");
  const id = newId();
  const confirmed = g.membership.kasseId === p.to;
  await db.insert(settlements).values({
    id,
    groupId,
    fromKasseId: p.from,
    toKasseId: p.to,
    amount: p.amount,
    method: p.method,
    status: confirmed ? "confirmed" : "pending",
    confirmedAt: confirmed ? /* @__PURE__ */ new Date() : null,
    date: p.date || today(),
    createdBy: g.user.id
  });
  await audit(db, { groupId, personId: g.user.id, action: "settlement.create", entityId: id, data: { from: p.from, to: p.to, amount: p.amount } });
  const money = formatAmount(p.amount, g.group.baseCurrency);
  const url = `/gruppen/${groupId}/salden`;
  const title = `${g.group.emoji} ${g.group.name}`;
  if (confirmed) {
    void kasseRecipients(groupId, p.from, g.user.id).then((ids) => notify(ids, { title, body: `${g.user.name} hat ${money} von dir erhalten. Danke!`, url }));
  } else {
    void kasseRecipients(groupId, p.to, g.user.id).then(
      (ids) => notify(ids, { title, body: `${g.user.name} hat dir ${money} gezahlt – bitte den Eingang bestätigen.`, url })
    );
  }
  return { id, confirmed };
}

export { SettlementError as S, paymentMethods as p, recordSettlement as r };
//# sourceMappingURL=settlements.js-7frSROs8.js.map

import { C as error, O as fail } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq, gt, inArray } from 'drizzle-orm';
import QRCode from 'qrcode';
import { d as db, s as settlements, l as auditLog, u as paymentDetails, p as persons } from '../../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, d as loadGroupState } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { a as audit } from '../../../../../chunks/audit.js-DeGbxmfN.js';
import { f as formatAmount, p as parseAmount } from '../../../../../chunks/currency.js-B45uFFG3.js';
import { e as epcPayload, f as formatIban, p as paypalLink } from '../../../../../chunks/payment.js-CbbaTPu0.js';
import { k as kasseRecipients, n as notify } from '../../../../../chunks/push.js-x-TdAYqk.js';
import { r as recordSettlement, p as paymentMethods, S as SettlementError } from '../../../../../chunks/settlements.js-7frSROs8.js';

const REMINDER_HOURS = 24;
const load = async ({ params, locals }) => {
  const g = await requireGroup(params.id, locals.user);
  const state = await loadGroupState(params.id);
  const mine = state.transfers.filter((t) => t.from === g.membership.kasseId);
  const kassen = new Map(state.kassen.map((k) => [k.id, k]));
  const receivers = [...new Set(mine.map((t) => kassen.get(t.to)?.receiverPersonId ?? kassen.get(t.to)?.personalOf).filter((x) => !!x))];
  const details = receivers.length ? await db.select().from(paymentDetails).where(inArray(paymentDetails.personId, receivers)) : [];
  const names = new Map(
    (receivers.length ? await db.select({ id: persons.id, name: persons.name }).from(persons).where(inArray(persons.id, receivers)) : []).map((p) => [p.id, p.name])
  );
  const currency = g.group.baseCurrency;
  const text = `Split: ${g.group.name}`;
  const options = {};
  for (const t of mine) {
    const k = kassen.get(t.to);
    const receiverId = k?.receiverPersonId ?? k?.personalOf;
    const d = details.find((x) => x.personId === receiverId);
    if (!d || !receiverId) continue;
    const holder = d.accountHolder ?? names.get(receiverId) ?? "";
    options[t.from + "|" + t.to] = {
      receiverName: names.get(receiverId),
      paypal: d.paypalMe ? paypalLink(d.paypalMe, t.amount, currency) : null,
      iban: d.iban ? formatIban(d.iban) : null,
      holder,
      girocode: d.iban && currency === "EUR" ? await QRCode.toString(epcPayload({ name: holder, iban: d.iban, amount: t.amount, text }), { type: "svg", margin: 1, errorCorrectionLevel: "M" }) : null,
      weroContact: d.weroContact,
      text
    };
  }
  return { paymentOptions: options };
};
const actions = {
  record: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const f = await request.formData();
    const amount = parseAmount(String(f.get("amount") ?? ""), g.group.baseCurrency);
    if (!amount || amount <= 0) return fail(400, { message: "Ungültiger Betrag." });
    const dateIn = String(f.get("date") ?? "");
    const latest = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    if (dateIn && (!/^\d{4}-\d{2}-\d{2}$/.test(dateIn) || dateIn > latest)) return fail(400, { message: "Ungültiges Datum." });
    try {
      await recordSettlement(g, {
        from: String(f.get("from")),
        to: String(f.get("to")),
        amount,
        method: paymentMethods.find((m) => m === f.get("method")) ?? "other",
        date: dateIn || void 0
      });
    } catch (e) {
      if (e instanceof SettlementError) return fail(400, { message: e.message });
      throw e;
    }
    return { ok: true };
  },
  confirm: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const id = String((await request.formData()).get("id"));
    const [s] = await db.select().from(settlements).where(and(eq(settlements.id, id), eq(settlements.groupId, params.id)));
    if (!s) error(404);
    if (s.toKasseId !== g.membership.kasseId && !g.isAdmin) error(403, "Nur der Empfänger kann bestätigen.");
    await db.update(settlements).set({ status: "confirmed", confirmedAt: /* @__PURE__ */ new Date() }).where(eq(settlements.id, id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "settlement.confirm", entityId: id });
    void kasseRecipients(params.id, s.fromKasseId, g.user.id).then(
      (ids) => notify(ids, {
        title: `${g.group.emoji} ${g.group.name}`,
        body: `${g.user.name} hat deine Zahlung über ${formatAmount(s.amount, g.group.baseCurrency)} bestätigt.`,
        url: `/gruppen/${params.id}/salden`
      })
    );
    return { ok: true };
  },
  /** The receiver reminds the payer of an open transfer (at most once a day). */
  remind: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const from = String((await request.formData()).get("from"));
    const state = await loadGroupState(params.id);
    const t = state.transfers.find((x) => x.from === from && x.to === g.membership.kasseId);
    if (!t) return fail(400, { message: "Diese Zahlung ist nicht mehr offen." });
    const key = `${from}|${t.to}`;
    const [recent] = await db.select({ id: auditLog.id }).from(auditLog).where(
      and(
        eq(auditLog.groupId, params.id),
        eq(auditLog.action, "settlement.remind"),
        eq(auditLog.entityId, key),
        gt(auditLog.createdAt, new Date(Date.now() - REMINDER_HOURS * 36e5))
      )
    ).limit(1);
    if (recent) return fail(400, { message: "Es wurde heute schon erinnert." });
    await audit(db, { groupId: params.id, personId: g.user.id, action: "settlement.remind", entityId: key });
    const ids = await kasseRecipients(params.id, from, g.user.id);
    await notify(ids, {
      title: `${g.group.emoji} ${g.group.name}`,
      body: `Erinnerung von ${g.user.name}: noch ${formatAmount(t.amount, g.group.baseCurrency)} offen.`,
      url: `/gruppen/${params.id}/salden`,
      tag: `remind-${key}`
    });
    return { reminded: from };
  },
  delete: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const id = String((await request.formData()).get("id"));
    const [s] = await db.select().from(settlements).where(and(eq(settlements.id, id), eq(settlements.groupId, params.id)));
    if (!s) error(404);
    const involved = [s.fromKasseId, s.toKasseId].includes(g.membership.kasseId);
    if (!involved && !g.isAdmin) error(403);
    await db.update(settlements).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(settlements.id, id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "settlement.delete", entityId: id });
    return { ok: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-vAXm3x2G.js.map

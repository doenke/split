import { and, eq, inArray, isNull } from 'drizzle-orm';
import { a as computeShares, S as SplitError } from './split.js-Diu3SqNm.js';
import { r as rateFromCharged, a as convert, f as formatAmount } from './currency.js-B45uFFG3.js';
import { d as db, b as expenses, j as expensePayers, a as attachments } from './index3.js-LeA4cvVT.js';
import { a as audit } from './audit.js-DeGbxmfN.js';
import { n as newId } from './ids.js-2U6-pnrm.js';
import { l as lookupRate } from './rates.js-C_LWDk2B.js';
import { c as toCoreExpense, t as toCoreMember } from './groups.js-By2r4Rg8.js';
import { g as groupRecipients, n as notify } from './push.js-x-TdAYqk.js';

class InputError extends Error {
}
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isInt = (n) => typeof n === "number" && Number.isInteger(n);
async function prepareExpense(raw, group, members, profiles, existing) {
  const input = raw;
  if (!input || typeof input !== "object") throw new InputError("Ungültige Eingabe.");
  const title = String(input.title ?? "").trim();
  if (!title) throw new InputError("Bitte gib einen Titel an.");
  if (!isInt(input.amount) || input.amount <= 0) throw new InputError("Bitte gib einen Betrag an.");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new InputError("Ungültige Währung.");
  if (!isDate(input.date)) throw new InputError("Ungültiges Datum.");
  const memberIds = new Set(members.map((m) => m.personId));
  const payers = (input.payers ?? []).filter((p) => p.amount > 0);
  if (!payers.length) throw new InputError("Wer hat bezahlt?");
  for (const p of payers) {
    if (!memberIds.has(p.personId) || !isInt(p.amount)) throw new InputError("Ungültige Zahler.");
  }
  if (payers.length > 1 && payers.reduce((s, p) => s + p.amount, 0) !== input.amount) {
    throw new InputError("Die Beträge der Zahler ergeben nicht den Gesamtbetrag.");
  }
  if (payers.length === 1) payers[0].amount = input.amount;
  const privateAmount = isInt(input.privateAmount) ? input.privateAmount : 0;
  if (privateAmount < 0 || privateAmount >= input.amount) throw new InputError("Der private Anteil muss kleiner als der Betrag sein.");
  let rate = 1;
  let rateSource = "none";
  let rateProvisional = false;
  if (input.currency !== group.baseCurrency) {
    if (input.rate?.source === "manual" && typeof input.rate.value === "number" && input.rate.value > 0) {
      rate = input.rate.value;
      rateSource = "manual";
    } else if (input.rate?.source === "charged" && isInt(input.rate.charged) && input.rate.charged > 0) {
      rate = rateFromCharged(input.amount, input.currency, input.rate.charged, group.baseCurrency);
      rateSource = "charged";
    } else if (existing?.rateSource === "ecb" && existing.currency === input.currency && existing.date === input.date) {
      rate = existing.rate;
      rateSource = "ecb";
      rateProvisional = existing.rateProvisional;
    } else {
      const found = await lookupRate(input.currency, group.baseCurrency, input.date);
      if (!found) throw new InputError(`Für ${input.currency} ist kein Kurs bekannt. Bitte gib den Kurs oder den abgebuchten Betrag an.`);
      rate = found.rate;
      rateSource = "ecb";
      rateProvisional = found.provisional;
    }
  }
  const baseAmount = rateSource === "charged" ? input.rate.charged : convert(input.amount, input.currency, group.baseCurrency, rate);
  const privateBase = Math.round(privateAmount * baseAmount / input.amount);
  const profile = input.profileId ? profiles.find((p) => p.id === input.profileId) : void 0;
  if (input.profileId && !profile) throw new InputError("Unbekanntes Profil.");
  const equal = input.equalWeights === true;
  let rule = profile ? profile.rule : input.rule;
  if (rule && equal && rule.type !== "individual") rule = { ...rule, equalWeights: true };
  if (!rule || !["all", "all_except", "only", "individual"].includes(rule.type)) throw new InputError("Ungültige Aufteilung.");
  const ids = rule.type === "all_except" ? rule.excluded : rule.type === "only" ? rule.included : rule.type === "individual" ? Object.keys(rule.values) : [];
  if (ids.some((id) => !memberIds.has(id))) throw new InputError("Unbekannte Person in der Aufteilung.");
  if (rule.type === "individual") {
    const values = Object.values(rule.values);
    if (values.some((v) => typeof v !== "number" || v < 0)) throw new InputError("Ungültige Anteile.");
    if (rule.mode === "amounts" && values.reduce((s, v) => s + v, 0) !== input.amount - privateAmount) {
      throw new InputError("Die Einzelbeträge ergeben nicht den (gemeinsamen) Betrag.");
    }
    if (rule.mode === "percent" && Math.abs(values.reduce((s, v) => s + v, 0) - 100) > 0.01) {
      throw new InputError("Die Prozente ergeben nicht 100 %.");
    }
  }
  let period = null;
  if (input.period) {
    if (!isDate(input.period.from) || !isDate(input.period.to) || input.period.to < input.period.from) {
      throw new InputError("Ungültiger Zeitraum.");
    }
    if (input.period.unit === "nights" && input.period.to === input.period.from) {
      throw new InputError("Für Übernachtungen muss das Ende nach dem Beginn liegen.");
    }
    period = input.period;
  }
  const row = {
    type: input.type === "income" ? "income" : "expense",
    title,
    date: input.date,
    amount: input.amount,
    currency: input.currency,
    rate,
    rateSource,
    rateProvisional,
    baseAmount,
    privateAmount: privateBase,
    categoryId: input.categoryId || null,
    profileId: profile?.id ?? null,
    // a profile used as is stays linked (and follows later profile changes)
    rule: profile && !equal ? null : rule,
    periodFrom: period?.from ?? null,
    periodTo: period?.to ?? null,
    periodUnit: period?.unit ?? null,
    notes: String(input.notes ?? "").trim() || null,
    // until the charged amount is entered, the ECB rate is used
    awaitingCharge: rateSource === "ecb" && input.awaitingCharge === true
  };
  try {
    computeShares(
      toCoreExpense({ ...row, id: "new", payers: payers.map((p) => ({ ...p, expenseId: "new" })) }, profiles),
      members.map(toCoreMember)
    );
  } catch (e) {
    if (e instanceof SplitError) throw new InputError(e.message);
    throw e;
  }
  const attachmentIds = Array.isArray(input.attachmentIds) ? input.attachmentIds.filter((x) => typeof x === "string").slice(0, 20) : [];
  const clientId = typeof input.clientId === "string" && /^[\w-]{8,64}$/.test(input.clientId) ? input.clientId : null;
  const sel = input.receiptSelection;
  const receiptSelection = sel && typeof sel.attachmentId === "string" && Array.isArray(sel.deselected) ? { attachmentId: sel.attachmentId, deselected: sel.deselected.filter((n) => Number.isInteger(n)).slice(0, 500) } : null;
  return { row, payers, attachmentIds, clientId, receiptSelection };
}
async function saveExpense(groupId, userId, prepared, existingId) {
  if (!existingId && prepared.clientId) {
    const [dup] = await db.select({ id: expenses.id }).from(expenses).where(and(eq(expenses.clientId, prepared.clientId), eq(expenses.groupId, groupId)));
    if (dup) return dup.id;
  }
  const id = existingId ?? newId();
  await db.transaction(async (tx) => {
    if (existingId) {
      await tx.update(expenses).set({ ...prepared.row, status: "final", updatedAt: /* @__PURE__ */ new Date() }).where(eq(expenses.id, existingId));
      await tx.delete(expensePayers).where(eq(expensePayers.expenseId, existingId));
    } else {
      await tx.insert(expenses).values({ ...prepared.row, id, groupId, createdBy: userId, clientId: prepared.clientId });
    }
    await tx.insert(expensePayers).values(prepared.payers.map((p) => ({ ...p, expenseId: id })));
    if (prepared.attachmentIds.length) {
      await tx.update(attachments).set({ expenseId: id }).where(
        and(
          inArray(attachments.id, prepared.attachmentIds),
          eq(attachments.groupId, groupId),
          isNull(attachments.expenseId)
        )
      );
    }
    if (prepared.receiptSelection) {
      const [a] = await tx.select().from(attachments).where(and(eq(attachments.id, prepared.receiptSelection.attachmentId), eq(attachments.groupId, groupId)));
      if (a?.ocrResult) {
        await tx.update(attachments).set({ ocrResult: { ...a.ocrResult, deselected: prepared.receiptSelection.deselected } }).where(eq(attachments.id, a.id));
      }
    }
    await audit(tx, {
      groupId,
      personId: userId,
      action: existingId ? "expense.update" : "expense.create",
      entityId: id,
      data: { title: prepared.row.title, amount: prepared.row.amount, currency: prepared.row.currency }
    });
  });
  return id;
}
function announceExpense(group, user, row, expenseId) {
  void groupRecipients(group.id, user.id).then(
    (ids) => notify(ids, {
      title: `${group.emoji} ${group.name}`,
      body: `${user.name}: ${row.title} – ${formatAmount(row.amount, row.currency)}`,
      url: `/gruppen/${group.id}/ausgaben/${expenseId}`
    })
  );
}

export { InputError as I, announceExpense as a, prepareExpense as p, saveExpense as s };
//# sourceMappingURL=expenses.js-CZuVyTN3.js.map

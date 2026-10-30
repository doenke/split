import { a as computeShares, c as computePaid } from '../../../../../chunks/split.js-Diu3SqNm.js';
import { b as amountToInput } from '../../../../../chunks/currency.js-B45uFFG3.js';
import { r as requireGroup, d as loadGroupState, e as loadCategories } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm';
import '../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';

const cell = (v) => {
  const s = v === null || v === void 0 ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const GET = async ({ params, locals }) => {
  await requireGroup(params.id, locals.user);
  const [state, categories] = await Promise.all([loadGroupState(params.id), loadCategories(params.id)]);
  const base = state.group.baseCurrency;
  const cats = new Map(categories.map((c) => [c.id, c.name]));
  const people = state.members;
  const name = new Map(people.map((p) => [p.personId, p.name]));
  const header = [
    "Datum",
    "Titel",
    "Typ",
    "Kategorie",
    "Betrag",
    "Währung",
    "Kurs",
    `Betrag ${base}`,
    `Privat ${base}`,
    "Bezahlt von",
    ...people.flatMap((p) => [`${p.name} bezahlt`, `${p.name} Anteil`]),
    "Notiz"
  ];
  const rows = [header.map(cell).join(";")];
  state.expenses.slice().reverse().forEach((e, i) => {
    const core = state.coreExpenses[state.expenses.length - 1 - i];
    let shares = /* @__PURE__ */ new Map();
    let paid = /* @__PURE__ */ new Map();
    try {
      shares = computeShares(core, state.coreMembers);
      paid = computePaid(core);
    } catch {
    }
    rows.push(
      [
        e.date,
        e.title,
        e.type === "income" ? "Einnahme" : "Ausgabe",
        e.categoryId ? cats.get(e.categoryId) : "",
        amountToInput(e.amount, e.currency),
        e.currency,
        e.currency === base ? "" : String(e.rate).replace(".", ","),
        amountToInput(e.baseAmount, base),
        amountToInput(e.privateAmount, base),
        e.payers.map((p) => name.get(p.personId) ?? "?").join(", "),
        ...people.flatMap((p) => [
          amountToInput(paid.get(p.personId) ?? 0, base),
          amountToInput(shares.get(p.personId) ?? 0, base)
        ]),
        e.notes ?? ""
      ].map(cell).join(";")
    );
  });
  const filename = `${state.group.name.replace(/[^\w\- äöüÄÖÜß]/g, "")}.csv`;
  return new Response("\uFEFF" + rows.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts.js-CSVPA9-e.js.map

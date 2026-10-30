import { aa as head, a4 as attr, a7 as stringify, a6 as escape_html, a9 as ensure_array_like, a8 as attr_class, _ as derived } from '../../../../../chunks/index.js-BT3kaB_g.js';
import { f as formatDate } from '../../../../../chunks/format.js-Cn5c-OM3.js';
import { f as formatAmount } from '../../../../../chunks/currency.js-B45uFFG3.js';
import { h as html } from '../../../../../chunks/html.js-CevvQr0N.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const c = derived(() => data.group.baseCurrency);
    const people = derived(() => new Map(data.members.map((m) => [m.personId, m.name])));
    const cats = derived(() => new Map(data.categories.map((x) => [x.id, x])));
    const kasseName = (id) => data.kassen[id]?.name ?? "?";
    const kassen = derived(() => Object.values(data.balances.kassen).sort((a, b) => b.balance - a.balance));
    const total = derived(() => data.expenses.reduce((s, e) => s + (e.type === "income" ? -1 : 1) * (e.baseAmount - e.privateAmount), 0));
    const sorted = derived(() => data.expenses.slice().sort((a, b) => a.date.localeCompare(b.date)));
    const sum = (t) => Object.values(t).reduce((s, v) => s + v, 0);
    head("170t5c0", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Abrechnung ${escape_html(data.group.name)}</title>`);
      });
      $$renderer3.push(`${html("<style>@page { size: A4 landscape; margin: 12mm; }</style>")}`);
    });
    $$renderer2.push(`<div class="noprint row svelte-170t5c0" style="margin-bottom: 1rem"><a${attr("href", `/gruppen/${stringify(data.group.id)}/einstellungen`)} class="small grow">← Zurück</a> <button class="primary">Drucken / als PDF speichern</button></div> <article class="doc svelte-170t5c0"><h1>${escape_html(data.group.emoji)} Abrechnung ${escape_html(data.group.name)}</h1> <p class="muted small">`);
    if (data.group.startDate) {
      $$renderer2.push(`<!--[0-->${escape_html(formatDate(data.group.startDate))}`);
      if (data.group.endDate) {
        $$renderer2.push(`<!--[0-->– ${escape_html(formatDate(data.group.endDate))}`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> ·`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> ${escape_html(data.members.length)} Personen · Stand ${escape_html(new Date(data.generatedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }))} `);
    if (data.group.closedUntil) {
      $$renderer2.push(`<!--[0-->· abgeschlossen bis ${escape_html(formatDate(data.group.closedUntil))}`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></p> <h2 class="svelte-170t5c0">Übersicht</h2> <table class="svelte-170t5c0"><thead class="svelte-170t5c0"><tr class="svelte-170t5c0"><th class="svelte-170t5c0">Kasse</th><th class="svelte-170t5c0">Personen</th><th class="r svelte-170t5c0">bezahlt</th><th class="r svelte-170t5c0">verbraucht</th><th class="r svelte-170t5c0">Ausgleich</th><th class="r svelte-170t5c0">Saldo</th></tr></thead><tbody><!--[-->`);
    const each_array = ensure_array_like(kassen());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let k = each_array[$$index];
      $$renderer2.push(`<tr class="svelte-170t5c0"><td class="svelte-170t5c0">${escape_html(kasseName(k.kasseId))}</td><td class="small svelte-170t5c0">${escape_html(k.personIds.map((id) => people().get(id) ?? "?").join(", "))}</td><td class="r svelte-170t5c0">${escape_html(formatAmount(k.paid, c()))}</td><td class="r svelte-170t5c0">${escape_html(formatAmount(k.consumed, c()))}</td><td class="r svelte-170t5c0">${escape_html(formatAmount(k.settlementsSent - k.settlementsReceived, c()))}</td><td class="r svelte-170t5c0"><strong>${escape_html(formatAmount(k.balance, c()))}</strong></td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody><tfoot><tr class="svelte-170t5c0"><td colspan="3" class="svelte-170t5c0">Gesamtausgaben</td><td class="r svelte-170t5c0"><strong>${escape_html(formatAmount(total(), c()))}</strong></td><td colspan="2" class="svelte-170t5c0"></td></tr></tfoot></table> <h2 class="svelte-170t5c0">Offene Zahlungen</h2> `);
    if (data.transfers.length) {
      $$renderer2.push(`<!--[0--><table class="svelte-170t5c0"><tbody><!--[-->`);
      const each_array_1 = ensure_array_like(data.transfers);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let t = each_array_1[$$index_1];
        $$renderer2.push(`<tr class="svelte-170t5c0"><td class="svelte-170t5c0">${escape_html(kasseName(t.from))} → ${escape_html(kasseName(t.to))}</td><td class="r svelte-170t5c0"><strong>${escape_html(formatAmount(t.amount, c()))}</strong></td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table>`);
    } else {
      $$renderer2.push(`<!--[-1--><p>Alles ausgeglichen.</p>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.settlements.length) {
      $$renderer2.push(`<!--[0--><h2 class="svelte-170t5c0">Geleistete Zahlungen</h2> <table class="svelte-170t5c0"><tbody><!--[-->`);
      const each_array_2 = ensure_array_like(data.settlements);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let s = each_array_2[$$index_2];
        $$renderer2.push(`<tr class="svelte-170t5c0"><td class="svelte-170t5c0">${escape_html(formatDate(s.date))}</td><td class="svelte-170t5c0">${escape_html(kasseName(s.fromKasseId))} → ${escape_html(kasseName(s.toKasseId))}</td><td class="svelte-170t5c0">${escape_html(s.status === "confirmed" ? "bestätigt" : "offen")}</td><td class="r svelte-170t5c0">${escape_html(formatAmount(s.amount, c()))}</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <h2 class="svelte-170t5c0">Kosten nach Kategorie</h2> <table class="svelte-170t5c0"><thead class="svelte-170t5c0"><tr class="svelte-170t5c0"><th class="svelte-170t5c0">Kasse</th><!--[-->`);
    const each_array_3 = ensure_array_like(data.categories.filter((cat) => Object.values(data.costs.kassen).some((k) => (k[cat.id] ?? 0) !== 0)));
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let cat = each_array_3[$$index_3];
      $$renderer2.push(`<th class="r svelte-170t5c0">${escape_html(cat.icon)}</th>`);
    }
    $$renderer2.push(`<!--]--><th class="r svelte-170t5c0">Summe</th></tr></thead><tbody><!--[-->`);
    const each_array_4 = ensure_array_like(Object.entries(data.costs.kassen));
    for (let $$index_5 = 0, $$length = each_array_4.length; $$index_5 < $$length; $$index_5++) {
      let [id, t] = each_array_4[$$index_5];
      $$renderer2.push(`<tr class="svelte-170t5c0"><td class="svelte-170t5c0">${escape_html(kasseName(id))}</td><!--[-->`);
      const each_array_5 = ensure_array_like(data.categories.filter((cat) => Object.values(data.costs.kassen).some((k) => (k[cat.id] ?? 0) !== 0)));
      for (let $$index_4 = 0, $$length2 = each_array_5.length; $$index_4 < $$length2; $$index_4++) {
        let cat = each_array_5[$$index_4];
        $$renderer2.push(`<td class="r svelte-170t5c0">${escape_html(t[cat.id] ? formatAmount(t[cat.id], c()) : "")}</td>`);
      }
      $$renderer2.push(`<!--]--><td class="r svelte-170t5c0"><strong>${escape_html(formatAmount(sum(t), c()))}</strong></td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table> <h2 class="pagebreak svelte-170t5c0">Alle Ausgaben mit Anteilen pro Person</h2> <div class="scroll svelte-170t5c0"><table class="matrix svelte-170t5c0"><thead class="svelte-170t5c0"><tr class="svelte-170t5c0"><th class="svelte-170t5c0">Datum</th><th class="svelte-170t5c0">Wofür</th><th class="svelte-170t5c0">Bezahlt von</th><th class="r svelte-170t5c0">Betrag</th><!--[-->`);
    const each_array_6 = ensure_array_like(data.members);
    for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
      let m = each_array_6[$$index_6];
      $$renderer2.push(`<th class="r person svelte-170t5c0">${escape_html(m.name)}</th>`);
    }
    $$renderer2.push(`<!--]--></tr></thead><tbody><!--[-->`);
    const each_array_7 = ensure_array_like(sorted());
    for (let $$index_8 = 0, $$length = each_array_7.length; $$index_8 < $$length; $$index_8++) {
      let e = each_array_7[$$index_8];
      const sh = data.shares[e.id] ?? {};
      $$renderer2.push(`<tr class="svelte-170t5c0"><td class="nowrap svelte-170t5c0">${escape_html(formatDate(e.date, { day: "2-digit", month: "2-digit" }))}</td><td class="svelte-170t5c0">${escape_html(e.categoryId ? cats().get(e.categoryId)?.icon : "")} ${escape_html(e.title)}`);
      if (e.type === "income") {
        $$renderer2.push(`<!--[0-->(Einnahme)`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (e.privateAmount > 0) {
        $$renderer2.push(`<!--[0--><div class="muted svelte-170t5c0">davon privat ${escape_html(formatAmount(e.privateAmount, c()))}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></td><td class="svelte-170t5c0">${escape_html(e.payers.map((p) => people().get(p.personId) ?? "?").join(", "))}</td><td class="r svelte-170t5c0">${escape_html(e.type === "income" ? "−" : "")}${escape_html(formatAmount(e.baseAmount, c()))} `);
      if (e.currency !== c()) {
        $$renderer2.push(`<!--[0--><div class="muted svelte-170t5c0">${escape_html(formatAmount(e.amount, e.currency))}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></td><!--[-->`);
      const each_array_8 = ensure_array_like(data.members);
      for (let $$index_7 = 0, $$length2 = each_array_8.length; $$index_7 < $$length2; $$index_7++) {
        let m = each_array_8[$$index_7];
        $$renderer2.push(`<td${attr_class("r svelte-170t5c0", void 0, { "muted": !sh[m.personId] })}>${escape_html(sh[m.personId] ? formatAmount(sh[m.personId], c()) : "–")}</td>`);
      }
      $$renderer2.push(`<!--]--></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody><tfoot class="svelte-170t5c0"><tr class="svelte-170t5c0"><td colspan="3" class="svelte-170t5c0">Anteil gesamt</td><td class="r svelte-170t5c0">${escape_html(formatAmount(total(), c()))}</td><!--[-->`);
    const each_array_9 = ensure_array_like(data.members);
    for (let $$index_9 = 0, $$length = each_array_9.length; $$index_9 < $$length; $$index_9++) {
      let m = each_array_9[$$index_9];
      $$renderer2.push(`<td class="r svelte-170t5c0">${escape_html(formatAmount(data.balances.persons[m.personId]?.consumed ?? 0, c()))}</td>`);
    }
    $$renderer2.push(`<!--]--></tr><tr class="svelte-170t5c0"><td colspan="4" class="svelte-170t5c0">Bezahlt</td><!--[-->`);
    const each_array_10 = ensure_array_like(data.members);
    for (let $$index_10 = 0, $$length = each_array_10.length; $$index_10 < $$length; $$index_10++) {
      let m = each_array_10[$$index_10];
      $$renderer2.push(`<td class="r svelte-170t5c0">${escape_html(formatAmount(data.balances.persons[m.personId]?.paid ?? 0, c()))}</td>`);
    }
    $$renderer2.push(`<!--]--></tr><tr class="saldo svelte-170t5c0"><td colspan="4" class="svelte-170t5c0">Saldo (bezahlt − Anteil, vor Ausgleichszahlungen)</td><!--[-->`);
    const each_array_11 = ensure_array_like(data.members);
    for (let $$index_11 = 0, $$length = each_array_11.length; $$index_11 < $$length; $$index_11++) {
      let m = each_array_11[$$index_11];
      const b = data.balances.persons[m.personId]?.balance ?? 0;
      $$renderer2.push(`<td class="r svelte-170t5c0">${escape_html(b > 0 ? "+" : "")}${escape_html(formatAmount(b, c()))}</td>`);
    }
    $$renderer2.push(`<!--]--></tr></tfoot></table></div></article>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-CmqVLXO0.js.map

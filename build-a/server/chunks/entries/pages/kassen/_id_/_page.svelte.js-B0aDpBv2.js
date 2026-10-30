import { aa as head, a6 as escape_html, a4 as attr, a9 as ensure_array_like, a8 as attr_class, a7 as stringify, _ as derived } from '../../../../chunks/index.js-BT3kaB_g.js';
import { K as KasseSwitchDialog } from '../../../../chunks/KasseSwitchDialog.js-CcYeHW3P.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../../chunks/Avatar.js-BAGJaOlv.js';
import { f as formatAmount } from '../../../../chunks/currency.js-B45uFFG3.js';
import { C as CostBars } from '../../../../chunks/CostBars.js-BKf99_4k.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let netting = null;
    const me = derived(() => data.members.find((m) => m.personId === data.user?.id));
    const years = derived(() => [...new Set(data.costs.map((c) => c.year))].sort().reverse());
    let year = null;
    const costTotals = derived(() => {
      const byCurrency = /* @__PURE__ */ new Map();
      for (const c of data.costs) {
        const t = byCurrency.get(c.currency) ?? {};
        for (const [cat, v] of Object.entries(c.totals)) t[cat] = (t[cat] ?? 0) + v;
        byCurrency.set(c.currency, t);
      }
      return [...byCurrency];
    });
    const methodLabels = {
      transfer: "Überweisung",
      paypal: "PayPal",
      wero: "Wero",
      cash: "Bar",
      other: "Sonstiges"
    };
    head("1aolws6", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.kasse.name)} · Kassen</title>`);
      });
    });
    $$renderer2.push(`<a href="/kassen" class="small">← Alle Kassen</a> `);
    KasseSwitchDialog($$renderer2, { switched: form && "switched" in form ? form.switched : [] });
    $$renderer2.push(`<!----> `);
    if (form && "message" in form && form.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.isManager) {
      $$renderer2.push(`<!--[0--><form method="POST" action="?/rename" class="row title svelte-1aolws6"><input name="name"${attr("value", data.kasse.name)} class="grow name svelte-1aolws6" aria-label="Name der Kasse"/> <button>Speichern</button></form>`);
    } else {
      $$renderer2.push(`<!--[-1--><h1 class="title svelte-1aolws6">${escape_html(data.kasse.name)}</h1>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.totals.length) {
      $$renderer2.push(`<!--[0--><div class="card row" style="justify-content: space-between"><span class="muted">Gesamtsaldo über alle Gruppen</span> <span><!--[-->`);
      const each_array = ensure_array_like(data.totals);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let t = each_array[$$index];
        $$renderer2.push(`<div${attr_class(`amount big right ${t.amount > 0 ? "positive" : t.amount < 0 ? "negative" : ""}`, "svelte-1aolws6")}>${escape_html(t.amount > 0 ? "+" : "")}${escape_html(formatAmount(t.amount, t.currency))}</div>`);
      }
      $$renderer2.push(`<!--]--></span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.netting.length) {
      $$renderer2.push(`<!--[0--><h2>Über Gruppen verrechnen</h2> <p class="small muted">Statt mehrerer Zahlungen in verschiedenen Gruppen reicht eine einzige Zahlung.</p> <div class="list"><!--[-->`);
      const each_array_1 = ensure_array_like(data.netting);
      for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
        let n = each_array_1[$$index_3];
        $$renderer2.push(`<div class="block svelte-1aolws6"><div class="row"><div class="grow">`);
        if (n.amount > 0) {
          $$renderer2.push(`<!--[0--><strong>${escape_html(n.name)}</strong> zahlt euch`);
        } else if (n.amount < 0) {
          $$renderer2.push(`<!--[1-->Ihr zahlt an <strong>${escape_html(n.name)}</strong>`);
        } else {
          $$renderer2.push(`<!--[-1-->Mit <strong>${escape_html(n.name)}</strong> ausgeglichen`);
        }
        $$renderer2.push(`<!--]--> <div class="small muted"><!--[-->`);
        const each_array_2 = ensure_array_like(n.parts);
        for (let i = 0, $$length2 = each_array_2.length; i < $$length2; i++) {
          let p = each_array_2[i];
          $$renderer2.push(`<!---->${escape_html(i ? " · " : "")}${escape_html(data.groups.find((g) => g.id === p.groupId)?.name)}: ${escape_html(p.amount > 0 ? "+" : "")}${escape_html(formatAmount(p.amount, n.currency))}`);
        }
        $$renderer2.push(`<!--]--></div></div> <span class="amount">${escape_html(formatAmount(Math.abs(n.amount), n.currency))}</span> <button class="small-btn svelte-1aolws6">Erledigt</button></div> `);
        if (netting === n.kasseId) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/settleNet" class="row" style="margin-top: 0.5rem"><input type="hidden" name="kasseId"${attr("value", n.kasseId)}/> <input type="hidden" name="currency"${attr("value", n.currency)}/> <select name="method" class="grow"><!--[-->`);
          const each_array_3 = ensure_array_like(Object.entries(methodLabels));
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let [k, label] = each_array_3[$$index_2];
            $$renderer2.option({ value: k }, ($$renderer3) => {
              $$renderer3.push(`${escape_html(label)}`);
            });
          }
          $$renderer2.push(`<!--]--></select> <button class="primary">Verrechnung eintragen</button></form> <p class="hint">Es wird in jeder Gruppe eine passende Zahlung eingetragen, die zusammen genau ${escape_html(formatAmount(Math.abs(n.amount), n.currency))} ergeben.</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form && "settled" in form) {
      $$renderer2.push(`<!--[0--><p class="positive">✔ Verrechnung eingetragen.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <h2>Gruppen</h2> `);
    if (data.groups.length === 0) {
      $$renderer2.push(`<!--[0--><div class="card small muted">Diese Kasse wird noch in keiner Gruppe verwendet. Ordne sie in einer Gruppe unter <em>Mitglieder → Bearbeiten</em> zu
		– oder füge neue Mitglieder hier hinzu, sie übernehmen die Kasse automatisch.</div>`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="list"><!--[-->`);
      const each_array_4 = ensure_array_like(data.groups);
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let g = each_array_4[$$index_4];
        $$renderer2.push(`<a${attr("href", `/gruppen/${stringify(g.id)}/salden`)}><span class="emoji svelte-1aolws6">${escape_html(g.emoji)}</span> <div class="grow"><strong>${escape_html(g.name)}</strong> <div class="small muted">bezahlt ${escape_html(formatAmount(g.paid, g.currency))} · verbraucht ${escape_html(formatAmount(g.consumed, g.currency))}</div></div> <span${attr_class(`amount ${g.balance > 0 ? "positive" : g.balance < 0 ? "negative" : "muted"}`)}>${escape_html(g.balance > 0 ? "+" : "")}${escape_html(formatAmount(g.balance, g.currency))}</span></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.costs.length) {
      $$renderer2.push(`<!--[0--><h2>Was hat es euch gekostet?</h2> <div class="card">`);
      if (years().length > 1) {
        $$renderer2.push(`<!--[0--><div class="segmented" style="margin-bottom: 0.5rem"><button type="button"${attr_class("", void 0, { "active": year === null })}>Alle</button> <!--[-->`);
        const each_array_5 = ensure_array_like(years());
        for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
          let y = each_array_5[$$index_5];
          $$renderer2.push(`<button type="button"${attr_class("", void 0, { "active": year === y })}>${escape_html(y)}</button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_6 = ensure_array_like(costTotals());
      for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
        let [currency, totals] = each_array_6[$$index_6];
        $$renderer2.push(`<div class="row" style="justify-content: space-between"><span class="muted small">${escape_html(data.costs.filter((c) => c.currency === currency).length)} Gruppe(n)</span> <span class="amount">${escape_html(formatAmount(Object.values(totals).reduce((a, b) => a + b, 0), currency))}</span></div> `);
        CostBars($$renderer2, { totals, categories: data.categories, currency });
        $$renderer2.push(`<!---->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="row" style="justify-content: space-between"><h2>Mitglieder</h2> `);
    if (data.isManager && true) {
      $$renderer2.push(`<!--[0--><button class="primary">+ Person</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="list"><!--[-->`);
    const each_array_8 = ensure_array_like(data.members);
    for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
      let m = each_array_8[$$index_8];
      $$renderer2.push(`<div>`);
      Avatar($$renderer2, { name: m.name, color: m.color, url: m.avatarUrl, size: 34 });
      $$renderer2.push(`<!----> <div class="grow"><div><strong>${escape_html(m.name)}</strong> `);
      if (m.personId === data.user?.id) {
        $$renderer2.push(`<!--[0--><span class="badge">du</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (m.isManager) {
        $$renderer2.push(`<!--[0--><span class="badge">Verwalter</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (data.kasse.receiverPersonId === m.personId) {
        $$renderer2.push(`<!--[0--><span class="badge">empfängt Zahlungen</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (data.isManager) {
        $$renderer2.push(`<!--[0--><div class="row small actions svelte-1aolws6">`);
        if (data.kasse.receiverPersonId !== m.personId) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/setReceiver"><input type="hidden" name="personId"${attr("value", m.personId)}/><button class="link">Zahlungsempfänger</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <form method="POST" action="?/toggleManager"><input type="hidden" name="personId"${attr("value", m.personId)}/><button class="link">${escape_html(m.isManager ? "Kein Verwalter" : "Verwalter")}</button></form> `);
        if (m.personId !== data.user?.id) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/removeMember"><input type="hidden" name="personId"${attr("value", m.personId)}/><button class="link danger">Entfernen</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (me()) {
      $$renderer2.push(`<!--[0--><div class="card stack"><form method="POST" action="?/setPreferred"><label class="check"><input type="checkbox"${attr("checked", me().isPreferred, true)}/> Meine bevorzugte Kasse (wird in neuen Gruppen vorausgewählt)</label></form> <form method="POST" action="?/removeMember"><input type="hidden" name="personId"${attr("value", me().personId)}/> <button class="danger full">Kasse verlassen</button></form> `);
      if (data.isManager && data.groups.length === 0) {
        $$renderer2.push(`<!--[0--><form method="POST" action="?/delete"><button class="danger full">Kasse löschen</button></form>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-B0aDpBv2.js.map

import { aa as head, a6 as escape_html, a9 as ensure_array_like, a8 as attr_class, ac as clsx, a5 as attr_style, a7 as stringify, a4 as attr, _ as derived } from '../../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../../../chunks/Avatar.js-BAGJaOlv.js';
import { f as formatAmount, b as amountToInput } from '../../../../../chunks/currency.js-B45uFFG3.js';
import { C as CompletionCard } from '../../../../../chunks/CompletionCard.js-DXNSJWi2.js';
import { f as formatDate } from '../../../../../chunks/format.js-Cn5c-OM3.js';

function PayPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { options, amount, currency } = $$props;
    let tab = null;
    const tabs = derived(() => options ? [
      options.weroContact ? ["wero", "Wero"] : null,
      options.iban ? ["giro", "Überweisung"] : null,
      options.paypal ? ["paypal", "PayPal"] : null
    ].filter(Boolean) : []);
    function copyRow($$renderer3, label, value, key) {
      $$renderer3.push(`<div class="copy svelte-7l50o0"><span class="small muted svelte-7l50o0">${escape_html(label)}</span> <span class="grow value svelte-7l50o0">${escape_html(value)}</span> <button type="button" class="link small svelte-7l50o0">${escape_html("Kopieren")}</button></div>`);
    }
    $$renderer2.push(`<div class="pay svelte-7l50o0">`);
    if (!options || tabs().length === 0) {
      $$renderer2.push(`<!--[0--><p class="small muted">${escape_html(options?.receiverName ?? "Der Empfänger")} hat noch keine Zahlungsdaten hinterlegt. Frag nach Wero, IBAN oder PayPal –
			oder trag die Zahlung einfach ein, sobald sie erledigt ist.</p>`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="segmented small-seg svelte-7l50o0"><!--[-->`);
      const each_array = ensure_array_like(tabs());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let [key, label] = each_array[$$index];
        $$renderer2.push(`<button type="button"${attr_class("svelte-7l50o0", void 0, { "active": tab === key })}>${escape_html(label)}</button>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      copyRow($$renderer2, "Betrag", amountToInput(amount, currency));
      $$renderer2.push(`<!----> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const currency = derived(() => data.group.baseCurrency);
    const people = derived(() => new Map(data.members.map((m) => [m.personId, m])));
    const kasseName = (id) => data.kassen[id]?.name ?? "?";
    const kasseMembers = (id) => data.members.filter((m) => m.kasseId === id);
    const kassen = derived(() => Object.values(data.balances.kassen).sort((a, b) => b.balance - a.balance));
    const maxAbs = derived(() => Math.max(1, ...kassen().map((k) => Math.abs(k.balance))));
    const groupKassen = derived(() => [...new Set(data.members.map((m) => m.kasseId))].map((id) => ({ id, name: kasseName(id) })).sort((a, b) => a.name.localeCompare(b.name, "de")));
    let paying = null;
    const methodLabels = {
      cash: "Bar",
      transfer: "Überweisung",
      paypal: "PayPal",
      wero: "Wero",
      other: "Sonstiges"
    };
    head("1aeqdfo", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Salden · ${escape_html(data.group.name)}</title>`);
      });
    });
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    CompletionCard($$renderer2, {
      completion: data.completion,
      members: data.members,
      meId: data.user.id,
      myKasseId: data.myKasseId,
      kasseName: data.kassen[data.myKasseId]?.name ?? "",
      groupId: data.group.id,
      isAdmin: data.isAdmin,
      draftCount: data.drafts.length
    });
    $$renderer2.push(`<!----> <h2>Salden</h2> <div class="list"><!--[-->`);
    const each_array = ensure_array_like(kassen());
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      let k = each_array[$$index_2];
      const ms = kasseMembers(k.kasseId);
      $$renderer2.push(`<div class="kasse svelte-1aeqdfo"><div class="head svelte-1aeqdfo"><div class="avatars svelte-1aeqdfo"><!--[-->`);
      const each_array_1 = ensure_array_like(ms.slice(0, 3));
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let m = each_array_1[$$index];
        Avatar($$renderer2, { name: m.name, color: m.color, url: m.avatarUrl, size: 30 });
      }
      $$renderer2.push(`<!--]--></div> <div class="grow"><div class="ellipsis"><strong>${escape_html(kasseName(k.kasseId))}</strong>`);
      if (k.kasseId === data.myKasseId) {
        $$renderer2.push(`<!--[0--><span class="badge">du</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="small muted">bezahlt ${escape_html(formatAmount(k.paid, currency()))} · verbraucht ${escape_html(formatAmount(k.consumed, currency()))}</div> <div class="bar svelte-1aeqdfo"><span${attr_class(clsx(k.balance >= 0 ? "pos" : "neg"), "svelte-1aeqdfo")}${attr_style("", {
        width: `${stringify(Math.abs(k.balance) / maxAbs() * 100)}%`
      })}></span></div></div> <div${attr_class(`amount right ${k.balance > 0 ? "positive" : k.balance < 0 ? "negative" : "muted"}`)}>${escape_html(k.balance > 0 ? "+" : "")}${escape_html(formatAmount(k.balance, currency()))}</div></div> `);
      if (ms.length > 1) {
        $$renderer2.push(`<!--[0--><div class="members svelte-1aeqdfo"><!--[-->`);
        const each_array_2 = ensure_array_like(ms);
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let m = each_array_2[$$index_1];
          const p = data.balances.persons[m.personId];
          $$renderer2.push(`<div class="member svelte-1aeqdfo">`);
          Avatar($$renderer2, { name: m.name, color: m.color, url: m.avatarUrl, size: 22 });
          $$renderer2.push(`<!----> <span class="grow ellipsis">${escape_html(m.name)}</span> <span class="small muted svelte-1aeqdfo">bezahlt ${escape_html(formatAmount(p?.paid ?? 0, currency()))} · Anteil ${escape_html(formatAmount(p?.consumed ?? 0, currency()))}</span></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (kassen().some((k) => kasseMembers(k.kasseId).length > 1)) {
      $$renderer2.push(`<!--[0--><p class="hint" style="margin-top: -0.5rem">Wer in einer gemeinsamen Kasse ist, gleicht zusammen aus – der Saldo steht bei der Kasse.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <a${attr("href", `/gruppen/${stringify(data.group.id)}/kosten`)} class="button full" style="margin-bottom: 1rem">📊 Was hat es gekostet? Nach Kategorien</a> <h2>${escape_html(data.completion.final ? "Endabrechnung: so wird ausgeglichen" : "So wird ausgeglichen (vorläufig)")}</h2> `);
    if (data.transfers.length === 0) {
      $$renderer2.push(`<!--[0--><div class="card">🎉 Alles ausgeglichen.</div>`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="list"><!--[-->`);
      const each_array_3 = ensure_array_like(data.transfers);
      for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
        let t = each_array_3[$$index_4];
        $$renderer2.push(`<div class="transfer"><div class="grow"><strong>${escape_html(kasseName(t.from))}</strong> → <strong>${escape_html(kasseName(t.to))}</strong></div> <span class="amount">${escape_html(formatAmount(t.amount, currency()))}</span> `);
        if (t.to === data.myKasseId) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/remind"><input type="hidden" name="from"${attr("value", t.from)}/> <button class="small-btn svelte-1aeqdfo" title="Per Benachrichtigung erinnern">${escape_html(form && "reminded" in form && form.reminded === t.from ? "✔" : "🔔")}</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (t.from === data.myKasseId) {
          $$renderer2.push(`<!--[0--><button class="small-btn primary svelte-1aeqdfo">Bezahlen</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <button class="small-btn svelte-1aeqdfo">Bezahlt</button></div> `);
        if (paying === t.from + "|" + t.to) {
          $$renderer2.push(`<!--[0--><div class="paybox svelte-1aeqdfo">`);
          PayPanel($$renderer2, {
            options: data.paymentOptions[paying],
            amount: t.amount,
            currency: currency()
          });
          $$renderer2.push(`<!----> <button class="full" style="margin-top: 0.6rem">Erledigt – Zahlung eintragen</button></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (groupKassen().length > 1) {
      $$renderer2.push("<!--[0-->");
      {
        $$renderer2.push(`<!--[-1--><button class="full" style="margin-bottom: 1rem">+ Zahlung eintragen (z.B. Bargeld, Teilzahlung)</button>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.settlements.length) {
      $$renderer2.push(`<!--[0--><h2>Zahlungen</h2> <div class="list"><!--[-->`);
      const each_array_8 = ensure_array_like(data.settlements);
      for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
        let s = each_array_8[$$index_8];
        $$renderer2.push(`<div><div class="grow"><div><strong>${escape_html(kasseName(s.fromKasseId))}</strong> → <strong>${escape_html(kasseName(s.toKasseId))}</strong></div> <div class="small muted">${escape_html(formatDate(s.date))} · ${escape_html(methodLabels[s.method])} · `);
        if (s.status === "confirmed") {
          $$renderer2.push(`<!--[0--><span class="positive">bestätigt</span>`);
        } else {
          $$renderer2.push(`<!--[-1-->wartet auf Bestätigung`);
        }
        $$renderer2.push(`<!--]--> · eingetragen von ${escape_html(people().get(s.createdBy)?.name ?? "?")}</div></div> <span class="amount">${escape_html(formatAmount(s.amount, currency()))}</span> `);
        if (s.status === "pending" && (s.toKasseId === data.myKasseId || data.isAdmin)) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/confirm"><input type="hidden" name="id"${attr("value", s.id)}/> <button class="small-btn primary svelte-1aeqdfo">Erhalten</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if ([s.fromKasseId, s.toKasseId].includes(data.myKasseId) || data.isAdmin) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/delete"><input type="hidden" name="id"${attr("value", s.id)}/> <button class="link danger" aria-label="Löschen">✕</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-BZ8ei_N8.js.map

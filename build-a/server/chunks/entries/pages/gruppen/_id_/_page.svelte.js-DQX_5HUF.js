import { aa as head, a6 as escape_html, a4 as attr, a8 as attr_class, a9 as ensure_array_like, a7 as stringify, a5 as attr_style, _ as derived } from '../../../../chunks/index.js-BT3kaB_g.js';
import { f as formatDate } from '../../../../chunks/format.js-Cn5c-OM3.js';
import { C as CompletionCard } from '../../../../chunks/CompletionCard.js-DXNSJWi2.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';
import { f as formatAmount } from '../../../../chunks/currency.js-B45uFFG3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const base = derived(() => `/gruppen/${data.group.id}`);
    const currency = derived(() => data.group.baseCurrency);
    const people = derived(() => new Map(data.members.map((m) => [m.personId, m])));
    const cats = derived(() => new Map(data.categories.map((c) => [c.id, c])));
    const myKasse = derived(() => data.balances.kassen[data.myKasseId]);
    const total = derived(() => data.expenses.reduce((s, e) => s + (e.type === "income" ? -1 : 1) * (e.baseAmount - e.privateAmount), 0));
    let pending = [];
    let snapping = false;
    const cur = (e) => formatAmount(e.amount, e.currency);
    const awaiting = derived(() => data.expenses.filter((e) => e.awaitingCharge && !e.frozenShares && (e.createdBy === data.user?.id || e.payers.some((p) => p.personId === data.user?.id))));
    let query = "";
    const filtered = derived(() => data.expenses);
    const byDate = derived(() => {
      const groups = /* @__PURE__ */ new Map();
      for (const e of filtered()) {
        if (!groups.has(e.date)) groups.set(e.date, []);
        groups.get(e.date).push(e);
      }
      return [...groups];
    });
    function payerText(e) {
      if (e.payers.length === 1) return people().get(e.payers[0].personId)?.name ?? "?";
      return `${e.payers.length} Personen`;
    }
    head("1g4ojj8", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.group.name)} · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="summary card svelte-1g4ojj8"><div><div class="small muted">Gesamtausgaben</div> <div class="amount big svelte-1g4ojj8">${escape_html(formatAmount(total(), currency()))}</div></div> <a${attr("href", `${base()}/salden`)} class="right mine svelte-1g4ojj8"><div class="small muted">${escape_html(myKasse() && myKasse().personIds.length > 1 ? "Eure Kasse" : "Dein Saldo")}</div> `);
    if (!myKasse() || myKasse().balance === 0) {
      $$renderer2.push(`<!--[0--><div class="amount big svelte-1g4ojj8">ausgeglichen</div>`);
    } else {
      $$renderer2.push(`<!--[-1--><div${attr_class(`amount big ${myKasse().balance > 0 ? "positive" : "negative"}`, "svelte-1g4ojj8")}>${escape_html(myKasse().balance > 0 ? "+" : "")}${escape_html(formatAmount(myKasse().balance, currency()))}</div>`);
    }
    $$renderer2.push(`<!--]--></a></div> `);
    if (data.expenses.length || data.drafts.length || data.completion.final) {
      $$renderer2.push("<!--[0-->");
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
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form && "message" in form && form.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.drafts.length) {
      $$renderer2.push(`<!--[0--><h2 class="section svelte-1g4ojj8">📷 Vorbereitet (${escape_html(data.drafts.length)})</h2> <div class="list drafts"><!--[-->`);
      const each_array = ensure_array_like(data.drafts);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let d = each_array[$$index];
        const ocr = d.attachments[0]?.ocr;
        $$renderer2.push(`<a${attr("href", `${base()}/ausgaben/${stringify(d.id)}`)}>`);
        if (d.attachments[0]?.mime.startsWith("image/")) {
          $$renderer2.push(`<!--[0--><img class="thumb svelte-1g4ojj8"${attr("src", `/belege/${stringify(d.attachments[0].id)}`)} alt="Bon"/>`);
        } else {
          $$renderer2.push(`<!--[-1--><span class="cat svelte-1g4ojj8"${attr_style("", { background: "#999" })}>📄</span>`);
        }
        $$renderer2.push(`<!--]--> <div class="grow"><div class="ellipsis"><strong>${escape_html(ocr?.merchant ?? "Bon")}</strong></div> <div class="small muted">${escape_html(formatDate(d.date, { day: "numeric", month: "short" }))} · ${escape_html(people().get(d.payers[0]?.personId)?.name ?? "?")} `);
        if (ocr?.total) {
          $$renderer2.push(`<!--[0-->· erkannt ${escape_html(cur({ amount: ocr.total, currency: ocr.currency ?? currency() }))}`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div> <span class="small">Vervollständigen →</span></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (awaiting().length) {
      $$renderer2.push(`<!--[0--><h2 class="section svelte-1g4ojj8">💳 Abgebuchten Betrag nachtragen (${escape_html(awaiting().length)})</h2> <div class="list"><!--[-->`);
      const each_array_1 = ensure_array_like(awaiting());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let e = each_array_1[$$index_1];
        $$renderer2.push(`<form method="POST" action="?/charged" class="charge svelte-1g4ojj8"><input type="hidden" name="id"${attr("value", e.id)}/> <div class="grow"><a${attr("href", `${base()}/ausgaben/${stringify(e.id)}`)}><strong>${escape_html(e.title)}</strong></a> <div class="small muted">${escape_html(formatDate(e.date, { day: "numeric", month: "short" }))} · ${escape_html(cur(e))} · bisher ≈ ${escape_html(formatAmount(e.baseAmount, currency()))} (Tageskurs)</div></div> <input name="charged" inputmode="decimal"${attr("placeholder", currency())} class="charged svelte-1g4ojj8"${attr("aria-label", `Abgebucht in ${stringify(currency())}`)}/> <button class="small-btn primary svelte-1g4ojj8">OK</button></form>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (pending.length) {
      $$renderer2.push(`<!--[0--><div class="list pending svelte-1g4ojj8"><!--[-->`);
      const each_array_2 = ensure_array_like(pending);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let p = each_array_2[$$index_2];
        $$renderer2.push(`<div><span class="cat svelte-1g4ojj8"${attr_style("", { background: "#999" })}>⏳</span> <div class="grow"><div class="ellipsis"><strong>${escape_html(p.payload.title)}</strong></div> <div${attr_class(`small ${p.error ? "error" : "muted"}`)}>${escape_html(p.error ?? "Noch nicht übertragen – wartet auf Verbindung")}</div></div> <div class="right"><div class="amount">${escape_html(formatAmount(p.payload.amount, p.payload.currency))}</div> `);
        if (p.error) {
          $$renderer2.push(`<!--[0--><button class="link small danger">Verwerfen</button>`);
        } else {
          $$renderer2.push(`<!--[-1--><button class="link small">Jetzt senden</button>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.expenses.length > 8) {
      $$renderer2.push(`<!--[0--><input type="search" placeholder="Ausgaben durchsuchen …"${attr("value", query)} class="search svelte-1g4ojj8"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.expenses.length === 0 && pending.length === 0 && data.drafts.length === 0) {
      $$renderer2.push(`<!--[0--><div class="card"><p>Noch keine Ausgaben.</p> <p class="muted small">Tippe auf <strong>+</strong>, um eine Ausgabe einzutragen – oder auf <strong>📷</strong>, um einen Bon direkt im
			Laden zu fotografieren und die Ausgabe später zu vervollständigen.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array_3 = ensure_array_like(byDate());
    for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
      let [date, list] = each_array_3[$$index_4];
      $$renderer2.push(`<div class="date small muted svelte-1g4ojj8">${escape_html(formatDate(date, {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric"
      }))}</div> <div class="list"><!--[-->`);
      const each_array_4 = ensure_array_like(list);
      for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
        let e = each_array_4[$$index_3];
        const cat = e.categoryId ? cats().get(e.categoryId) : void 0;
        $$renderer2.push(`<a${attr("href", `${base()}/ausgaben/${stringify(e.id)}`)}><span class="cat svelte-1g4ojj8"${attr_style("", { background: cat?.color ?? "#999" })}>${escape_html(cat?.icon ?? "💶")}</span> <div class="grow"><div class="ellipsis"><strong>${escape_html(e.title)}</strong></div> <div class="small muted ellipsis">${escape_html(e.type === "income" ? "erhalten von" : "bezahlt von")}
						${escape_html(payerText(e))} `);
        if (e.privateAmount > 0) {
          $$renderer2.push(`<!--[0-->· ${escape_html(formatAmount(e.privateAmount, currency()))} privat`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (e.attachments.length) {
          $$renderer2.push(`<!--[0-->· 📎`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (e.awaitingCharge) {
          $$renderer2.push(`<!--[0-->· <span title="Abgebuchter Betrag fehlt noch">💳 Kurs vorläufig</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div> <div class="right"><div${attr_class("amount", void 0, { "positive": e.type === "income" })}>${escape_html(e.type === "income" ? "−" : "")}${escape_html(formatAmount(e.amount, e.currency))}</div> `);
        if (e.currency !== currency()) {
          $$renderer2.push(`<!--[0--><div class="small muted">≈ ${escape_html(formatAmount(e.baseAmount, currency()))}</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.group.status === "active") {
      $$renderer2.push(`<!--[0--><label class="button primary fab camera" aria-label="Bon fotografieren" title="Bon fotografieren – später vervollständigen">${escape_html("📷")} <input type="file" accept="image/*" capture="environment" hidden=""${attr("disabled", snapping, true)}/></label> <a class="button primary fab"${attr("href", `${base()}/ausgaben/neu`)} aria-label="Neue Ausgabe">+</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-DQX_5HUF.js.map

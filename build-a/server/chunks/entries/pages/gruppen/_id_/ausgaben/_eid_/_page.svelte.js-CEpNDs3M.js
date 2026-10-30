import { aa as head, a4 as attr, a7 as stringify, a6 as escape_html, a8 as attr_class, a9 as ensure_array_like, _ as derived } from '../../../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../../../../chunks/Avatar.js-BAGJaOlv.js';
import { E as ExpenseForm } from '../../../../../../chunks/ExpenseForm.js-Cgu2iNdt.js';
import { f as formatDate } from '../../../../../../chunks/format.js-Cn5c-OM3.js';
import { f as formatAmount } from '../../../../../../chunks/currency.js-B45uFFG3.js';
import '../../../../../../chunks/split.js-Diu3SqNm.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let editing = data.draft;
    const e = derived(() => data.expense);
    const base = derived(() => data.group.baseCurrency);
    const people = derived(() => new Map(data.members.map((m) => [m.personId, m])));
    const cat = derived(() => data.categories.find((c) => c.id === e().categoryId));
    const shareRows = derived(() => Object.entries(data.shares).filter(([, v]) => v !== 0).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])));
    const ruleText = derived(() => {
      const r = e().rule;
      const prof = data.profiles.find((p) => p.id === e().profileId);
      if (!r && prof) return `${prof.icon} ${prof.name}`;
      if (r?.type === "all" && r.tagFilter?.require?.length === 1 && !r.tagFilter.exclude?.length) return `Alle mit Merkmal „${r.tagFilter.require[0]}“`;
      if (r?.type === "all" && r.tagFilter?.exclude?.length === 1 && r.tagFilter.exclude[0] === "Kind" && !r.tagFilter.require?.length) return "Nur Erwachsene (ohne „Kind“)";
      if (!r || r.type === "all") return "Alle";
      const names = (ids) => ids.map((id) => people().get(id)?.name ?? "?").join(", ");
      if (r.type === "all_except") return `Alle außer ${names(r.excluded)}`;
      if (r.type === "only") return `Nur ${names(r.included)}`;
      return {
        shares: "Individuell nach Anteilen",
        percent: "Individuell in Prozent",
        amounts: "Individuelle Beträge"
      }[r.mode];
    });
    const actionLabels = {
      "expense.create": "angelegt",
      "expense.update": "geändert",
      "expense.delete": "gelöscht"
    };
    head("1w5kn0w", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(e().title)} · ${escape_html(data.group.name)}</title>`);
      });
    });
    $$renderer2.push(`<a${attr("href", `/gruppen/${stringify(data.group.id)}`)} class="small">← Zurück</a> `);
    if (editing) {
      $$renderer2.push(`<!--[0--><h2 style="margin-top: 0.75rem">${escape_html(data.draft ? "Vorbereitete Ausgabe vervollständigen" : "Ausgabe bearbeiten")}</h2> `);
      if (data.draft) {
        $$renderer2.push(`<!--[0--><p class="small muted">Fotografiert am ${escape_html(formatDate(e().date))}. Ergänze Betrag und Aufteilung – erst dann zählt die Ausgabe.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      ExpenseForm($$renderer2, {
        groupId: data.group.id,
        baseCurrency: base(),
        members: data.members,
        categories: data.categories,
        profiles: data.profiles,
        groupPeriod: { from: data.group.startDate, to: data.group.endDate },
        receiptRecognition: data.receiptRecognition,
        attachments: e().attachments,
        draft: data.draft,
        currencies: data.currencies,
        meId: data.user.id,
        initial: data.initial,
        error: form?.message
      });
      $$renderer2.push(`<!----> `);
      if (data.draft) {
        $$renderer2.push(`<!--[0--><div class="row" style="margin-top: 0.5rem"><a class="button grow"${attr("href", `/gruppen/${stringify(data.group.id)}`)}>Später</a> <form method="POST" action="?/delete"><button class="danger">Löschen</button></form></div>`);
      } else {
        $$renderer2.push(`<!--[-1--><button class="full" style="margin-top: 0.5rem">Abbrechen</button>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="card" style="margin-top: 0.75rem"><div class="row" style="justify-content: space-between; align-items: flex-start"><div><div class="small muted">${escape_html(cat() ? `${cat().icon} ${cat().name}` : "Ohne Kategorie")} · ${escape_html(formatDate(e().date))}</div> <h1 style="margin: 0.2rem 0">${escape_html(e().title)}</h1></div> <div class="right"><div${attr_class("amount big svelte-1w5kn0w", void 0, { "positive": e().type === "income" })}>${escape_html(formatAmount(e().amount, e().currency))}</div> `);
      if (e().currency !== base()) {
        $$renderer2.push(`<!--[0--><div class="small muted">≈ ${escape_html(formatAmount(e().baseAmount, base()))}</div> <div class="small muted">Kurs ${escape_html(e().rate.toLocaleString("de-DE", { maximumFractionDigits: 5 }))}
						(${escape_html({
          ecb: "EZB",
          manual: "manuell",
          charged: "abgebucht",
          none: ""
        }[e().rateSource])})`);
        if (e().rateProvisional) {
          $$renderer2.push(`<!--[0-->, vorläufig`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (e().type === "income") {
        $$renderer2.push(`<!--[0--><p class="badge">Einnahme / Erstattung</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <h3 style="margin-top: 1rem">${escape_html(e().type === "income" ? "Erhalten von" : "Bezahlt von")}</h3> <!--[-->`);
      const each_array = ensure_array_like(e().payers);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let p = each_array[$$index];
        const m = people().get(p.personId);
        $$renderer2.push(`<div class="row person svelte-1w5kn0w">`);
        Avatar($$renderer2, {
          name: m?.name ?? "?",
          color: m?.color,
          url: m?.avatarUrl,
          size: 28
        });
        $$renderer2.push(`<!----> <span class="grow">${escape_html(m?.name ?? "Ehemaliges Mitglied")}</span> <span class="amount">${escape_html(formatAmount(p.amount, e().currency))}</span></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (e().privateAmount > 0) {
        $$renderer2.push(`<!--[0--><p class="small muted">davon privat (nicht geteilt): ${escape_html(formatAmount(e().privateAmount, base()))}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <h3 style="margin-top: 1rem">Aufteilung: ${escape_html(ruleText())}`);
      if (e().rule?.equalWeights) {
        $$renderer2.push(`<!--[0--> · alle gleich gewichtet`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></h3> `);
      if (e().periodFrom && e().periodTo) {
        $$renderer2.push(`<!--[0--><p class="small muted">nach Aufenthalt, ${escape_html(formatDate(e().periodFrom))} – ${escape_html(formatDate(e().periodTo))}, gezählt in ${escape_html(e().periodUnit === "nights" ? "Nächten (Abreisetag zählt nicht)" : "Tagen (An- und Abreisetag zählen)")}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_1 = ensure_array_like(shareRows());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let [personId, amount] = each_array_1[$$index_1];
        const m = people().get(personId);
        $$renderer2.push(`<div class="row person svelte-1w5kn0w">`);
        Avatar($$renderer2, {
          name: m?.name ?? "?",
          color: m?.color,
          url: m?.avatarUrl,
          size: 28
        });
        $$renderer2.push(`<!----> <span class="grow">${escape_html(m?.name ?? "Ehemaliges Mitglied")} `);
        if (data.factors[personId]) {
          $$renderer2.push("<!--[0-->");
          const f = data.factors[personId];
          $$renderer2.push(`<span class="badge"${attr("title", `Faktor ${stringify(String(f.value).replace(".", ","))}: ${stringify(f.source)}`)}>×${escape_html(String(f.value).replace(".", ","))}</span> <span class="small muted">${escape_html(f.source)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></span> <span class="amount">${escape_html(formatAmount(Math.abs(amount), base()))}</span></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (e().attachments.length) {
        $$renderer2.push(`<!--[0--><h3 style="margin-top: 1rem">Belege</h3> <div class="receipts svelte-1w5kn0w"><!--[-->`);
        const each_array_2 = ensure_array_like(e().attachments);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let a = each_array_2[$$index_2];
          $$renderer2.push(`<a${attr("href", `/belege/${stringify(a.id)}`)} target="_blank" rel="noopener" class="receipt svelte-1w5kn0w">`);
          if (a.mime.startsWith("image/")) {
            $$renderer2.push(`<!--[0--><img${attr("src", `/belege/${stringify(a.id)}`)} alt="Beleg" class="svelte-1w5kn0w"/>`);
          } else {
            $$renderer2.push(`<!--[-1-->📄 PDF`);
          }
          $$renderer2.push(`<!--]--></a>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (e().notes) {
        $$renderer2.push(`<!--[0--><h3 style="margin-top: 1rem">Notiz</h3> <p style="white-space: pre-wrap">${escape_html(e().notes)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (data.frozen) {
        $$renderer2.push(`<!--[0--><p class="notice small">🔒 Diese Ausgabe gehört zur abgeschlossenen Abrechnung und kann nicht mehr geändert werden.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (form?.message && !editing) {
        $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (data.canEdit) {
        $$renderer2.push(`<!--[0--><div class="row"><button class="primary grow">Bearbeiten</button> <form method="POST" action="?/delete"><button class="danger">Löschen</button></form></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (data.history.length) {
        $$renderer2.push(`<!--[0--><div class="small muted" style="margin-top: 1rem"><!--[-->`);
        const each_array_3 = ensure_array_like(data.history);
        for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
          let h = each_array_3[i];
          $$renderer2.push(`<div>${escape_html(people().get(h.personId ?? "")?.name ?? "Jemand")} hat die Ausgabe ${escape_html(actionLabels[h.action] ?? h.action)}
					· ${escape_html(new Date(h.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }))}</div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-CEpNDs3M.js.map

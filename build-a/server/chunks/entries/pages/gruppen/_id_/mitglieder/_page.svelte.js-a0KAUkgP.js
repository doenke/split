import { aa as head, a6 as escape_html, a4 as attr, a8 as attr_class, a9 as ensure_array_like, a7 as stringify, _ as derived } from '../../../../../chunks/index.js-BT3kaB_g.js';
import { N as NameFields } from '../../../../../chunks/NameFields.js-C3lAxubW.js';
import { K as KasseSwitchDialog } from '../../../../../chunks/KasseSwitchDialog.js-CcYeHW3P.js';
import '../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../chunks/state.svelte.js-aCWhrotV.js';
import { p as page } from '../../../../../chunks/index2.js-OgeU73zK.js';
import { A as Avatar } from '../../../../../chunks/Avatar.js-BAGJaOlv.js';
import { T as TagInput } from '../../../../../chunks/TagInput.js-Cd0y57Qx.js';
import { f as formatDate } from '../../../../../chunks/format.js-Cn5c-OM3.js';
import { h as html } from '../../../../../chunks/html.js-CevvQr0N.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const claimed = derived(() => new Set(data.claimed));
    const hasExpenses = derived(() => data.expenses.length > 0);
    let adding = page.url.searchParams.has("neu");
    let addMode = "new";
    const canEdit = (personId) => data.isAdmin || personId === data.user?.id || (data.kassenByPerson[personId] ?? []).some((k) => data.managedKassen.includes(k.id));
    let join = "all";
    let editing = null;
    const invite = derived(() => form && "invite" in form ? form.invite : null);
    const factorLabel = (f) => String(f).replace(".", ",");
    const tagSuggestions = derived(() => [
      .../* @__PURE__ */ new Set([
        "Kind",
        "Erwachsen",
        ...data.members.flatMap((m) => m.tags),
        ...data.profiles.flatMap((p) => [
          ...p.rule.tagFilter?.require ?? [],
          ...p.rule.tagFilter?.exclude ?? []
        ])
      ])
    ]);
    head("xza0m5", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Mitglieder · ${escape_html(data.group.name)}</title>`);
      });
    });
    if (page.url.searchParams.has("neu")) {
      $$renderer2.push(`<!--[0--><div class="notice">🎉 Gruppe angelegt! Füge jetzt alle Mitreisenden hinzu – auch Kinder oder Personen ohne Smartphone.
		Wer selbst mitmachen soll, bekommt danach einen persönlichen Link.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    KasseSwitchDialog($$renderer2, { switched: form && "switched" in form ? form.switched : [] });
    $$renderer2.push(`<!----> `);
    if (form && "message" in form && form.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (invite()) {
      $$renderer2.push("<!--[0-->");
      const m = data.members.find((x) => x.personId === invite().personId);
      $$renderer2.push(`<div class="card invite svelte-xza0m5"><h2>Zugangslink für ${escape_html(m?.name)}</h2> <p class="small muted">Schicke ihn z.B. per Messenger oder lass den QR-Code scannen. Der Link ist der persönliche Schlüssel von
			${escape_html(m?.name)}: Er funktioniert immer wieder und gilt 90 Tage ab der letzten Nutzung. Ein neuer Link ersetzt ihn.</p> <div class="qr svelte-xza0m5">${html(invite().qr)}</div> <input readonly=""${attr("value", invite().url)}/> <button class="primary full" style="margin-top: 0.5rem">${escape_html("Link teilen")}</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.isAdmin) {
      $$renderer2.push(`<!--[0--><details class="card"${attr("open", !!form && "groupLinkCreated" in form, true)}><summary><strong>🔗 Einladungslink für die ganze Gruppe</strong></summary> <p class="small muted" style="margin-top: 0.5rem">Ein Link für alle, z.B. für den Gruppenchat: Wer ihn öffnet, wählt „Wer bist du?“ aus den noch nicht
			angemeldeten Personen oder trägt sich neu ein. Achtung: Jeder mit dem Link kann beitreten.</p> `);
      if (data.groupLink) {
        $$renderer2.push(`<!--[0--><div class="center svelte-xza0m5"><div class="qr svelte-xza0m5">${html(data.groupLink.qr)}</div></div> <input readonly=""${attr("value", data.groupLink.url)}/> <p class="hint">Gültig bis ${escape_html(formatDate(data.groupLink.expiresAt.slice(0, 10)))}.</p> <div class="row"><button class="primary grow">${escape_html("Link teilen")}</button> <form method="POST" action="?/revokeGroupLink"><button class="danger">Deaktivieren</button></form></div> <form method="POST" action="?/groupLink" style="margin-top: 0.5rem"><button class="link small">Neuen Link erzeugen (alter wird ungültig)</button></form>`);
      } else {
        $$renderer2.push(`<!--[-1--><form method="POST" action="?/groupLink"><button class="primary full">Gruppenlink erstellen</button></form>`);
      }
      $$renderer2.push(`<!--]--></details>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="row" style="justify-content: space-between"><h2>${escape_html(data.members.length)} Mitglieder</h2> `);
    if (data.canAddPeople && !adding) {
      $$renderer2.push(`<!--[0--><button class="primary">+ Person</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (adding) {
      $$renderer2.push(`<!--[0--><form method="POST"${attr("action", "?/add")} class="card">`);
      if (data.known.length || data.myKassen.length) {
        $$renderer2.push(`<!--[0--><div class="segmented" style="margin-bottom: 0.75rem"><button type="button"${attr_class("", void 0, { "active": addMode === "new" })}>Neue Person</button> `);
        if (data.known.length) {
          $$renderer2.push(`<!--[0--><button type="button"${attr_class("", void 0, { "active": addMode === "known" })}>Bekannte Person</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (data.myKassen.length) {
          $$renderer2.push(`<!--[0--><button type="button"${attr_class("", void 0, { "active": addMode === "kasse" })}>Ganze Kasse</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[1-->");
        NameFields($$renderer2, {});
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push(`<!--[0--><div class="field"><label for="factor">Faktor</label> <input id="factor" name="factor" value="1" inputmode="decimal" style="width: 6rem"/> <p class="hint">Gewichtung bei „Alle“-Ausgaben, z.B. 0,5 für ein Kind oder 0 für ein Kleinkind.</p></div> <div class="field"><span class="label svelte-xza0m5">Merkmale</span> <!---->`);
        {
          TagInput($$renderer2, { suggestions: tagSuggestions() });
        }
        $$renderer2.push(`<!----> <p class="hint">Profile wie „Alkohol“ nutzen Merkmale, z.B. werden Personen mit „Kind“ dort nicht beteiligt.</p></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (hasExpenses()) {
        $$renderer2.push(`<!--[0--><fieldset class="field svelte-xza0m5"><legend class="svelte-xza0m5">An bisherigen Ausgaben beteiligen?</legend> <label class="check"><input type="radio" name="join" value="all"${attr("checked", join === "all", true)}/> Ja, an allen „Alle“-Ausgaben</label> <label class="check"><input type="radio" name="join" value="today"${attr("checked", join === "today", true)}/> Erst ab heute</label> <label class="check"><input type="radio" name="join" value="date"${attr("checked", join === "date", true)}/> Ab Datum</label> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></fieldset>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="row"><button class="primary grow">Hinzufügen</button> <button type="button">Fertig</button></div></form>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="list"><!--[-->`);
    const each_array_2 = ensure_array_like(data.members);
    for (let $$index_4 = 0, $$length = each_array_2.length; $$index_4 < $$length; $$index_4++) {
      let m = each_array_2[$$index_4];
      $$renderer2.push(`<div${attr_class("member svelte-xza0m5", void 0, { "open": editing === m.personId })}><div class="row top svelte-xza0m5">`);
      Avatar($$renderer2, { name: m.name, color: m.color, url: m.avatarUrl, size: 38 });
      $$renderer2.push(`<!----> <div class="grow"><div class="badges svelte-xza0m5"><strong>${escape_html(m.name)}</strong> `);
      if (m.personId === data.user?.id) {
        $$renderer2.push(`<!--[0--><span class="badge">du</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (m.role === "admin") {
        $$renderer2.push(`<!--[0--><span class="badge">Admin</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (m.doneAt) {
        $$renderer2.push(`<!--[0--><span class="badge done svelte-xza0m5" title="hat alles eingetragen">✔ fertig</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_3 = ensure_array_like(m.tags);
      for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
        let t = each_array_3[$$index_2];
        $$renderer2.push(`<span class="badge tagbadge svelte-xza0m5">${escape_html(t)}</span>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="small muted">`);
      if (claimed().has(m.personId)) {
        $$renderer2.push(`<!--[0-->angemeldet`);
      } else {
        $$renderer2.push(`<!--[-1-->ohne Login`);
      }
      $$renderer2.push(`<!--]--> `);
      if (m.factor !== 1) {
        $$renderer2.push(`<!--[0-->· Faktor ${escape_html(factorLabel(m.factor))}`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (m.participationFrom || m.participationTo) {
        $$renderer2.push(`<!--[0-->· ${escape_html(m.participationFrom ? formatDate(m.participationFrom, { day: "numeric", month: "short" }) : "…")}
							– ${escape_html(m.participationTo ? formatDate(m.participationTo, { day: "numeric", month: "short" }) : "…")}`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (!m.kassePersonal) {
        $$renderer2.push(`<!--[0-->· Kasse ${escape_html(m.kasseName)}`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (canEdit(m.personId)) {
        $$renderer2.push(`<!--[0--><button class="link">${escape_html(editing === m.personId ? "Schließen" : "Bearbeiten")}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (editing === m.personId) {
        $$renderer2.push(`<!--[0--><form method="POST" action="?/update" class="edit svelte-xza0m5"><input type="hidden" name="personId"${attr("value", m.personId)}/> `);
        if (data.isAdmin && !claimed().has(m.personId)) {
          $$renderer2.push(`<!--[0--><div class="field"><label${attr("for", `n-${stringify(m.personId)}`)}>Name</label> <input${attr("id", `n-${stringify(m.personId)}`)} name="name"${attr("value", m.name)}/></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="row"><div class="field" style="width: 6rem"><label${attr("for", `f-${stringify(m.personId)}`)}>Faktor</label> <input${attr("id", `f-${stringify(m.personId)}`)} name="factor"${attr("value", factorLabel(m.factor))} inputmode="decimal"/></div> <div class="field grow"><label${attr("for", `from-${stringify(m.personId)}`)}>Dabei ab (Anreise)</label> <input${attr("id", `from-${stringify(m.personId)}`)} type="date" name="from"${attr("value", m.participationFrom ?? "")}/></div> <div class="field grow"><label${attr("for", `to-${stringify(m.personId)}`)}>Dabei bis (Abreise)</label> <input${attr("id", `to-${stringify(m.personId)}`)} type="date" name="to"${attr("value", m.participationTo ?? "")}/></div></div> <p class="hint" style="margin-top: -0.5rem">Leer = die ganze Zeit. Bei Aufteilung nach Nächten zählt der Abreisetag nicht mit, nach Tagen schon. Änderungen wirken sich auf alle „Alle“-Ausgaben aus.</p> <div class="field"><span class="label svelte-xza0m5">Merkmale</span> `);
        TagInput($$renderer2, { value: m.tags, suggestions: tagSuggestions() });
        $$renderer2.push(`<!----></div> `);
        if ((data.kassenByPerson[m.personId] ?? []).length) {
          $$renderer2.push(`<!--[0--><div class="field"><label${attr("for", `k-${stringify(m.personId)}`)}>Rechnet ab über</label> <select${attr("id", `k-${stringify(m.personId)}`)} name="kasseId">`);
          $$renderer2.option({ value: "personal", selected: !!m.kassePersonal }, ($$renderer3) => {
            $$renderer3.push(`sich allein`);
          });
          $$renderer2.push(`<!--[-->`);
          const each_array_4 = ensure_array_like(data.kassenByPerson[m.personId]);
          for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
            let k = each_array_4[$$index_3];
            $$renderer2.option({ value: k.id, selected: k.id === m.kasseId }, ($$renderer3) => {
              $$renderer3.push(`Kasse ${escape_html(k.name)}`);
            });
          }
          $$renderer2.push(`<!--]--></select></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (data.isAdmin) {
          $$renderer2.push(`<!--[0--><label class="check"><input type="checkbox" name="role" value="admin"${attr("checked", m.role === "admin", true)}/> Gruppenadmin</label> <input type="hidden" name="role" value="member"/>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="row" style="margin-top: 0.5rem"><button class="primary grow">Speichern</button></div></form> <div class="row actions svelte-xza0m5">`);
        if (data.canAddPeople && m.personId !== data.user?.id) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/invite"><input type="hidden" name="personId"${attr("value", m.personId)}/> <button>🔗 ${escape_html(claimed().has(m.personId) ? "Neuen Zugangslink" : "Zugangslink erstellen")}</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (data.isAdmin && m.personId !== data.user?.id) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/remove"><input type="hidden" name="personId"${attr("value", m.personId)}/> <button class="danger">Entfernen</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else if (data.canAddPeople && !claimed().has(m.personId)) {
        $$renderer2.push(`<!--[1--><form method="POST" action="?/invite" class="inline-invite svelte-xza0m5"><input type="hidden" name="personId"${attr("value", m.personId)}/> <button class="link small">🔗 Zugangslink erstellen</button></form>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-a0KAUkgP.js.map

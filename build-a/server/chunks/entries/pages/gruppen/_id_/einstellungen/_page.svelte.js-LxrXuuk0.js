import { aa as head, a6 as escape_html, a4 as attr, a7 as stringify, a9 as ensure_array_like, _ as derived } from '../../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../chunks/state.svelte.js-aCWhrotV.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const s = derived(() => data.group.settings);
    const people = derived(() => new Map(data.members.map((m) => [m.personId, m.name])));
    const actions = {
      "group.create": "hat die Gruppe angelegt",
      "group.update": "hat die Einstellungen geändert",
      "member.add": "hat eine Person hinzugefügt",
      "member.update": "hat ein Mitglied bearbeitet",
      "member.remove": "hat eine Person entfernt",
      "expense.create": "hat eine Ausgabe eingetragen",
      "expense.update": "hat eine Ausgabe geändert",
      "expense.delete": "hat eine Ausgabe gelöscht",
      "settlement.create": "hat eine Zahlung eingetragen",
      "settlement.confirm": "hat eine Zahlung bestätigt",
      "settlement.delete": "hat eine Zahlung gelöscht",
      "profile.save": "hat ein Profil gespeichert",
      "profile.delete": "hat ein Profil gelöscht",
      "expense.restore": "hat eine Ausgabe wiederhergestellt",
      "settlement.restore": "hat eine Zahlung wiederhergestellt",
      "group.restore": "hat die Gruppe wiederhergestellt",
      "group.link": "hat einen Gruppenlink erstellt",
      "group.close": "hat die Abrechnung abgeschlossen",
      "group.reopen": "hat die Abrechnung wieder geöffnet",
      "settlement.remind": "hat an eine Zahlung erinnert",
      "member.done": "hat abgeschlossen",
      "member.undone": "trägt doch noch etwas ein",
      "group.final": "hat als Letzte(r) abgeschlossen – die Endabrechnung steht"
    };
    head("oddju6", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Einstellungen · ${escape_html(data.group.name)}</title>`);
      });
    });
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.saved) {
      $$renderer2.push(`<!--[0--><p class="positive">✔ Gespeichert</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.isAdmin) {
      $$renderer2.push(`<!--[0--><form method="POST" action="?/save" class="card"><div class="row"><div class="field" style="width: 4.5rem"><label for="emoji">Symbol</label> <input id="emoji" name="emoji"${attr("value", data.group.emoji)} maxlength="4"/></div> <div class="field grow"><label for="name">Name</label> <input id="name" name="name"${attr("value", data.group.name)} required=""/></div></div> <div class="row"><div class="field grow"><label for="startDate">Von</label> <input id="startDate" type="date" name="startDate"${attr("value", data.group.startDate ?? "")}/></div> <div class="field grow"><label for="endDate">Bis</label> <input id="endDate" type="date" name="endDate"${attr("value", data.group.endDate ?? "")}/></div></div> <div class="field"><span class="label svelte-oddju6">Währung</span> <div>${escape_html(data.group.baseCurrency)}</div></div> <label class="check"><input type="checkbox" name="simplifyDebts"${attr("checked", s().simplifyDebts, true)}/> Schulden vereinfachen (möglichst wenige Überweisungen)</label> <p class="hint" style="margin: -0.2rem 0 0.5rem 1.6rem">Aus: Jeder zahlt direkt an die, die für ihn ausgelegt haben.</p> <label class="check"><input type="checkbox" name="membersCanAddPeople"${attr("checked", s().membersCanAddPeople, true)}/> Alle Mitglieder dürfen Personen hinzufügen</label> <div class="field" style="margin-top: 0.5rem"><label for="editOthers">Ausgaben anderer bearbeiten dürfen</label> <select id="editOthers" name="editOthers">`);
      $$renderer2.option({ value: "all", selected: s().editOthers === "all" }, ($$renderer3) => {
        $$renderer3.push(`alle Mitglieder`);
      });
      $$renderer2.option({ value: "admins", selected: s().editOthers === "admins" }, ($$renderer3) => {
        $$renderer3.push(`nur Ersteller und Admins`);
      });
      $$renderer2.push(`</select></div> <div class="field"><label for="status">Status</label> <select id="status" name="status">`);
      $$renderer2.option({ value: "active", selected: data.group.status === "active" }, ($$renderer3) => {
        $$renderer3.push(`aktiv`);
      });
      $$renderer2.option({ value: "settled", selected: data.group.status === "settled" }, ($$renderer3) => {
        $$renderer3.push(`abgerechnet`);
      });
      $$renderer2.option(
        {
          value: "archived",
          selected: data.group.status === "archived"
        },
        ($$renderer3) => {
          $$renderer3.push(`archiviert`);
        }
      );
      $$renderer2.push(`</select></div> <button class="primary full">Speichern</button></form>`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="card small muted">Nur Gruppenadmins können die Einstellungen ändern.</div>`);
    }
    $$renderer2.push(`<!--]--> <form method="POST" action="?/toggleMute" class="card row"><span class="grow">${escape_html(data.muted ? "🔕 Benachrichtigungen für diese Gruppe sind aus" : "🔔 Benachrichtigungen für diese Gruppe sind an")}</span> <button>${escape_html(data.muted ? "Einschalten" : "Stummschalten")}</button></form> <div class="card"><h2>Abrechnung &amp; Export</h2> <div class="row" style="margin-bottom: 0.75rem"><a class="button grow"${attr("href", `/gruppen/${stringify(data.group.id)}/abrechnung`)}>📄 Abrechnung (PDF)</a> <a class="button grow"${attr("href", `/gruppen/${stringify(data.group.id)}/export.csv`)} download="">📊 CSV</a></div> `);
    if (data.group.closedUntil) {
      $$renderer2.push(`<!--[0--><p class="small">🔒 Abgeschlossen bis <strong>${escape_html(data.group.closedUntil)}</strong>. Ausgaben bis dahin ändern sich nicht mehr, auch wenn Personen oder Faktoren geändert werden.</p> `);
      if (data.isAdmin) {
        $$renderer2.push(`<!--[0--><form method="POST" action="?/reopen"><button class="full">Wieder öffnen</button></form>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else if (data.isAdmin) {
      $$renderer2.push(`<!--[1--><form method="POST" action="?/close"><p class="small muted">Schreibt die Anteile aller Ausgaben bis zum Stichtag fest – z.B. nach der Reise, bevor ausgeglichen wird.</p> <div class="row"><input type="date" name="until"${attr("value", data.group.endDate ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10))} class="grow" style="width: auto"/> <button>Abschließen</button></div></form>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form && "failed" in form && form.failed?.length) {
      $$renderer2.push(`<!--[0--><p class="error small">Nicht aufteilbar und daher nicht festgeschrieben: ${escape_html(form.failed.join(", "))}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.user?.isOidc) {
      $$renderer2.push(`<!--[0--><a class="button full"${attr("href", `/gruppen/neu?vorlage=${stringify(data.group.id)}`)} style="margin-bottom: 1rem">📋 Neue Gruppe mit dieser als Vorlage</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <a class="button full"${attr("href", `/gruppen/${stringify(data.group.id)}/papierkorb`)} style="margin-bottom: 1rem">🗑️ Papierkorb</a> <h2>Verlauf</h2> <div class="list small"><!--[-->`);
    const each_array = ensure_array_like(data.log);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let l = each_array[$$index];
      $$renderer2.push(`<div><span class="grow">${escape_html(people().get(l.personId ?? "") ?? "Jemand")} ${escape_html(actions[l.action] ?? l.action)}`);
      if (l.data && typeof l.data === "object" && "title" in l.data) {
        $$renderer2.push(`<!--[0-->: ${escape_html(l.data.title)}`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></span> <span class="muted">${escape_html(new Date(l.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }))}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.isAdmin) {
      $$renderer2.push(`<!--[0--><details class="card"><summary class="negative">Gruppe löschen</summary> <form method="POST" action="?/delete" style="margin-top: 0.75rem"><p class="small">Die Gruppe kommt für 30 Tage in den Papierkorb (wiederherstellbar über „Meine Gruppen“). Gib zur Bestätigung den Namen der Gruppe ein: <strong>${escape_html(data.group.name)}</strong></p> <input name="confirm" autocomplete="off"/> <button class="danger full" style="margin-top: 0.5rem">Endgültig löschen</button></form></details>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-LxrXuuk0.js.map

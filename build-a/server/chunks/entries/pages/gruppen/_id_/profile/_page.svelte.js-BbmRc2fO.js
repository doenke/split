import { aa as head, a6 as escape_html, a9 as ensure_array_like, a4 as attr, _ as derived, a7 as stringify, a8 as attr_class } from '../../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../chunks/state.svelte.js-aCWhrotV.js';
import { T as TagInput } from '../../../../../chunks/TagInput.js-Cd0y57Qx.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let editing = null;
    const cats = derived(() => new Map(data.categories.map((c) => [c.id, c])));
    const tagSuggestions = derived(() => [
      .../* @__PURE__ */ new Set(["Kind", "Erwachsen", ...data.members.flatMap((m) => m.tags)])
    ]);
    const names = derived(() => new Map(data.members.map((m) => [m.personId, m.name])));
    const fmt = (n) => String(n).replace(".", ",");
    function describe(rule) {
      if (rule.type === "only") {
        const f = rule.factorOverrides?.persons ?? {};
        return rule.included.map((id) => `${names().get(id) ?? "?"}${f[id] !== void 0 ? ` ×${fmt(f[id])}` : ""}`).join(", ") || "niemand";
      }
      const parts = [];
      if (rule.tagFilter?.require?.length) parts.push(`nur mit ${rule.tagFilter.require.join(", ")}`);
      if (rule.tagFilter?.exclude?.length) parts.push(`ohne ${rule.tagFilter.exclude.join(", ")}`);
      for (const [t, v] of Object.entries(rule.factorOverrides?.tags ?? {})) {
        parts.push(`${t} zählt ${String(v).replace(".", ",")}`);
      }
      return parts.length ? `Alle, ${parts.join(" · ")}` : "Alle (Standard-Faktoren)";
    }
    function membersFor(rule) {
      if (rule.type === "only") return data.members.filter((m) => rule.included.includes(m.personId));
      return data.members.filter((m) => {
        if (rule.tagFilter?.require?.some((t) => !m.tags.includes(t))) return false;
        if (rule.tagFilter?.exclude?.some((t) => m.tags.includes(t))) return false;
        return true;
      });
    }
    let overrides = [];
    let mode = "tags";
    function editor($$renderer3, p) {
      $$renderer3.push(`<form method="POST" action="?/save" class="edit svelte-3znz5e"><input type="hidden" name="id"${attr("value", p?.id ?? "")}/> <div class="row"><div class="field" style="width: 4.5rem"><label${attr("for", `icon-${stringify(p?.id)}`)}>Symbol</label> <input${attr("id", `icon-${stringify(p?.id)}`)} name="icon"${attr("value", p?.icon ?? "🏷️")} maxlength="4"/></div> <div class="field grow"><label${attr("for", `name-${stringify(p?.id)}`)}>Name</label> <input${attr("id", `name-${stringify(p?.id)}`)} name="name"${attr("value", p?.name ?? "")} required="" placeholder="z.B. Alkohol"/></div></div> <input type="hidden" name="mode"${attr("value", mode)}/> <div class="segmented" style="margin-bottom: 0.75rem"><button type="button"${attr_class("", void 0, { "active": mode === "persons" })}>Bestimmte Personen</button> <button type="button"${attr_class("", void 0, { "active": mode === "tags" })}>Nach Merkmalen</button></div> `);
      {
        $$renderer3.push(`<!--[-1--><div class="field"><span class="label svelte-3znz5e">Nur Personen mit Merkmal</span> `);
        TagInput($$renderer3, {
          name: "require",
          value: p?.rule.tagFilter?.require ?? [],
          suggestions: tagSuggestions()
        });
        $$renderer3.push(`<!----></div> <div class="field"><span class="label svelte-3znz5e">Personen mit diesem Merkmal ausnehmen</span> `);
        TagInput($$renderer3, {
          name: "exclude",
          value: p?.rule.tagFilter?.exclude ?? [],
          suggestions: tagSuggestions()
        });
        $$renderer3.push(`<!----></div> <div class="field"><span class="label svelte-3znz5e">Abweichende Faktoren</span> <!--[-->`);
        const each_array_1 = ensure_array_like(overrides);
        for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
          let o = each_array_1[i];
          $$renderer3.push(`<div class="row" style="margin-bottom: 0.4rem"><input name="overrideTag"${attr("value", o.tag)} placeholder="Merkmal, z.B. Kind" class="grow" style="width: auto" list="tags"/> <input name="overrideFactor"${attr("value", o.factor)} inputmode="decimal" style="width: 5rem" placeholder="1"/> <button type="button" class="link danger">✕</button></div>`);
        }
        $$renderer3.push(`<!--]--> <button type="button" class="link">+ Faktor für ein Merkmal</button> <p class="hint">Z.B. „Kind = 1“ bei der Unterkunft: Kinder zahlen hier voll, obwohl ihr Standard-Faktor 0,5 ist.</p></div>`);
      }
      $$renderer3.push(`<!--]--> <div class="field"><label${attr("for", `cat-${stringify(p?.id)}`)}>Kategorie vorschlagen</label> <select${attr("id", `cat-${stringify(p?.id)}`)} name="defaultCategoryId">`);
      $$renderer3.option({ value: "" }, ($$renderer4) => {
        $$renderer4.push(`–`);
      });
      $$renderer3.push(`<!--[-->`);
      const each_array_2 = ensure_array_like(data.categories);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let c = each_array_2[$$index_2];
        $$renderer3.option({ value: c.id, selected: c.id === p?.defaultCategoryId }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(c.icon)} ${escape_html(c.name)}`);
        });
      }
      $$renderer3.push(`<!--]--></select></div> <div class="row"><button class="primary grow">Speichern</button> <button type="button">Abbrechen</button></div></form>`);
    }
    head("3znz5e", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Profile · ${escape_html(data.group.name)}</title>`);
      });
    });
    $$renderer2.push(`<h2>Ausgaben-Profile</h2> <p class="small muted">Profile sind Vorlagen für wiederkehrende Aufteilungen, z.B. „Mietwagen“ nur für die Mitfahrer – mit <strong>bestimmten Personen</strong> und auf Wunsch eigenen Faktoren. Beim Erfassen einer Ausgabe wählst du das
	Profil mit einem Tipp.</p> `);
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <datalist id="tags"><!--[-->`);
    const each_array_3 = ensure_array_like(tagSuggestions());
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let t = each_array_3[$$index_3];
      $$renderer2.option({ value: t }, ($$renderer3) => {
      });
    }
    $$renderer2.push(`<!--]--></datalist> <div class="list">`);
    const each_array_4 = ensure_array_like(data.profiles);
    if (each_array_4.length !== 0) {
      $$renderer2.push("<!--[-->");
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let p = each_array_4[$$index_4];
        $$renderer2.push(`<div class="profile svelte-3znz5e"><div class="row top svelte-3znz5e"><span class="icon svelte-3znz5e">${escape_html(p.icon)}</span> <div class="grow"><strong>${escape_html(p.name)}</strong> <div class="small muted">${escape_html(describe(p.rule))}`);
        if (p.defaultCategoryId && cats().get(p.defaultCategoryId)) {
          $$renderer2.push(`<!--[0-->${escape_html(` · ${cats().get(p.defaultCategoryId)?.name}`)}`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="small muted">Derzeit: ${escape_html(membersFor(p.rule).map((m) => m.name).join(", ") || "niemand")}</div></div> `);
        if (data.isAdmin && editing !== p.id) {
          $$renderer2.push(`<!--[0--><button class="link">Bearbeiten</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> `);
        if (editing === p.id) {
          $$renderer2.push("<!--[0-->");
          editor($$renderer2, p);
          $$renderer2.push(`<!----> <form method="POST" action="?/delete"><input type="hidden" name="id"${attr("value", p.id)}/> <button class="link danger small">Profil löschen</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
    } else {
      $$renderer2.push(`<!--[!--><div class="muted small">Noch keine Profile.</div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.isAdmin) {
      $$renderer2.push("<!--[0-->");
      {
        $$renderer2.push(`<!--[-1--><button class="primary full">+ Neues Profil</button>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-BbmRc2fO.js.map

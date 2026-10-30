import { aa as head, a6 as escape_html, a4 as attr, a9 as ensure_array_like, a8 as attr_class, _ as derived } from '../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../../chunks/Avatar.js-BAGJaOlv.js';
import { f as formatDate } from '../../../../chunks/format.js-Cn5c-OM3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let query = "";
    let showInactive = true;
    const filtered = derived(() => data.persons.filter((p) => !query.trim() || `${p.name} ${p.email ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())));
    const inactive = derived(() => data.persons.filter((p) => p.deactivatedAt).length);
    head("1ah2rv7", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Personen · Split</title>`);
      });
    });
    $$renderer2.push(`<a href="/profil" class="small">← Profil</a> <h1>Personen</h1> <p class="muted small">Deaktivierte Personen werden nirgends mehr als „bekannte Person“ angeboten. In ihren Gruppen und Kassen bleiben sie
	mit allen Ausgaben und Salden erhalten.</p> `);
    if (form && "message" in form && form.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="row" style="margin-bottom: 0.75rem"><input type="search"${attr("value", query)} placeholder="Suchen …" class="grow" style="width: auto" aria-label="Personen suchen"/> <label class="check small"><input type="checkbox"${attr("checked", showInactive, true)}/> Deaktivierte (${escape_html(inactive())})</label></div> <div class="list">`);
    const each_array = ensure_array_like(filtered());
    if (each_array.length !== 0) {
      $$renderer2.push("<!--[-->");
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let p = each_array[$$index];
        $$renderer2.push(`<div${attr_class("svelte-1ah2rv7", void 0, { "inactive": p.deactivatedAt })}>`);
        Avatar($$renderer2, { name: p.name, color: p.color, url: p.avatarUrl, size: 34 });
        $$renderer2.push(`<!----> <div class="grow"><div class="ellipsis"><strong>${escape_html(p.name)}</strong>`);
        if (p.id === data.user?.id) {
          $$renderer2.push(`<!--[0--><span class="badge">du</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
        if (p.isAdmin) {
          $$renderer2.push(`<!--[0--><span class="badge">Admin</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="small muted ellipsis">${escape_html(p.access)} · ${escape_html(p.groups)} ${escape_html(p.groups === 1 ? "Gruppe" : "Gruppen")}`);
        if (p.email) {
          $$renderer2.push(`<!--[0-->· ${escape_html(p.email)}`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (p.deactivatedAt) {
          $$renderer2.push(`<!--[0-->· deaktiviert seit ${escape_html(formatDate(p.deactivatedAt.slice(0, 10)))}`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div> `);
        if (p.id !== data.user?.id) {
          $$renderer2.push(`<!--[0--><form method="POST" action="?/toggle"><input type="hidden" name="id"${attr("value", p.id)}/> <input type="hidden" name="deactivate"${attr("value", p.deactivatedAt ? "0" : "1")}/> <button${attr_class("small-btn svelte-1ah2rv7", void 0, { "primary": !!p.deactivatedAt })}>${escape_html(p.deactivatedAt ? "Aktivieren" : "Deaktivieren")}</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
    } else {
      $$renderer2.push(`<!--[!--><div class="muted">Keine Personen gefunden.</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-D5Qt2Phm.js.map

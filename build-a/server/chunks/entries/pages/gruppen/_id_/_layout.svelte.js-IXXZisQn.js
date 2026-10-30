import { a6 as escape_html, a9 as ensure_array_like, a4 as attr, a8 as attr_class, a7 as stringify, _ as derived } from '../../../../chunks/index.js-BT3kaB_g.js';
import { p as page } from '../../../../chunks/index2.js-OgeU73zK.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/root.js-CNKyZyh6.js';

function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    const base = derived(() => `/gruppen/${data.group.id}`);
    const tabs = derived(() => [
      { href: base(), label: "Ausgaben" },
      { href: `${base()}/salden`, label: "Salden" },
      { href: `${base()}/mitglieder`, label: "Mitglieder" },
      { href: `${base()}/profile`, label: "Profile" },
      { href: `${base()}/einstellungen`, label: "Einstellungen" }
    ]);
    const active = (href) => href === base() ? page.url.pathname === base() : page.url.pathname.startsWith(href);
    $$renderer2.push(`<div class="head noprint svelte-3eyalf"><span class="emoji svelte-3eyalf">${escape_html(data.group.emoji)}</span> <h1 class="svelte-3eyalf">${escape_html(data.group.name)}</h1></div> <nav class="segmented tabs noprint svelte-3eyalf"><!--[-->`);
    const each_array = ensure_array_like(tabs());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let t = each_array[$$index];
      $$renderer2.push(`<a${attr("href", t.href)}${attr_class("svelte-3eyalf", void 0, { "active": active(t.href) })}>${escape_html(t.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></nav> `);
    if (data.balances.errors.length) {
      $$renderer2.push(`<!--[0--><div class="notice small noprint">⚠️ ${escape_html(data.balances.errors.length)} Ausgabe(n) können nicht aufgeteilt werden und zählen nicht zu den Salden. <!--[-->`);
      const each_array_1 = ensure_array_like(data.balances.errors);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let e = each_array_1[$$index_1];
        $$renderer2.push(`<div><a${attr("href", `${base()}/ausgaben/${stringify(e.expenseId)}`)}>${escape_html(data.expenses.find((x) => x.id === e.expenseId)?.title)}</a>: ${escape_html(e.message)}</div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    children($$renderer2);
    $$renderer2.push(`<!---->`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte.js-IXXZisQn.js.map

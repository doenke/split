import { a8 as attr_class, a6 as escape_html } from '../../chunks/index.js-BT3kaB_g.js';
import { p as page } from '../../chunks/index2.js-OgeU73zK.js';
import { a as versionLabel } from '../../chunks/version.js-D_0qsEMc.js';
import '../../chunks/exports.js-B9Uzt4sy.js';
import '../../chunks/utils2.js-ejsMtG81.js';
import '../../chunks/utils.js-BjQHIhHk.js';
import '../../chunks/root.js-CNKyZyh6.js';
import '../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../chunks/Avatar.js-BAGJaOlv.js';

function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    $$renderer2.push(`<header class="svelte-12qhfyh"><div class="bar svelte-12qhfyh"><a href="/" class="brand svelte-12qhfyh"><img src="/icon.svg" alt="" width="28" height="28"/> <span>Split</span></a> `);
    if (data.user) {
      $$renderer2.push(`<!--[0--><nav class="nav svelte-12qhfyh"><a href="/"${attr_class("svelte-12qhfyh", void 0, {
        "active": page.url.pathname === "/" || page.url.pathname.startsWith("/gruppen")
      })}>Gruppen</a> <a href="/kassen"${attr_class("svelte-12qhfyh", void 0, { "active": page.url.pathname.startsWith("/kassen") })}>Kassen</a></nav> <a href="/profil" class="me svelte-12qhfyh" aria-label="Mein Profil">`);
      Avatar($$renderer2, {
        name: data.user.name,
        color: data.user.color,
        url: data.user.avatarUrl,
        size: 32
      });
      $$renderer2.push(`<!----></a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></header> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <main class="container">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main> <footer class="small muted noprint svelte-12qhfyh">Split ${escape_html(versionLabel)} · <a href="/hilfe">Hilfe</a></footer>`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte.js-DbzWWmRX.js.map

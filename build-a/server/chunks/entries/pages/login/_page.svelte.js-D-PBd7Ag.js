import { aa as head, a6 as escape_html, a4 as attr, a7 as stringify, _ as derived } from '../../../chunks/index.js-BT3kaB_g.js';
import { p as page } from '../../../chunks/index2.js-OgeU73zK.js';
import '../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../chunks/utils2.js-ejsMtG81.js';
import '../../../chunks/utils.js-BjQHIhHk.js';
import '../../../chunks/root.js-CNKyZyh6.js';
import '../../../chunks/state.svelte.js-aCWhrotV.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let busy = false;
    const next = derived(() => page.url.searchParams.get("next") ?? "/");
    head("1x05zx6", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Anmelden · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="login svelte-1x05zx6"><h1>Willkommen bei Split</h1> <p class="muted">Gemeinsame Ausgaben fair aufteilen – für Reisen, Familien und Freunde.</p> `);
    if (data.error) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(data.error)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="card stack">`);
    if (data.oidcEnabled) {
      $$renderer2.push(`<!--[0--><a class="button primary full"${attr("href", `/auth/oidc/login?next=${stringify(encodeURIComponent(next()))}`)}>${escape_html(data.oidcLabel)}</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button class="full"${attr("disabled", busy, true)}>🔑 Mit Passkey anmelden</button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.devLogin) {
      $$renderer2.push(`<!--[0--><form method="POST" action="/auth/dev-login" class="row"><input name="name" placeholder="Name (Dev-Login)" required="" class="grow"/> <button>Dev-Login</button></form>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <p class="small muted">Kein Konto? Kein Problem: Wer zu einer Gruppe eingeladen wird, bekommt einen persönlichen Link und
		ist mit einem Tipp dabei – ganz ohne Passwort.</p></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-D-PBd7Ag.js.map

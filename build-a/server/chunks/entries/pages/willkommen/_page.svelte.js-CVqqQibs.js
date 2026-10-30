import { aa as head, a6 as escape_html, a4 as attr } from '../../../chunks/index.js-BT3kaB_g.js';
import { A as AppAddress } from '../../../chunks/AppAddress.js-D2u7RqoM.js';
import { B as BookmarkLink } from '../../../chunks/BookmarkLink.js-HwLM2Qdk.js';
import { P as PasskeySetup } from '../../../chunks/PasskeySetup.js-gYr-kKCn.js';
import '../../../chunks/utils.js-BjQHIhHk.js';
import '../../../chunks/utils2.js-ejsMtG81.js';
import '../../../chunks/index2.js-OgeU73zK.js';
import '../../../chunks/state.svelte.js-aCWhrotV.js';
import '../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../chunks/root.js-CNKyZyh6.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    head("e5gtm4", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Willkommen · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="welcome svelte-e5gtm4"><h1>Willkommen, ${escape_html(data.user?.name)}! 🎉</h1> <div class="card stack">`);
    if (!data.hasPasskey) {
      $$renderer2.push("<!--[0-->");
      if (data.link) {
        $$renderer2.push(`<!--[0--><p>Ein Konto brauchst du nicht: Mit deinem Link kommst du jederzeit wieder rein – auch auf einem anderen Gerät.
					Bequemer geht es mit einem <strong>Passkey</strong> (Face ID, Fingerabdruck oder Geräte-PIN) – dann brauchst
					du den Link nicht mehr.</p> `);
        BookmarkLink($$renderer2, { url: data.link });
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push(`<!--[-1--><p>Damit du auch später – oder auf einem anderen Gerät – wieder reinkommst, lege jetzt einen <strong>Passkey</strong> an. Das geht mit Face ID, Fingerabdruck oder der Geräte-PIN. Ein Passwort
					brauchst du nicht.</p>`);
      }
      $$renderer2.push(`<!--]--> `);
      PasskeySetup($$renderer2, {});
      $$renderer2.push(`<!----> <p class="small muted">Mit Passkey meldest du dich später einfach unter `);
      AppAddress($$renderer2);
      $$renderer2.push(`<!----> an.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <a class="button full"${attr("href", data.next)}>Weiter</a> <p class="small muted">Tipp: Füge Split über das Browser-Menü zum Home-Bildschirm hinzu – dann verhält es sich wie eine App.</p></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-CVqqQibs.js.map

import { a8 as attr_class, _ as derived } from './index.js-BT3kaB_g.js';

function InstallButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { banner = false } = $$props;
    let ready = false;
    const show = derived(() => ready);
    if (show()) {
      $$renderer2.push(`<!--[1--><div${attr_class("install svelte-12bs7hz", void 0, { "card": banner })}><div class="row"><button type="button" class="primary">📲 Als App installieren</button> `);
      if (banner) {
        $$renderer2.push(`<!--[0--><button type="button" class="link small">Nicht jetzt</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (banner) {
        $$renderer2.push(`<!--[0--><p class="small muted svelte-12bs7hz">Startet wie eine App vom Homescreen – mit Benachrichtigungen und auch offline.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { InstallButton as I };
//# sourceMappingURL=InstallButton.js-Dspb094t.js.map

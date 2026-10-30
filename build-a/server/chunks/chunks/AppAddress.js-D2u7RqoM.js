import { a4 as attr, a7 as stringify, a6 as escape_html, _ as derived } from './index.js-BT3kaB_g.js';
import { p as page } from './index2.js-OgeU73zK.js';

function AppAddress($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const host = derived(() => page.url.host);
    $$renderer2.push(`<a${attr("href", `${stringify(page.url.origin)}/login`)}><strong>${escape_html(host())}</strong></a>`);
  });
}

export { AppAddress as A };
//# sourceMappingURL=AppAddress.js-D2u7RqoM.js.map

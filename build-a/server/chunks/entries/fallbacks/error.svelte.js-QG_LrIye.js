import { a6 as escape_html } from '../../chunks/index.js-BT3kaB_g.js';
import { p as page } from '../../chunks/index2.js-OgeU73zK.js';
import '../../chunks/utils.js-BjQHIhHk.js';
import '../../chunks/utils2.js-ejsMtG81.js';
import '../../chunks/state.svelte.js-aCWhrotV.js';
import '../../chunks/exports.js-B9Uzt4sy.js';
import '../../chunks/root.js-CNKyZyh6.js';

function Error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  });
}

export { Error as default };
//# sourceMappingURL=error.svelte.js-QG_LrIye.js.map

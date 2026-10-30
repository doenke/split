import { a4 as attr, a7 as stringify } from './index.js-BT3kaB_g.js';

/* empty css                                         */
function NameFields($$renderer, $$props) {
  let { id = "name", firstPlaceholder = "z.B. Lea", self = false } = $$props;
  $$renderer.push(`<div class="row names svelte-mct6si"><div class="field grow svelte-mct6si"><label${attr("for", `${stringify(id)}-first`)}>Vorname</label> <input${attr("id", `${stringify(id)}-first`)} name="firstName"${attr("placeholder", firstPlaceholder)} required=""${attr("autocomplete", self ? "given-name" : "off")} class="svelte-mct6si"/></div> <div class="field grow svelte-mct6si"><label${attr("for", `${stringify(id)}-last`)}>Nachname <span class="muted small">(optional)</span></label> <input${attr("id", `${stringify(id)}-last`)} name="lastName"${attr("autocomplete", self ? "family-name" : "off")} class="svelte-mct6si"/></div></div>`);
}

export { NameFields as N };
//# sourceMappingURL=NameFields.js-C3lAxubW.js.map

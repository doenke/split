import { a4 as attr, a6 as escape_html } from './index.js-BT3kaB_g.js';

function BookmarkLink($$renderer, $$props) {
  let { url } = $$props;
  $$renderer.push(`<div class="bookmark svelte-n38ib4"><label for="bookmark-url" class="small"><strong>Diese Adresse als Lesezeichen speichern:</strong></label> <div class="row"><input id="bookmark-url" readonly=""${attr("value", url)} class="grow svelte-n38ib4" style="width: auto"/> <button type="button">${escape_html("Kopieren")}</button></div> <p class="hint">Behalte sie für dich – wer sie hat, kommt als du in Split.</p></div>`);
}

export { BookmarkLink as B };
//# sourceMappingURL=BookmarkLink.js-HwLM2Qdk.js.map

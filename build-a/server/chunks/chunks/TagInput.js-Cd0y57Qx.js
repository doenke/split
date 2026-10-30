import { a4 as attr, a9 as ensure_array_like, a6 as escape_html, _ as derived } from './index.js-BT3kaB_g.js';

function TagInput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { name = "tags", value = [], suggestions = [] } = $$props;
    let tags = [...value];
    let input = "";
    const available = derived(() => suggestions.filter((s) => !tags.includes(s)));
    $$renderer2.push(`<input type="hidden"${attr("name", name)}${attr("value", tags.join(","))}/> <div class="tags svelte-ba3yhw"><!--[-->`);
    const each_array = ensure_array_like(tags);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let t = each_array[$$index];
      $$renderer2.push(`<button type="button" class="tag on svelte-ba3yhw" title="Entfernen">${escape_html(t)} ✕</button>`);
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array_1 = ensure_array_like(available());
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let t = each_array_1[$$index_1];
      $$renderer2.push(`<button type="button" class="tag svelte-ba3yhw">+ ${escape_html(t)}</button>`);
    }
    $$renderer2.push(`<!--]--> <input class="new svelte-ba3yhw" placeholder="Neues Merkmal"${attr("value", input)}/></div>`);
  });
}

export { TagInput as T };
//# sourceMappingURL=TagInput.js-Cd0y57Qx.js.map

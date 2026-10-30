import { a4 as attr, a5 as attr_style, a6 as escape_html, _ as derived, a7 as stringify } from './index.js-BT3kaB_g.js';

/* empty css                                     */
function Avatar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { name, color = "#888", url = null, size = 36 } = $$props;
    const initials = derived(() => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""));
    if (url && true) {
      $$renderer2.push(`<!--[0--><img class="avatar svelte-112qgxv"${attr("src", url)}${attr("alt", name)}${attr("width", size)}${attr("height", size)} referrerpolicy="no-referrer"${attr_style("", {
        width: `${stringify(size)}px`,
        height: `${stringify(size)}px`
      })} onerror="this.__e=event"/>`);
    } else {
      $$renderer2.push(`<!--[-1--><span class="avatar svelte-112qgxv"${attr("title", name)}${attr_style("", {
        width: `${stringify(size)}px`,
        height: `${stringify(size)}px`,
        background: color,
        "font-size": `${stringify(size * 0.4)}px`
      })}>${escape_html(initials())}</span>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { Avatar as A };
//# sourceMappingURL=Avatar.js-BAGJaOlv.js.map

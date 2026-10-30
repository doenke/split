import { a9 as ensure_array_like, a5 as attr_style, a7 as stringify, a6 as escape_html, _ as derived } from './index.js-BT3kaB_g.js';
import { f as formatAmount } from './currency.js-B45uFFG3.js';

function CostBars($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { totals, categories, currency } = $$props;
    const cats = derived(() => new Map(categories.map((c) => [c.id, c])));
    const rows = derived(() => Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([id, v]) => ({ id, v, cat: cats().get(id) })));
    const sum = derived(() => rows().reduce((s, r) => s + r.v, 0));
    $$renderer2.push(`<div class="stack-bar svelte-u4w9e1" aria-hidden="true"><!--[-->`);
    const each_array = ensure_array_like(rows());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let r = each_array[$$index];
      $$renderer2.push(`<span class="svelte-u4w9e1"${attr_style("", {
        width: `${stringify(r.v / sum() * 100)}%`,
        background: r.cat?.color ?? "#999"
      })}></span>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="rows svelte-u4w9e1"><!--[-->`);
    const each_array_1 = ensure_array_like(rows());
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let r = each_array_1[$$index_1];
      $$renderer2.push(`<div class="row-c svelte-u4w9e1"><span class="dot svelte-u4w9e1"${attr_style("", { background: r.cat?.color ?? "#999" })}></span> <span class="grow">${escape_html(r.cat ? `${r.cat.icon} ${r.cat.name}` : "Ohne Kategorie")}</span> <span class="muted small">${escape_html(Math.round(r.v / sum() * 100))} %</span> <span class="amount svelte-u4w9e1">${escape_html(formatAmount(r.v, currency))}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { CostBars as C };
//# sourceMappingURL=CostBars.js-BKf99_4k.js.map

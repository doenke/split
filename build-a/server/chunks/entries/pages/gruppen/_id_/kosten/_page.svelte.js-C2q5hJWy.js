import { aa as head, a4 as attr, a7 as stringify, a6 as escape_html, a9 as ensure_array_like, _ as derived } from '../../../../../chunks/index.js-BT3kaB_g.js';
import { A as Avatar } from '../../../../../chunks/Avatar.js-BAGJaOlv.js';
import { C as CostBars } from '../../../../../chunks/CostBars.js-BKf99_4k.js';
import { f as formatAmount } from '../../../../../chunks/currency.js-B45uFFG3.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const currency = derived(() => data.group.baseCurrency);
    const sum = (t) => Object.values(t).reduce((s, v) => s + v, 0);
    const groupTotals = derived(() => {
      const t = {};
      for (const k of Object.values(data.costs.kassen)) for (const [c, v] of Object.entries(k)) t[c] = (t[c] ?? 0) + v;
      return t;
    });
    const kassen = derived(() => Object.entries(data.costs.kassen).map(([id, t]) => ({
      id,
      totals: t,
      sum: sum(t),
      members: data.members.filter((m) => m.kasseId === id)
    })).sort((a, b) => a.id === data.myKasseId ? -1 : b.id === data.myKasseId ? 1 : b.sum - a.sum));
    let open = null;
    head("70h9xx", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Kosten · ${escape_html(data.group.name)}</title>`);
      });
    });
    $$renderer2.push(`<a${attr("href", `/gruppen/${stringify(data.group.id)}/salden`)} class="small">← Salden</a> <h2 style="margin-top: 0.75rem">Was hat es gekostet?</h2> <p class="small muted">Der tatsächlich verbrauchte Anteil – unabhängig davon, wer bezahlt hat.</p> <div class="card"><div class="row" style="justify-content: space-between"><strong>Ganze Gruppe</strong> <span class="amount">${escape_html(formatAmount(sum(groupTotals()), currency()))}</span></div> `);
    CostBars($$renderer2, {
      totals: groupTotals(),
      categories: data.categories,
      currency: currency()
    });
    $$renderer2.push(`<!----></div> <!--[-->`);
    const each_array = ensure_array_like(kassen());
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      let k = each_array[$$index_2];
      $$renderer2.push(`<div class="card"><div class="row" style="justify-content: space-between"><div class="row" style="gap: 0.5rem"><!--[-->`);
      const each_array_1 = ensure_array_like(k.members.slice(0, 3));
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let m = each_array_1[$$index];
        Avatar($$renderer2, { name: m.name, color: m.color, url: m.avatarUrl, size: 26 });
      }
      $$renderer2.push(`<!--]--> <strong>${escape_html(data.kassen[k.id]?.name ?? "?")}</strong> `);
      if (k.id === data.myKasseId) {
        $$renderer2.push(`<!--[0--><span class="badge">ihr</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <span class="amount">${escape_html(formatAmount(k.sum, currency()))}</span></div> `);
      CostBars($$renderer2, {
        totals: k.totals,
        categories: data.categories,
        currency: currency()
      });
      $$renderer2.push(`<!----> `);
      if (k.members.length > 1) {
        $$renderer2.push(`<!--[0--><button class="link small" style="margin-top: 0.5rem">${escape_html(open === k.id ? "Weniger" : "Pro Person anzeigen")}</button> `);
        if (open === k.id) {
          $$renderer2.push(`<!--[0--><!--[-->`);
          const each_array_2 = ensure_array_like(k.members);
          for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
            let m = each_array_2[$$index_1];
            const t = data.costs.persons[m.personId] ?? {};
            $$renderer2.push(`<div class="person svelte-70h9xx"><div class="row" style="justify-content: space-between"><span>${escape_html(m.name)}</span><span class="amount">${escape_html(formatAmount(sum(t), currency()))}</span></div> `);
            CostBars($$renderer2, { totals: t, categories: data.categories, currency: currency() });
            $$renderer2.push(`<!----></div>`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-C2q5hJWy.js.map

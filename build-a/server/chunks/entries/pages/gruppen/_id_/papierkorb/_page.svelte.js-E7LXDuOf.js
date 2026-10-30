import { aa as head, a4 as attr, a7 as stringify, a6 as escape_html, a9 as ensure_array_like } from '../../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../../chunks/state.svelte.js-aCWhrotV.js';
import { f as formatAmount } from '../../../../../chunks/currency.js-B45uFFG3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const daysLeft = (d) => Math.max(0, data.trashDays - Math.floor((Date.now() - new Date(d).getTime()) / 864e5));
    const kasseName = (id) => data.kassen[id]?.name ?? "?";
    head("ttp93a", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Papierkorb · ${escape_html(data.group.name)}</title>`);
      });
    });
    $$renderer2.push(`<a${attr("href", `/gruppen/${stringify(data.group.id)}/einstellungen`)} class="small">← Einstellungen</a> <h2 style="margin-top: 0.75rem">Papierkorb</h2> <p class="small muted">Gelöschtes bleibt ${escape_html(data.trashDays)} Tage hier und kann wiederhergestellt werden.</p> `);
    if (data.trashExpenses.length === 0 && data.trashSettlements.length === 0) {
      $$renderer2.push(`<!--[0--><div class="card muted">Der Papierkorb ist leer.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.trashExpenses.length) {
      $$renderer2.push(`<!--[0--><h3>Ausgaben</h3> <div class="list"><!--[-->`);
      const each_array = ensure_array_like(data.trashExpenses);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let e = each_array[$$index];
        $$renderer2.push(`<div><div class="grow"><strong>${escape_html(e.title)}</strong> <div class="small muted">${escape_html(formatAmount(e.amount, e.currency))} · noch ${escape_html(daysLeft(e.deletedAt))} Tage</div></div> <form method="POST" action="?/restoreExpense"><input type="hidden" name="id"${attr("value", e.id)}/> <button>Wiederherstellen</button></form></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.trashSettlements.length) {
      $$renderer2.push(`<!--[0--><h3>Zahlungen</h3> <div class="list"><!--[-->`);
      const each_array_1 = ensure_array_like(data.trashSettlements);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let s = each_array_1[$$index_1];
        $$renderer2.push(`<div><div class="grow"><strong>${escape_html(kasseName(s.fromKasseId))} → ${escape_html(kasseName(s.toKasseId))}</strong> <div class="small muted">${escape_html(formatAmount(s.amount, data.group.baseCurrency))} · noch ${escape_html(daysLeft(s.deletedAt))} Tage</div></div> <form method="POST" action="?/restoreSettlement"><input type="hidden" name="id"${attr("value", s.id)}/> <button>Wiederherstellen</button></form></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-E7LXDuOf.js.map

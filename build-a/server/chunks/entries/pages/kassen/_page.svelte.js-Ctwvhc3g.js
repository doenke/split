import { aa as head, a6 as escape_html, a9 as ensure_array_like, a4 as attr, a7 as stringify, a8 as attr_class } from '../../../chunks/index.js-BT3kaB_g.js';
import '../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../chunks/utils2.js-ejsMtG81.js';
import '../../../chunks/utils.js-BjQHIhHk.js';
import '../../../chunks/root.js-CNKyZyh6.js';
import '../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../chunks/Avatar.js-BAGJaOlv.js';
import { f as formatAmount } from '../../../chunks/currency.js-B45uFFG3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    head("qd8h6m", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Kassen · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="row" style="justify-content: space-between; margin-bottom: 0.5rem"><h1 style="margin: 0">Meine Kassen</h1> `);
    {
      $$renderer2.push(`<!--[0--><button class="primary">+ Neue Kasse</button>`);
    }
    $$renderer2.push(`<!--]--></div> <p class="muted small">Eine Kasse fasst Personen zusammen, die gemeinsam abrechnen – z.B. eine Familie oder ein Paar. Sie gilt in
	allen Gruppen: Wer innerhalb der Kasse was bezahlt hat, ist egal, nach außen zählt nur die Kasse.</p> `);
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.kassen.length === 0 && true) {
      $$renderer2.push(`<!--[0--><div class="card muted">Du bist noch in keiner gemeinsamen Kasse. Ohne Kasse rechnest du für dich allein ab.</div>`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="list"><!--[-->`);
      const each_array = ensure_array_like(data.kassen);
      for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
        let k = each_array[$$index_2];
        $$renderer2.push(`<a${attr("href", `/kassen/${stringify(k.id)}`)}><div class="avatars svelte-qd8h6m"><!--[-->`);
        const each_array_1 = ensure_array_like(k.members.slice(0, 4));
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let m = each_array_1[$$index];
          Avatar($$renderer2, { name: m.name, color: m.color, url: m.avatarUrl, size: 30 });
        }
        $$renderer2.push(`<!--]--></div> <div class="grow"><div class="ellipsis"><strong>${escape_html(k.name)}</strong>`);
        if (!k.isMember) {
          $$renderer2.push(`<!--[0--><span class="badge">von dir verwaltet</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="small muted ellipsis">${escape_html(k.members.map((m) => m.name).join(", ") || "noch niemand")}</div></div> <div class="right">`);
        const each_array_2 = ensure_array_like(k.totals.filter((t) => t.amount !== 0));
        if (each_array_2.length !== 0) {
          $$renderer2.push("<!--[-->");
          for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
            let t = each_array_2[$$index_1];
            $$renderer2.push(`<div${attr_class(`amount ${t.amount > 0 ? "positive" : "negative"}`)}>${escape_html(t.amount > 0 ? "+" : "")}${escape_html(formatAmount(t.amount, t.currency))}</div>`);
          }
        } else {
          $$renderer2.push(`<!--[!--><span class="small muted">ausgeglichen</span>`);
        }
        $$renderer2.push(`<!--]--></div></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-Ctwvhc3g.js.map

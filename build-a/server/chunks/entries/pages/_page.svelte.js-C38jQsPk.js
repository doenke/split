import { aa as head, a9 as ensure_array_like, a6 as escape_html, a4 as attr, _ as derived, a7 as stringify, a8 as attr_class } from '../../chunks/index.js-BT3kaB_g.js';
import { f as formatAmount } from '../../chunks/currency.js-B45uFFG3.js';
import { I as InstallButton } from '../../chunks/InstallButton.js-Dspb094t.js';
import '../../chunks/utils.js-BjQHIhHk.js';
import '../../chunks/utils2.js-ejsMtG81.js';

function groupList($$renderer, list) {
  $$renderer.push(`<div class="list"><!--[-->`);
  const each_array = ensure_array_like(list);
  for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
    let g = each_array[$$index_1];
    $$renderer.push(`<a${attr("href", `/gruppen/${stringify(g.id)}`)}><span class="emoji svelte-1uha8ag">${escape_html(g.emoji)}</span> <div class="grow"><div class="ellipsis"><strong>${escape_html(g.name)}</strong></div> <div class="small muted">${escape_html(g.memberCount)} Personen`);
    if (g.drafts) {
      $$renderer.push(`<!--[0--> · 📷 ${escape_html(g.drafts)} vorbereitet`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--></div></div> <div class="right">`);
    if (g.myBalance === 0) {
      $$renderer.push(`<!--[0--><span class="small muted">ausgeglichen</span>`);
    } else {
      $$renderer.push(`<!--[-1--><div${attr_class(`amount ${g.myBalance > 0 ? "positive" : "negative"}`)}>${escape_html(formatAmount(g.myBalance, g.currency))}</div> <div class="small muted">${escape_html(g.myBalance > 0 ? "bekommst du" : "schuldest du")}</div>`);
    }
    $$renderer.push(`<!--]--></div></a>`);
  }
  $$renderer.push(`<!--]--></div>`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const sections = [
      { status: "active", title: "Laufend" },
      { status: "settled", title: "Abgerechnet" },
      { status: "archived", title: "Archiviert" }
    ];
    const byStatus = derived(() => Object.fromEntries(sections.map(({ status }) => [status, data.groups.filter((g) => g.status === status)])));
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Meine Gruppen · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="row" style="justify-content: space-between; margin-bottom: 1rem"><h1 style="margin: 0">Meine Gruppen</h1> `);
    if (data.user?.isOidc) {
      $$renderer2.push(`<!--[0--><a class="button primary" href="/gruppen/neu">+ Neue Gruppe</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    InstallButton($$renderer2, { banner: true });
    $$renderer2.push(`<!----> `);
    if (data.groups.length === 0) {
      $$renderer2.push(`<!--[0--><div class="card"><p>Du bist noch in keiner Gruppe.</p> `);
      if (data.user?.isOidc) {
        $$renderer2.push(`<!--[0--><p class="muted">Lege eine neue Gruppe an, z.B. für deine nächste Reise.</p>`);
      } else {
        $$renderer2.push(`<!--[-1--><p class="muted">Sobald dich jemand zu einer Gruppe hinzufügt, erscheint sie hier.</p>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push(`<!--[-1--><!--[-->`);
      const each_array_1 = ensure_array_like(sections);
      for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
        let sec = each_array_1[$$index];
        const list = byStatus()[sec.status];
        if (list.length) {
          $$renderer2.push("<!--[0-->");
          if (sec.status === "archived") {
            $$renderer2.push(`<!--[0--><details class="archived svelte-1uha8ag"><summary class="svelte-1uha8ag"><h2 class="section svelte-1uha8ag">${escape_html(sec.title)} (${escape_html(list.length)})</h2></summary> `);
            groupList($$renderer2, list);
            $$renderer2.push(`<!----></details>`);
          } else {
            $$renderer2.push(`<!--[-1--><h2 class="section svelte-1uha8ag">${escape_html(sec.title)} (${escape_html(list.length)})</h2> `);
            groupList($$renderer2, list);
            $$renderer2.push(`<!---->`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.deleted.length) {
      $$renderer2.push(`<!--[0--><details class="card small"><summary class="muted">🗑️ Gelöschte Gruppen (${escape_html(data.deleted.length)})</summary> <!--[-->`);
      const each_array_2 = ensure_array_like(data.deleted);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let g = each_array_2[$$index_2];
        $$renderer2.push(`<form method="POST" action="?/restoreGroup" class="row" style="margin-top: 0.5rem"><input type="hidden" name="id"${attr("value", g.id)}/> <span class="grow">${escape_html(g.emoji)} ${escape_html(g.name)}</span> <button>Wiederherstellen</button></form>`);
      }
      $$renderer2.push(`<!--]--> <p class="hint">Gelöschte Gruppen werden nach 30 Tagen endgültig entfernt.</p></details>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-C38jQsPk.js.map

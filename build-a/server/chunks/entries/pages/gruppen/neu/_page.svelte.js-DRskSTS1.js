import { aa as head, a6 as escape_html, a9 as ensure_array_like, a8 as attr_class, a4 as attr, _ as derived } from '../../../../chunks/index.js-BT3kaB_g.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const emojis = [
      "🧳",
      "🏖️",
      "⛷️",
      "🏕️",
      "🚐",
      "🏡",
      "🎉",
      "🍻",
      "⛵",
      "🚴",
      "🎿",
      "🌍"
    ];
    let emoji = "🧳";
    let template = data.templateId ?? "";
    const tpl = derived(() => data.templates.find((t) => t.id === template));
    head("q8sljj", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Neue Gruppe · Split</title>`);
      });
    });
    $$renderer2.push(`<h1>Neue Gruppe</h1> <form method="POST" class="card">`);
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="field"><label for="name">Name</label> <input id="name" name="name" placeholder="z.B. Toskana 2027" required="" autocomplete="off"/></div> <div class="field"><span class="label svelte-q8sljj">Symbol</span> <div class="emojis svelte-q8sljj"><!--[-->`);
    const each_array = ensure_array_like(emojis);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let e = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class("svelte-q8sljj", void 0, { "active": emoji === e })}>${escape_html(e)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> <input type="hidden" name="emoji"${attr("value", emoji)}/></div> `);
    if (data.templates.length) {
      $$renderer2.push(`<!--[0--><div class="field"><label for="template">Vorlage (optional)</label> `);
      $$renderer2.select({ id: "template", name: "template", value: template }, ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`– keine –`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(data.templates);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let t = each_array_1[$$index_1];
          $$renderer3.option({ value: t.id }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(t.emoji)} ${escape_html(t.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      });
      $$renderer2.push(` `);
      if (tpl()) {
        $$renderer2.push(`<!--[0--><label class="check"><input type="checkbox" name="copyPeople" checked=""/> Personen übernehmen – mit Kassen, Faktoren und Merkmalen</label> <label class="check"><input type="checkbox" name="copyProfiles" checked=""/> Profile und Einstellungen übernehmen</label> <p class="hint">Ausgaben und Teilnahmezeiträume werden nicht übernommen. Alle sind sofort dabei, ohne neue Einladung.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="field"><label for="currency">Währung der Gruppe</label> <select id="currency" name="currency"><!--[-->`);
    const each_array_2 = ensure_array_like(data.currencies);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let c = each_array_2[$$index_2];
      $$renderer2.option(
        {
          value: c,
          selected: c === (tpl()?.currency ?? data.defaultCurrency)
        },
        ($$renderer3) => {
          $$renderer3.push(`${escape_html(c)}`);
        }
      );
    }
    $$renderer2.push(`<!--]--></select> <p class="hint">Alle Salden werden in dieser Währung berechnet. Ausgaben in anderen Währungen werden umgerechnet.</p></div> <div class="row"><div class="field grow"><label for="startDate">Von (optional)</label> <input id="startDate" name="startDate" type="date"/></div> <div class="field grow"><label for="endDate">Bis (optional)</label> <input id="endDate" name="endDate" type="date"/></div></div> <button class="primary full">Gruppe anlegen</button></form>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-DRskSTS1.js.map

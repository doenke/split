import { aa as head, a6 as escape_html, a9 as ensure_array_like, a4 as attr, a7 as stringify } from '../../../../chunks/index.js-BT3kaB_g.js';
import { A as AppAddress } from '../../../../chunks/AppAddress.js-D2u7RqoM.js';
import { N as NameFields } from '../../../../chunks/NameFields.js-C3lAxubW.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';
import { p as page } from '../../../../chunks/index2.js-OgeU73zK.js';
import { A as Avatar } from '../../../../chunks/Avatar.js-BAGJaOlv.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let newcomer = data.people.length === 0;
    head("1w32f44", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.group.name)} · Einladung</title>`);
      });
    });
    $$renderer2.push(`<div class="invite svelte-1w32f44"><div class="center svelte-1w32f44"><div class="emoji svelte-1w32f44">${escape_html(data.group.emoji)}</div> <h1>${escape_html(data.group.name)}</h1> <p class="muted">Du wurdest eingeladen. ${escape_html(data.memberCount)} Personen sind schon dabei.</p></div> `);
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.user) {
      $$renderer2.push(`<!--[0--><div class="card stack"><p>Du bist als <strong>${escape_html(data.user.name)}</strong> angemeldet.</p> <form method="POST" action="?/join"><button class="primary full">Als ${escape_html(data.user.name)} beitreten</button></form> `);
      if (data.people.length) {
        $$renderer2.push(`<!--[0--><p class="small muted">Oder bist du schon als eine dieser Personen eingetragen? Dann wird sie mit deinem Konto verbunden:</p> <div class="people svelte-1w32f44"><!--[-->`);
        const each_array = ensure_array_like(data.people);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let p = each_array[$$index];
          $$renderer2.push(`<form method="POST" action="?/claim"><input type="hidden" name="personId"${attr("value", p.personId)}/> <button class="person svelte-1w32f44">`);
          Avatar($$renderer2, { name: p.name, color: p.color, url: p.avatarUrl, size: 28 });
          $$renderer2.push(`<!----> ${escape_html(p.name)}</button></form>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push(`<!--[-1--><p class="small muted"><strong>Kein Konto nötig</strong> – du wählst nur aus, wer du bist. Auf diesem Gerät bleibst du angemeldet. Für
			später oder ein anderes Gerät speicherst du danach einen Passkey (Face ID, Fingerabdruck oder Geräte-PIN) und
			meldest dich damit unter `);
      AppAddress($$renderer2);
      $$renderer2.push(`<!----> an.</p> `);
      if (data.people.length && !newcomer) {
        $$renderer2.push(`<!--[0--><h2>Wer bist du?</h2> <div class="list svelte-1w32f44"><!--[-->`);
        const each_array_1 = ensure_array_like(data.people);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let p = each_array_1[$$index_1];
          $$renderer2.push(`<form method="POST" action="?/claim" class="svelte-1w32f44"><input type="hidden" name="personId"${attr("value", p.personId)}/> <button class="row-btn svelte-1w32f44">`);
          Avatar($$renderer2, { name: p.name, color: p.color, url: p.avatarUrl, size: 36 });
          $$renderer2.push(`<!----> <span class="grow">${escape_html(p.name)}</span> <span>→</span></button></form>`);
        }
        $$renderer2.push(`<!--]--></div> <button class="link">Ich stehe nicht in der Liste</button>`);
      } else {
        $$renderer2.push(`<!--[-1--><form method="POST" action="?/join" class="card"><p style="margin-top: 0"><strong>Wie heißt du?</strong></p> `);
        NameFields($$renderer2, { self: true, firstPlaceholder: "" });
        $$renderer2.push(`<!----> <button class="primary full" style="margin-top: 0.75rem">Beitreten</button> `);
        if (data.people.length) {
          $$renderer2.push(`<!--[0--><button type="button" class="link" style="margin-top: 0.5rem">Zurück zur Liste</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></form>`);
      }
      $$renderer2.push(`<!--]--> <p class="small muted">Du hast schon einen Passkey für Split? <a${attr("href", `/login?next=/g/${stringify(page.params.token)}`)}>Anmelden</a></p>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-Cjb8bw6K.js.map

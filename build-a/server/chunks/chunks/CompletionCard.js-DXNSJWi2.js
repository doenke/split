import { a4 as attr, a7 as stringify, a6 as escape_html, a5 as attr_style, _ as derived } from './index.js-BT3kaB_g.js';
import './exports.js-B9Uzt4sy.js';
import './utils2.js-ejsMtG81.js';
import './utils.js-BjQHIhHk.js';
import './root.js-CNKyZyh6.js';
import './state.svelte.js-aCWhrotV.js';

/* empty css                                     */
function CompletionCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      completion,
      members,
      meId,
      myKasseId,
      kasseName,
      groupId,
      isAdmin = false,
      draftCount = 0
    } = $$props;
    const done = derived(() => new Set(completion.done));
    const meDone = derived(() => done().has(meId));
    const myKasse = derived(() => members.filter((m) => m.kasseId === myKasseId));
    const shared = derived(() => myKasse().length > 1);
    const kasseDone = derived(() => myKasse().every((m) => done().has(m.personId) || !completion.required.includes(m.personId)));
    if (completion.final) {
      $$renderer2.push(`<!--[0--><a class="card final svelte-h6os70"${attr("href", `/gruppen/${stringify(groupId)}/salden`)}><strong>✅ Die Endabrechnung steht.</strong> <span class="small">Alle haben ihre Ausgaben eingetragen. Zum Ausgleichen →</span></a>`);
    } else if (completion.required.length) {
      $$renderer2.push(`<!--[1--><div class="card done-card"><div class="row" style="justify-content: space-between"><div><strong>${escape_html(completion.done.length)} von ${escape_html(completion.required.length)} fertig</strong> <div class="small muted">Wenn alle ihre Ausgaben eingetragen haben, steht die Endabrechnung.</div></div> <button class="link small">${escape_html("Wer fehlt?")}</button></div> `);
      if (draftCount) {
        $$renderer2.push(`<!--[0--><p class="small notice" style="margin: 0.5rem 0 0">📷 Noch ${escape_html(draftCount)} vorbereitete Ausgabe(n) – die Endabrechnung wartet, bis sie vervollständigt oder gelöscht sind.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="progress svelte-h6os70"><span class="svelte-h6os70"${attr_style("", {
        width: `${stringify(completion.done.length / completion.required.length * 100)}%`
      })}></span></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="row actions svelte-h6os70">`);
      if (shared()) {
        $$renderer2.push("<!--[0-->");
        if (kasseDone()) {
          $$renderer2.push(`<!--[0--><form method="POST"${attr("action", `/gruppen/${stringify(groupId)}?/undone`)} class="grow"><input type="hidden" name="scope" value="kasse"/> <button class="full">✔ ${escape_html(kasseName)} ist fertig – doch noch etwas eintragen</button></form>`);
        } else {
          $$renderer2.push(`<!--[-1--><form method="POST"${attr("action", `/gruppen/${stringify(groupId)}?/done`)} class="grow"><input type="hidden" name="scope" value="kasse"/> <button class="primary full">Für ${escape_html(kasseName)} abschließen (${escape_html(myKasse().length)} Personen)</button></form> `);
          if (!meDone()) {
            $$renderer2.push(`<!--[0--><form method="POST"${attr("action", `/gruppen/${stringify(groupId)}?/done`)}><input type="hidden" name="scope" value="self"/> <button>Nur ich</button></form>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      } else if (meDone()) {
        $$renderer2.push(`<!--[1--><form method="POST"${attr("action", `/gruppen/${stringify(groupId)}?/undone`)} class="grow"><input type="hidden" name="scope" value="self"/> <button class="full">✔ Du bist fertig – doch noch etwas eintragen</button></form>`);
      } else {
        $$renderer2.push(`<!--[-1--><form method="POST"${attr("action", `/gruppen/${stringify(groupId)}?/done`)} class="grow"><input type="hidden" name="scope" value="self"/> <button class="primary full">Ich habe alles eingetragen</button></form>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { CompletionCard as C };
//# sourceMappingURL=CompletionCard.js-DXNSJWi2.js.map

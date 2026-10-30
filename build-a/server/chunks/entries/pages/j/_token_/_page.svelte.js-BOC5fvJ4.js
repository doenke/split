import { aa as head, a6 as escape_html } from '../../../../chunks/index.js-BT3kaB_g.js';
import { A as AppAddress } from '../../../../chunks/AppAddress.js-D2u7RqoM.js';
import { p as page } from '../../../../chunks/index2.js-OgeU73zK.js';
import { B as BookmarkLink } from '../../../../chunks/BookmarkLink.js-HwLM2Qdk.js';
import '../../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/utils.js-BjQHIhHk.js';
import '../../../../chunks/root.js-CNKyZyh6.js';
import '../../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../../chunks/Avatar.js-BAGJaOlv.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    head("11cmqwb", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Einladung · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="invite svelte-11cmqwb"><div class="center svelte-11cmqwb">`);
    Avatar($$renderer2, {
      name: data.person.name,
      color: data.person.color,
      url: data.person.avatarUrl,
      size: 72
    });
    $$renderer2.push(`<!----> <h1 class="svelte-11cmqwb">Hallo ${escape_html(data.person.name)}!</h1> `);
    if (data.group) {
      $$renderer2.push(`<!--[0--><p class="muted">Du wurdest zu <strong>${escape_html(data.group.emoji)} ${escape_html(data.group.name)}</strong> eingeladen.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.user && !data.sameUser) {
      $$renderer2.push(`<!--[0--><div class="card stack"><p>Du bist auf diesem Gerät als <strong>${escape_html(data.user.name)}</strong> angemeldet.</p> <form method="POST" action="?/merge"><button class="primary full">Ich bin ${escape_html(data.person.name)} – mit meinem Konto verbinden</button> <p class="hint">Empfohlen, wenn du selbst gemeint bist: Die Einladung wird mit deinem bestehenden Konto
					zusammengeführt, du siehst dann alle deine Gruppen an einem Ort.</p></form> <form method="POST" action="?/claim"><button class="full">Abmelden und als ${escape_html(data.person.name)} weitermachen</button></form></div>`);
    } else {
      $$renderer2.push(`<!--[-1--><form method="POST" action="?/claim"><button class="primary full">Ja, das bin ich</button></form> <p class="small muted center svelte-11cmqwb">Falls du nicht ${escape_html(data.person.name)} bist, schließe diese Seite einfach.</p> <div class="card small"><strong>Kein Konto nötig.</strong> Du musst dich nirgends registrieren und brauchst kein Passwort. Dieser Link
			ist dein persönlicher Zugang: Um später – auch auf einem anderen Gerät – wieder reinzukommen, öffnest du einfach
			wieder diesen Link. Oder du speicherst gleich im Anschluss einen <strong>Passkey</strong> (Face ID, Fingerabdruck
			oder Geräte-PIN), dann meldest du dich ganz ohne Link einfach unter `);
      AppAddress($$renderer2);
      $$renderer2.push(`<!----> an. `);
      BookmarkLink($$renderer2, { url: page.url.origin + page.url.pathname });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-BOC5fvJ4.js.map

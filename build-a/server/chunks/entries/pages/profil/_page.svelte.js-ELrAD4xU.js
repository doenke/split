import { aa as head, a6 as escape_html, a4 as attr, a9 as ensure_array_like, a7 as stringify, _ as derived } from '../../../chunks/index.js-BT3kaB_g.js';
import { A as AppAddress } from '../../../chunks/AppAddress.js-D2u7RqoM.js';
import '../../../chunks/exports.js-B9Uzt4sy.js';
import '../../../chunks/utils2.js-ejsMtG81.js';
import '../../../chunks/utils.js-BjQHIhHk.js';
import '../../../chunks/root.js-CNKyZyh6.js';
import '../../../chunks/state.svelte.js-aCWhrotV.js';
import { A as Avatar } from '../../../chunks/Avatar.js-BAGJaOlv.js';
import { P as PasskeySetup } from '../../../chunks/PasskeySetup.js-gYr-kKCn.js';
import { I as InstallButton } from '../../../chunks/InstallButton.js-Dspb094t.js';
import { f as formatDate } from '../../../chunks/format.js-Cn5c-OM3.js';
import { h as html } from '../../../chunks/html.js-CevvQr0N.js';
import '../../../chunks/index2.js-OgeU73zK.js';

function invalidateAll() {
  {
    throw new Error("Cannot call invalidateAll() on the server");
  }
}
function PushToggle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let status = "busy";
    {
      $$renderer2.push(`<!--[-1--><button class="full"${attr("disabled", status === "busy", true)}>🔔 Benachrichtigungen aktivieren</button>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const user = derived(() => data.user);
    head("kwz0d7", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Profil · Split</title>`);
      });
    });
    $$renderer2.push(`<div class="row" style="margin-bottom: 1rem">`);
    Avatar($$renderer2, {
      name: user().name,
      color: user().color,
      url: user().avatarUrl,
      size: 56
    });
    $$renderer2.push(`<!----> <div><h1 style="margin: 0">${escape_html(user().name)}</h1> <div class="small muted">${escape_html(user().isOidc ? "Angemeldet über Login-Anbieter" : "Gast-Zugang")}`);
    if (user().isInstanceAdmin) {
      $$renderer2.push(`<!--[0-->· Instanz-Admin`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div></div> `);
    if (form?.message) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.message)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <a href="/hilfe" class="button full" style="margin-bottom: 1rem">❓ Hilfe &amp; Anleitung</a> `);
    if (user().isInstanceAdmin) {
      $$renderer2.push(`<!--[0--><a href="/admin/personen" class="button full" style="margin-bottom: 1rem">👥 Personen verwalten (Admin)</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!user().isOidc) {
      $$renderer2.push(`<!--[0--><form method="POST" action="?/rename" class="card"><label for="name">Dein Name</label> <div class="row"><input id="name" name="name"${attr("value", user().name)} class="grow" style="width: auto"/> <button>Speichern</button></div></form>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="card"><h2>Passkeys</h2> <p class="small muted">Damit kommst du ohne Passwort wieder rein – auch auf anderen Geräten oder nach dem Löschen der Browserdaten:
		einfach `);
    AppAddress($$renderer2);
    $$renderer2.push(`<!----> öffnen und „Mit Passkey anmelden“ wählen.</p> `);
    if (data.passkeys.length) {
      $$renderer2.push(`<!--[0--><div class="list"><!--[-->`);
      const each_array = ensure_array_like(data.passkeys);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let p = each_array[$$index];
        $$renderer2.push(`<div><span class="grow">🔑 ${escape_html(p.label ?? "Passkey")} <span class="small muted">· seit ${escape_html(formatDate(p.createdAt.toISOString().slice(0, 10)))}</span></span> <form method="POST" action="?/deletePasskey"><input type="hidden" name="id"${attr("value", p.id)}/> <button class="link danger">Entfernen</button></form></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else if (!user().isOidc) {
      $$renderer2.push(`<!--[1--><p class="notice small">Du hast noch keinen Passkey. Ohne Passkey bist du nur auf diesem Gerät angemeldet.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    PasskeySetup($$renderer2, { ondone: () => invalidateAll() });
    $$renderer2.push(`<!----></div> <div class="card"><h2>App</h2> `);
    InstallButton($$renderer2, {});
    $$renderer2.push(`<!----></div> <div class="card"><h2>Benachrichtigungen</h2> <p class="small muted">Z.B. wenn jemand eine Ausgabe einträgt, dir Geld überweist oder dich an eine Zahlung erinnert. Einzelne Gruppen kannst du in deren Einstellungen stummschalten.</p> `);
    PushToggle($$renderer2);
    $$renderer2.push(`<!----></div> <form method="POST" action="?/savePayment" class="card"><h2>So bekommst du Geld</h2> <p class="small muted">Wer dir in einer Gruppe etwas schuldet, sieht diese Angaben beim Ausgleichen – mit fertigem Betrag.</p> `);
    if (form?.paymentError) {
      $$renderer2.push(`<!--[0--><p class="error">${escape_html(form.paymentError)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.paymentSaved) {
      $$renderer2.push(`<!--[0--><p class="positive">✔ Gespeichert</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="field"><label for="weroContact">Wero: E-Mail oder Handynummer</label> <input id="weroContact" name="weroContact"${attr("value", data.payment?.weroContact ?? "")} autocomplete="off"/> <p class="hint">Die Adresse oder Nummer, mit der du bei Wero angemeldet bist. Läuft nie ab – damit kann dir jeder Geld schicken.</p></div> <div class="field"><label for="iban">IBAN (für GiroCode / Überweisung)</label> <input id="iban" name="iban"${attr("value", data.payment?.iban ?? "")} autocomplete="off"/></div> <div class="field"><label for="accountHolder">Kontoinhaber</label> <input id="accountHolder" name="accountHolder"${attr("value", data.payment?.accountHolder ?? "")}${attr("placeholder", user().name)}/></div> <div class="field"><label for="paypalMe">PayPal.me-Name</label> <input id="paypalMe" name="paypalMe"${attr("value", data.payment?.paypalMe ?? "")} placeholder="z.B. AnnaMuster oder paypal.me/AnnaMuster" autocomplete="off"/></div> <p class="hint">Sichtbar nur für Personen, mit denen du in einer Gruppe bist.</p> <button class="primary full">Speichern</button></form> `);
    if (!data.hasOidc && data.oidcEnabled) {
      $$renderer2.push(`<!--[0--><div class="card"><h2>Login verknüpfen</h2> <p class="small muted">Wenn du ein Konto beim Login-Anbieter hast, kannst du es verknüpfen. Dann kannst du auch eigene Gruppen anlegen.</p> <a class="button full" href="/auth/oidc/login?next=/profil">${escape_html(data.oidcLabel)}</a></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="card" id="ki"><h2>KI-Assistenten (MCP)</h2> <p class="small muted">Mit einem Schlüssel kann ein KI-Assistent wie Claude deine Gruppen, Salden und Ausgaben lesen und für dich Ausgaben
		oder Zahlungen eintragen – mit denselben Rechten wie du. <a href="/hilfe#mcp">So bindest du ihn ein</a></p> `);
    if (form?.apiKey) {
      $$renderer2.push(`<!--[0--><div class="newkey svelte-kwz0d7"><p class="small"><strong>Dein neuer Schlüssel</strong> – er wird nur jetzt angezeigt, kopiere ihn gleich:</p> <input readonly=""${attr("value", form.apiKey)} class="svelte-kwz0d7"/> <p class="small" style="margin-bottom: 0.25rem">Adresse des MCP-Servers:</p> <input readonly=""${attr("value", data.mcpUrl)} class="svelte-kwz0d7"/> <p class="small" style="margin-bottom: 0.25rem">Für Claude Code:</p> <textarea readonly="" rows="3" class="svelte-kwz0d7">`);
      const $$body = escape_html(`claude mcp add --transport http split ${stringify(data.mcpUrl)} --header "Authorization: Bearer ${stringify(form.apiKey)}"`);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.apiKeys.length) {
      $$renderer2.push(`<!--[0--><div class="list"><!--[-->`);
      const each_array_1 = ensure_array_like(data.apiKeys);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let k = each_array_1[$$index_1];
        $$renderer2.push(`<div><span class="grow">🤖 ${escape_html(k.label)} <span class="small muted">· seit ${escape_html(formatDate(k.createdAt.slice(0, 10)))}${escape_html(k.lastUsedAt ? ` · zuletzt ${formatDate(k.lastUsedAt.slice(0, 10))}` : " · noch nie benutzt")}</span></span> <form method="POST" action="?/revokeApiKey"><input type="hidden" name="id"${attr("value", k.id)}/> <button class="link danger">Widerrufen</button></form></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <form method="POST" action="?/createApiKey" class="row"><input name="label" placeholder="Name, z.B. Claude am Laptop" class="grow" style="width: auto" aria-label="Name des Schlüssels"/> <button>Schlüssel erzeugen</button></form></div> <div class="card"><h2>Weiteres Gerät</h2> `);
    if (form?.pairing) {
      $$renderer2.push(`<!--[0--><p class="small">Mit dem anderen Gerät scannen – der Code gilt 10 Minuten und nur einmal.</p> <div class="center svelte-kwz0d7"><div class="qr svelte-kwz0d7">${html(form.pairing.qr)}</div></div> <input readonly=""${attr("value", form.pairing.url)}/>`);
    } else {
      $$renderer2.push(`<!--[-1--><p class="small muted">Melde dich auf einem Tablet oder Laptop an, ohne Passwort: Code anzeigen, mit dem anderen Gerät scannen.</p> <form method="POST" action="?/pairDevice"><button class="full">📱 Gerät hinzufügen</button></form>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="card stack">`);
    if (data.sessionCount > 1) {
      $$renderer2.push(`<!--[0--><form method="POST" action="?/logoutOthers"><button class="full">Auf ${escape_html(data.sessionCount - 1)} anderen Geräten abmelden</button></form>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <form method="POST" action="/auth/logout"><button class="full danger">Abmelden</button></form></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-ELrAD4xU.js.map

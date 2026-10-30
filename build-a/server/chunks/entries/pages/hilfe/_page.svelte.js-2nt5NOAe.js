import { aa as head, a9 as ensure_array_like, a4 as attr, a7 as stringify, a6 as escape_html, _ as derived } from '../../../chunks/index.js-BT3kaB_g.js';
import '../../../chunks/utils.js-BjQHIhHk.js';
import '../../../chunks/utils2.js-ejsMtG81.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const host = derived(() => data.appUrl.replace(/^https?:\/\//, ""));
    const chapters = [
      ["start", "Erste Schritte"],
      ["zugang", "Anmelden ohne Konto"],
      ["gruppen", "Gruppen & Mitglieder"],
      ["kassen", "Kassen"],
      ["ausgaben", "Ausgaben erfassen"],
      ["salden", "Salden & Ausgleichen"],
      ["abschluss", "Abschließen & Endabrechnung"],
      ["app", "Als App & offline"],
      ["mcp", "KI-Assistenten (MCP)"]
    ];
    const desktopConfig = derived(() => JSON.stringify(
      {
        mcpServers: {
          split: {
            command: "npx",
            args: [
              "-y",
              "mcp-remote",
              data.mcpUrl,
              "--header",
              "Authorization:${SPLIT_KEY}"
            ],
            env: { SPLIT_KEY: "Bearer split_DEIN_SCHLÜSSEL" }
          }
        }
      },
      null,
      2
    ));
    head("1t8qevn", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Hilfe · Split</title>`);
      });
    });
    $$renderer2.push(`<article class="help svelte-1t8qevn"><h1>Hilfe</h1> <p class="muted">Split teilt gemeinsame Kosten fair auf – für Reisen, WGs oder Familienausflüge.</p> <nav class="card toc svelte-1t8qevn" aria-label="Inhalt"><ol class="svelte-1t8qevn"><!--[-->`);
    const each_array = ensure_array_like(chapters);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [id, title] = each_array[$$index];
      $$renderer2.push(`<li class="svelte-1t8qevn"><a${attr("href", `#${stringify(id)}`)}>${escape_html(title)}</a></li>`);
    }
    $$renderer2.push(`<!--]--></ol></nav> <section id="start" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Erste Schritte</h2> <ol><li class="svelte-1t8qevn">Wer sich über den Login-Anbieter anmeldet, kann <strong>Gruppen anlegen</strong> (Startseite → „+ Neue Gruppe“).</li> <li class="svelte-1t8qevn">Unter <strong>Mitglieder</strong> alle Mitreisenden eintragen – auch Kinder oder Personen ohne Smartphone. Wer selbst
				mitmachen soll, bekommt einen persönlichen <strong>Zugangslink</strong>, oder du teilst den <strong>Einladungslink für die ganze Gruppe</strong>.</li> <li class="svelte-1t8qevn">Ausgaben mit <strong>+</strong> eintragen, Belege im Laden mit 📷 fotografieren.</li> <li class="svelte-1t8qevn">Unter <strong>Salden</strong> steht jederzeit, wer wem wie viel schuldet.</li></ol></section> <section id="zugang" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Anmelden ohne Konto</h2> <p>Niemand muss sich registrieren. Ein <strong>persönlicher Link</strong> ist der Schlüssel: Er funktioniert immer wieder
			und gilt 90 Tage ab der letzten Nutzung. Wer ihn als Lesezeichen speichert, kommt jederzeit wieder rein – auch auf
			einem anderen Gerät. Ein neu erstellter Link ersetzt den alten.</p> <p>Bequemer ist ein <strong>Passkey</strong> (Face ID, Fingerabdruck oder Geräte-PIN): einmal unter Profil anlegen, danach
			einfach <a href="/login"><strong>${escape_html(host())}</strong></a> öffnen und „Mit Passkey anmelden“ wählen.</p> <p>Weitere Geräte: Profil → „Gerät hinzufügen“ zeigt einen QR-Code, der 10 Minuten und nur einmal gilt.</p></section> <section id="gruppen" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Gruppen &amp; Mitglieder</h2> <ul><li class="svelte-1t8qevn"><strong>Faktor:</strong> Gewichtung einer Person bei „Alle“-Ausgaben, z.B. 0,5 für ein Kind oder 0 für ein Kleinkind.</li> <li class="svelte-1t8qevn"><strong>Teilnahmezeitraum:</strong> Wer später anreist oder früher abreist, zahlt nur Ausgaben aus seiner Zeit mit.
				Wer später dazukommt, ist bei „Alle“-Ausgaben ab dann automatisch dabei.</li> <li class="svelte-1t8qevn"><strong>Personen anlegen:</strong> mit Vorname und optionalem Nachname. Gibt es den Namen schon, wählst du die bekannte Person.</li> <li class="svelte-1t8qevn"><strong>Admins</strong> einer Gruppe dürfen Einstellungen ändern, Personen abschließen und die Gruppe abschließen.</li></ul></section> <section id="kassen" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Kassen</h2> <p>Eine Kasse fasst Personen zusammen, die gemeinsam abrechnen – z.B. eine Familie. Innerhalb der Kasse ist egal, wer
			was bezahlt hat; nach außen zählt nur die Kasse. Kassen gelten in allen Gruppen, und Salden lassen sich über Gruppen
			hinweg verrechnen.</p> <ul><li class="svelte-1t8qevn">Sind zwei Personen einer Kasse in derselben offenen Gruppe, rechnen sie dort automatisch über die Kasse ab.</li> <li class="svelte-1t8qevn">In einer Gruppe fügst du eine ganze Familie mit „Ganze Kasse“ auf einmal hinzu.</li> <li class="svelte-1t8qevn">Kassen kannst du auch für andere anlegen (z.B. befreundete Familien), ohne selbst dazuzugehören.</li> <li class="svelte-1t8qevn">Der <strong>Zahlungsempfänger</strong> einer Kasse bestimmt, welche Zahlungsdaten beim Ausgleichen angezeigt werden.</li></ul></section> <section id="ausgaben" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Ausgaben erfassen</h2> <ul><li class="svelte-1t8qevn"><strong>Aufteilung:</strong> „Alle“, „Alle außer …“, „Nur …“ oder individuell (Beträge, Prozente, Anteile). Normal
				zählen die Faktoren der Personen; „Alle gleich gewichten“ ignoriert sie.</li> <li class="svelte-1t8qevn"><strong>Profile</strong> (eigener Menüpunkt) speichern wiederkehrende Aufteilungen, z.B. „Mietwagen“: nur bestimmte Personen mit eigenen Faktoren.</li> <li class="svelte-1t8qevn"><strong>Privater Anteil:</strong> wird vom Betrag abgezogen, nur der Rest wird geteilt.</li> <li class="svelte-1t8qevn"><strong>Zeitraum:</strong> z.B. Ferienwohnung – geteilt nach Nächten oder Tagen, die jemand dabei war.</li> <li class="svelte-1t8qevn"><strong>Fremdwährung:</strong> wird mit dem Tageskurs umgerechnet. Den tatsächlich abgebuchten Betrag kannst du gleich
				oder später („Abgebuchten Betrag nachtragen“) aus der Kreditkartenabrechnung eintragen.</li> <li class="svelte-1t8qevn"><strong>📷 Bon fotografieren:</strong> erzeugt eine vorbereitete Ausgabe, die du später vervollständigst. Ist die
				Bon-Erkennung eingerichtet, werden Händler, Betrag und Positionen automatisch gelesen. Vorbereitete Ausgaben zählen
				erst nach dem Speichern.</li></ul></section> <section id="salden" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Salden &amp; Ausgleichen</h2> <ul><li class="svelte-1t8qevn">Positiver Saldo: du bekommst Geld. Negativer Saldo: du schuldest Geld.</li> <li class="svelte-1t8qevn">„So wird ausgeglichen“ schlägt möglichst wenige Zahlungen vor. „Bezahlen“ zeigt Wero, Überweisung (GiroCode) oder PayPal mit fertigem Betrag.</li> <li class="svelte-1t8qevn">„Bezahlt“ trägt eine Zahlung ein – auch einen Teilbetrag. „+ Zahlung eintragen“ erfasst z.B. Bargeld, das jemand braucht.</li> <li class="svelte-1t8qevn">Der Empfänger bestätigt den Eingang; trägt er sie selbst ein, gilt sie sofort als bestätigt.</li> <li class="svelte-1t8qevn">Deine Zahlungsdaten (Wero-Adresse, IBAN, PayPal.me) hinterlegst du im Profil.</li></ul></section> <section id="abschluss" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Abschließen &amp; Endabrechnung</h2> <p>Wer alles eingetragen hat, tippt „Ich habe alles eingetragen“ – für sich oder die ganze Kasse. Sind alle fertig (und
			keine vorbereiteten Ausgaben mehr offen), steht die Endabrechnung. Unter Einstellungen gibt es die Abrechnung als PDF
			mit allen Ausgaben und den Anteilen jeder Person sowie einen CSV-Export.</p></section> <section id="app" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">Als App &amp; offline</h2> <p>Auf der Startseite oder im Profil „📲 Als App installieren“ – auf dem iPhone über Teilen → „Zum Home-Bildschirm“.
			Ausgaben lassen sich auch ohne Netz erfassen; sie werden übertragen, sobald du wieder online bist. Neue Versionen
			lädt die App selbst.</p></section> <section id="mcp" class="svelte-1t8qevn"><h2 class="svelte-1t8qevn">KI-Assistenten (MCP)</h2> <p>Über das <strong>Model Context Protocol (MCP)</strong> kann ein KI-Assistent wie Claude mit Split arbeiten, z.B.:
			„Trag 42,50 € fürs Abendessen ein, bezahlt hat Anna, nur für uns Erwachsene“ oder „Wer schuldet in der Toskana-Gruppe
			noch wem Geld?“. Der Assistent hat dabei genau deine Rechte.</p> <h3 class="svelte-1t8qevn">1. Schlüssel erzeugen</h3> <p><a href="/profil#ki">Profil → KI-Assistenten</a> → Namen eingeben → „Schlüssel erzeugen“. Der Schlüssel (beginnt mit <code class="svelte-1t8qevn">split_</code>) wird nur einmal angezeigt. Für jeden Assistenten bzw. jedes Gerät am besten einen eigenen; dort
			kannst du ihn auch jederzeit widerrufen.</p> <h3 class="svelte-1t8qevn">2. Server-Adresse</h3> <pre class="svelte-1t8qevn">${escape_html(data.mcpUrl)}</pre> <p class="small muted">Transport „Streamable HTTP“. Den Schlüssel als Header <code class="svelte-1t8qevn">Authorization: Bearer split_…</code> mitschicken.</p> <h3 class="svelte-1t8qevn">3. Einbinden</h3> <h4 class="svelte-1t8qevn">Claude Code</h4> <pre class="svelte-1t8qevn">claude mcp add --transport http split ${escape_html(data.mcpUrl)} \\
  --header "Authorization: Bearer split_DEIN_SCHLÜSSEL"</pre> <h4 class="svelte-1t8qevn">Claude Desktop</h4> <p>In <code class="svelte-1t8qevn">claude_desktop_config.json</code> (Einstellungen → Entwickler → Konfiguration bearbeiten) eintragen, Schlüssel einsetzen und Claude neu starten (benötigt Node.js):</p> <pre class="svelte-1t8qevn">${escape_html(desktopConfig())}</pre> <h4 class="svelte-1t8qevn">Claude.ai, Claude-App und andere Clients ohne Header</h4> <p>Manche Clients nehmen nur eine Adresse an (z.B. „Benutzerdefinierten Connector hinzufügen“ in Claude). Dann den
			Schlüssel an die Adresse hängen:</p> <pre class="svelte-1t8qevn">${escape_html(data.mcpUrl)}?key=split_DEIN_SCHLÜSSEL</pre> <p class="small muted">Achtung: Die Adresse enthält dann den Schlüssel und taucht z.B. in Server-Logs auf – behandle sie wie ein Passwort.
			Der Split-Server muss dafür aus dem Internet erreichbar sein.</p> <h4 class="svelte-1t8qevn">Andere Clients</h4> <p>Cursor, VS Code, LibreChat &amp; Co.: als „HTTP“- bzw. „Streamable HTTP“-Server mit der Adresse oben und dem Header <code class="svelte-1t8qevn">Authorization: Bearer split_…</code> eintragen.</p> <h3 class="svelte-1t8qevn">Was der Assistent kann</h3> <ul><!--[-->`);
    const each_array_1 = ensure_array_like(data.tools);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let t = each_array_1[$$index_1];
      $$renderer2.push(`<li class="svelte-1t8qevn"><code class="svelte-1t8qevn">${escape_html(t.name)}</code> – ${escape_html(t.description)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul> <p class="small muted">Personen gibt man einfach mit Namen an („Anna“), Beträge in Euro bzw. der Gruppenwährung. Eingetragene Ausgaben
			erscheinen sofort in der App, die anderen bekommen wie gewohnt eine Benachrichtigung. Löschen oder Ändern ist über den
			Assistenten bewusst nicht möglich.</p></section></article>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-2nt5NOAe.js.map

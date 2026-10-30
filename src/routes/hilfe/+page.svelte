<script lang="ts">
	let { data } = $props();
	const host = $derived(data.appUrl.replace(/^https?:\/\//, ''));

	const chapters = [
		['start', 'Erste Schritte'],
		['zugang', 'Anmelden ohne Konto'],
		['gruppen', 'Gruppen & Mitglieder'],
		['kassen', 'Kassen'],
		['ausgaben', 'Ausgaben erfassen'],
		['salden', 'Salden & Ausgleichen'],
		['abschluss', 'Abschließen & Endabrechnung'],
		['app', 'Als App & offline'],
		['mcp', 'KI-Assistenten (MCP)']
	] as const;

	const desktopConfig = $derived(
		JSON.stringify(
			{
				mcpServers: {
					split: {
						command: 'npx',
						args: ['-y', 'mcp-remote', data.mcpUrl, '--header', 'Authorization:${SPLIT_KEY}'],
						env: { SPLIT_KEY: 'Bearer split_DEIN_SCHLÜSSEL' }
					}
				}
			},
			null,
			2
		)
	);
</script>

<svelte:head><title>Hilfe · Split</title></svelte:head>

<article class="help">
	<h1>Hilfe</h1>
	<p class="muted">Split teilt gemeinsame Kosten fair auf – für Reisen, WGs oder Familienausflüge.</p>

	<nav class="card toc" aria-label="Inhalt">
		<ol>
			{#each chapters as [id, title] (id)}<li><a href="#{id}">{title}</a></li>{/each}
		</ol>
	</nav>

	<section id="start">
		<h2>Erste Schritte</h2>
		<ol>
			<li>Wer sich über den Login-Anbieter anmeldet, kann <strong>Gruppen anlegen</strong> (Startseite → „+ Neue Gruppe“).</li>
			<li>
				Unter <strong>Mitglieder</strong> alle Mitreisenden eintragen – auch Kinder oder Personen ohne Smartphone. Wer selbst
				mitmachen soll, bekommt einen persönlichen <strong>Zugangslink</strong>, oder du teilst den
				<strong>Einladungslink für die ganze Gruppe</strong>.
			</li>
			<li>Ausgaben mit <strong>+</strong> eintragen, Belege im Laden mit 📷 fotografieren.</li>
			<li>Unter <strong>Salden</strong> steht jederzeit, wer wem wie viel schuldet.</li>
		</ol>
	</section>

	<section id="zugang">
		<h2>Anmelden ohne Konto</h2>
		<p>
			Niemand muss sich registrieren. Ein <strong>persönlicher Link</strong> ist der Schlüssel: Er funktioniert immer wieder
			und gilt 90 Tage ab der letzten Nutzung. Wer ihn als Lesezeichen speichert, kommt jederzeit wieder rein – auch auf
			einem anderen Gerät. Ein neu erstellter Link ersetzt den alten.
		</p>
		<p>
			Bequemer ist ein <strong>Passkey</strong> (Face ID, Fingerabdruck oder Geräte-PIN): einmal unter Profil anlegen, danach
			einfach <a href="/login"><strong>{host}</strong></a> öffnen und „Mit Passkey anmelden“ wählen.
		</p>
		<p>
			Weitere Geräte: Profil → „Gerät hinzufügen“ zeigt einen QR-Code, der 10 Minuten und nur einmal gilt.
		</p>
	</section>

	<section id="gruppen">
		<h2>Gruppen & Mitglieder</h2>
		<ul>
			<li>
				<strong>Faktor:</strong> Gewichtung einer Person bei „Alle“-Ausgaben, z.B. 0,5 für ein Kind oder 0 für ein Kleinkind.
			</li>
			<li>
				<strong>Teilnahmezeitraum:</strong> Wer später anreist oder früher abreist, zahlt nur Ausgaben aus seiner Zeit mit.
				Wer später dazukommt, ist bei „Alle“-Ausgaben ab dann automatisch dabei.
			</li>
			<li><strong>Personen anlegen:</strong> mit Vorname und optionalem Nachname. Gibt es den Namen schon, wählst du die bekannte Person.</li>
			<li><strong>Admins</strong> einer Gruppe dürfen Einstellungen ändern, Personen abschließen und die Gruppe abschließen.</li>
		</ul>
	</section>

	<section id="kassen">
		<h2>Kassen</h2>
		<p>
			Eine Kasse fasst Personen zusammen, die gemeinsam abrechnen – z.B. eine Familie. Innerhalb der Kasse ist egal, wer
			was bezahlt hat; nach außen zählt nur die Kasse. Kassen gelten in allen Gruppen, und Salden lassen sich über Gruppen
			hinweg verrechnen.
		</p>
		<ul>
			<li>Sind zwei Personen einer Kasse in derselben offenen Gruppe, rechnen sie dort automatisch über die Kasse ab.</li>
			<li>In einer Gruppe fügst du eine ganze Familie mit „Ganze Kasse“ auf einmal hinzu.</li>
			<li>Kassen kannst du auch für andere anlegen (z.B. befreundete Familien), ohne selbst dazuzugehören.</li>
			<li>Der <strong>Zahlungsempfänger</strong> einer Kasse bestimmt, welche Zahlungsdaten beim Ausgleichen angezeigt werden.</li>
		</ul>
	</section>

	<section id="ausgaben">
		<h2>Ausgaben erfassen</h2>
		<ul>
			<li>
				<strong>Aufteilung:</strong> „Alle“, „Alle außer …“, „Nur …“ oder individuell (Beträge, Prozente, Anteile). Normal
				zählen die Faktoren der Personen; „Alle gleich gewichten“ ignoriert sie.
			</li>
			<li><strong>Profile</strong> (eigener Menüpunkt) speichern wiederkehrende Aufteilungen, z.B. „Mietwagen“: nur bestimmte Personen mit eigenen Faktoren.</li>
			<li><strong>Privater Anteil:</strong> wird vom Betrag abgezogen, nur der Rest wird geteilt.</li>
			<li><strong>Zeitraum:</strong> z.B. Ferienwohnung – geteilt nach Nächten oder Tagen, die jemand dabei war.</li>
			<li>
				<strong>Fremdwährung:</strong> wird mit dem Tageskurs umgerechnet. Den tatsächlich abgebuchten Betrag kannst du gleich
				oder später („Abgebuchten Betrag nachtragen“) aus der Kreditkartenabrechnung eintragen.
			</li>
			<li>
				<strong>📷 Bon fotografieren:</strong> erzeugt eine vorbereitete Ausgabe, die du später vervollständigst. Ist die
				Bon-Erkennung eingerichtet, werden Händler, Betrag und Positionen automatisch gelesen. Vorbereitete Ausgaben zählen
				erst nach dem Speichern.
			</li>
		</ul>
	</section>

	<section id="salden">
		<h2>Salden & Ausgleichen</h2>
		<ul>
			<li>Positiver Saldo: du bekommst Geld. Negativer Saldo: du schuldest Geld.</li>
			<li>„So wird ausgeglichen“ schlägt möglichst wenige Zahlungen vor. „Bezahlen“ zeigt Wero, Überweisung (GiroCode) oder PayPal mit fertigem Betrag.</li>
			<li>„Bezahlt“ trägt eine Zahlung ein – auch einen Teilbetrag. „+ Zahlung eintragen“ erfasst z.B. Bargeld, das jemand braucht.</li>
			<li>Der Empfänger bestätigt den Eingang; trägt er sie selbst ein, gilt sie sofort als bestätigt.</li>
			<li>Deine Zahlungsdaten (Wero-Adresse, IBAN, PayPal.me) hinterlegst du im Profil.</li>
		</ul>
	</section>

	<section id="abschluss">
		<h2>Abschließen & Endabrechnung</h2>
		<p>
			Wer alles eingetragen hat, tippt „Ich habe alles eingetragen“ – für sich oder die ganze Kasse. Sind alle fertig (und
			keine vorbereiteten Ausgaben mehr offen), steht die Endabrechnung. Unter Einstellungen gibt es die Abrechnung als PDF
			mit allen Ausgaben und den Anteilen jeder Person sowie einen CSV-Export.
		</p>
	</section>

	<section id="app">
		<h2>Als App & offline</h2>
		<p>
			Auf der Startseite oder im Profil „📲 Als App installieren“ – auf dem iPhone über Teilen → „Zum Home-Bildschirm“.
			Ausgaben lassen sich auch ohne Netz erfassen; sie werden übertragen, sobald du wieder online bist. Neue Versionen
			lädt die App selbst.
		</p>
	</section>

	<section id="mcp">
		<h2>KI-Assistenten (MCP)</h2>
		<p>
			Über das <strong>Model Context Protocol (MCP)</strong> kann ein KI-Assistent wie Claude mit Split arbeiten, z.B.:
			„Trag 42,50 € fürs Abendessen ein, bezahlt hat Anna, nur für uns Erwachsene“ oder „Wer schuldet in der Toskana-Gruppe
			noch wem Geld?“. Der Assistent hat dabei genau deine Rechte.
		</p>

		<h3>1. Schlüssel erzeugen</h3>
		<p>
			<a href="/profil#ki">Profil → KI-Assistenten</a> → Namen eingeben → „Schlüssel erzeugen“. Der Schlüssel (beginnt mit
			<code>split_</code>) wird nur einmal angezeigt. Für jeden Assistenten bzw. jedes Gerät am besten einen eigenen; dort
			kannst du ihn auch jederzeit widerrufen.
		</p>

		<h3>2. Server-Adresse</h3>
		<pre>{data.mcpUrl}</pre>
		<p class="small muted">
			Transport „Streamable HTTP“. Den Schlüssel als Header <code>Authorization: Bearer split_…</code> mitschicken.
		</p>

		<h3>3. Einbinden</h3>
		<h4>Claude Code</h4>
		<pre>claude mcp add --transport http split {data.mcpUrl} \
  --header "Authorization: Bearer split_DEIN_SCHLÜSSEL"</pre>

		<h4>Claude Desktop</h4>
		<p>In <code>claude_desktop_config.json</code> (Einstellungen → Entwickler → Konfiguration bearbeiten) eintragen, Schlüssel einsetzen und Claude neu starten (benötigt Node.js):</p>
		<pre>{desktopConfig}</pre>

		<h4>Claude.ai, Claude-App und andere Clients ohne Header</h4>
		<p>
			Manche Clients nehmen nur eine Adresse an (z.B. „Benutzerdefinierten Connector hinzufügen“ in Claude). Dann den
			Schlüssel an die Adresse hängen:
		</p>
		<pre>{data.mcpUrl}?key=split_DEIN_SCHLÜSSEL</pre>
		<p class="small muted">
			Achtung: Die Adresse enthält dann den Schlüssel und taucht z.B. in Server-Logs auf – behandle sie wie ein Passwort.
			Der Split-Server muss dafür aus dem Internet erreichbar sein.
		</p>

		<h4>Andere Clients</h4>
		<p>
			Cursor, VS Code, LibreChat & Co.: als „HTTP“- bzw. „Streamable HTTP“-Server mit der Adresse oben und dem Header
			<code>Authorization: Bearer split_…</code> eintragen.
		</p>

		<h3>Was der Assistent kann</h3>
		<ul>
			{#each data.tools as t (t.name)}
				<li><code>{t.name}</code> – {t.description}</li>
			{/each}
		</ul>
		<p class="small muted">
			Personen gibt man einfach mit Namen an („Anna“), Beträge in Euro bzw. der Gruppenwährung. Eingetragene Ausgaben
			erscheinen sofort in der App, die anderen bekommen wie gewohnt eine Benachrichtigung. Löschen oder Ändern ist über den
			Assistenten bewusst nicht möglich.
		</p>
	</section>
</article>

<style>
	.help {
		max-width: 720px;
		margin: 0 auto;
	}
	.help section {
		scroll-margin-top: 4.5rem;
		margin-bottom: 1.75rem;
	}
	.help h2 {
		border-bottom: 1px solid var(--border);
		padding-bottom: 0.3rem;
	}
	.help h3 {
		font-size: 1.05rem;
		margin: 1.25rem 0 0.4rem;
	}
	.help h4 {
		font-size: 0.95rem;
		margin: 1rem 0 0.3rem;
	}
	.help li + li {
		margin-top: 0.35rem;
	}
	.toc ol {
		margin: 0;
		padding-left: 1.3rem;
		columns: 2;
		column-gap: 1.5rem;
	}
	@media (max-width: 480px) {
		.toc ol {
			columns: 1;
		}
	}
	pre {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.7rem 0.8rem;
		overflow-x: auto;
		font-size: 0.8rem;
		white-space: pre;
	}
	code {
		font-size: 0.85em;
		background: var(--surface-2);
		padding: 0.05rem 0.3rem;
		border-radius: 4px;
	}
</style>

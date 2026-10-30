# Split

Selbst gehostete PWA, um gemeinsame Ausgaben in Gruppen fair aufzuteilen – für Reisen, Familien und Freunde.
Das Konzept steht in [`docs/KONZEPT.md`](docs/KONZEPT.md).

## Stand

**Phase 1**
- Anmeldung per OIDC (nur OIDC-Nutzer legen Gruppen an), Gäste per persönlichem Link + Passkey – ohne Passwort
- Personen ohne Login (z.B. Kinder), Standard-Faktor pro Person, Teilnahmezeitraum, Nachzügler-Dialog
- Ausgaben mit den Aufteilungen *Alle*, *Alle außer …*, *Nur …*, *Individuell* (Anteile, Prozent, Beträge),
  mehreren Zahlern, privatem Anteil und Aufteilung nach Aufenthaltsdauer (Nächte/Tage)
- Fremdwährungen mit EZB-Kursen, manuellem Kurs oder tatsächlich abgebuchtem Betrag
- Kategorien, Salden, Ausgleichsvorschläge (vereinfacht oder direkt), Zahlungen mit Bestätigung
- Änderungsverlauf, PWA (installierbar, Offline-Lesezugriff), Docker-Image mit Healthcheck

**Phase 2**
- Gemeinsame Kassen (Familien, Paare) über alle Gruppen, ganze Kasse zu einer Gruppe hinzufügen,
  Verrechnung über mehrere Gruppen mit einer einzigen Zahlung
- Merkmale an Mitgliedern (z.B. „Kind“) und Ausgaben-Profile („Alkohol“, „Unterkunft“), die sich automatisch anpassen
- Zahlungsdaten im Profil: Wero (E-Mail oder Handynummer), IBAN mit GiroCode, PayPal.me – mit fertigem Betrag
- Belegfotos und PDFs, „An Split teilen“ aus der Galerie (PWA Share Target)
- Kostenübersicht nach Kategorien pro Person, Kasse und Gruppe – für Kassen auch über alle Gruppen und Jahre

**Phase 3** (ohne Bon-Erkennung)
- Gruppen-Einladungslink „Wer bist du?“ für den Gruppenchat, weitere Geräte per QR-Code koppeln
- Gruppe als Vorlage (Personen, Kassen, Faktoren, Merkmale, Profile), Papierkorb (30 Tage)
- Abrechnung abschließen (Anteile festschreiben), CSV-Export, druckbare Abrechnung als PDF
- Push-Benachrichtigungen (neue Ausgaben, Zahlungen, Erinnerungen), pro Gruppe stummschaltbar –
  die VAPID-Schlüssel erzeugt die App beim ersten Start selbst
- Ausgaben offline erfassen, automatische Übertragung bei Verbindung
- Aufteilung nach Aufenthaltsdauer wahlweise nach Nächten oder Tagen
- „Ich habe alles eingetragen“ – für sich oder die ganze Kasse; wenn alle fertig sind, steht die
  Endabrechnung automatisch (Anteile festgeschrieben, alle werden benachrichtigt)

**Bon-Erkennung** (optional): Mit gesetztem `ANTHROPIC_API_KEY` werden fotografierte Kassenbons und PDFs
von Claude ausgelesen. Händler, Datum, Betrag, Währung und Kategorie werden vorgeschlagen, einzelne Positionen
lassen sich abwählen (privater Anteil). Das Bild wird dafür an die Anthropic-API übertragen.

## Betrieb mit Docker Compose

```bash
cp .env.example .env    # Werte anpassen
docker compose up -d
```

**Portainer:** Inhalt von `docker-compose.yml` als Stack einfügen und die Variablen aus `.env.example`
unter *Environment variables* eintragen (mindestens `PUBLIC_URL` und `POSTGRES_PASSWORD`).

Die App lauscht auf Port **8347**. Datenbank-Migrationen laufen beim Start automatisch.
Im Identity Provider als Redirect-URI eintragen: `https://<PUBLIC_URL>/auth/oidc/callback`.

Healthchecks: `GET /api/health` (inkl. Datenbank, `503` wenn nicht erreichbar) und `GET /api/health/live`.

## Entwicklung

```bash
npm install
cp .env.example .env    # DATABASE_URL auf lokale Postgres zeigen lassen, DEV_LOGIN=true
npm run dev             # http://localhost:8347
npm test                # Rechenkern (Aufteilung, Rundung, Salden, Währungen)
npm run check           # Typprüfung
npm run db:generate     # Migration nach Schemaänderung erzeugen
```

Mit `DEV_LOGIN=true` gibt es auf der Login-Seite ein Formular, um sich ohne Identity Provider als
OIDC-Nutzer anzumelden. **Niemals in Produktion aktivieren.**

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/lib/core/` | Rechenkern ohne Abhängigkeiten: Aufteilungsregeln, Faktoren, Rundung, Salden, Ausgleich, Währungen |
| `src/lib/server/db/` | Drizzle-Schema und Datenbankzugriff |
| `src/lib/server/auth/` | OIDC, Sessions, Einladungslinks, Passkeys |
| `src/routes/` | Seiten und Endpunkte (SvelteKit) |
| `drizzle/` | SQL-Migrationen |

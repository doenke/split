# Split

Selbst gehostete PWA, um gemeinsame Ausgaben in Gruppen fair aufzuteilen – für Reisen, Familien und Freunde.
Das Konzept steht in [`docs/KONZEPT.md`](docs/KONZEPT.md).

## Stand (Phase 1)

- Anmeldung per OIDC (nur OIDC-Nutzer legen Gruppen an), Gäste per persönlichem Link + Passkey – ohne Passwort
- Personen ohne Login (z.B. Kinder), Standard-Faktor pro Person, Teilnahmezeitraum, Nachzügler-Dialog
- Ausgaben mit den Aufteilungen *Alle*, *Alle außer …*, *Nur …*, *Individuell* (Anteile, Prozent, Beträge),
  mehreren Zahlern, privatem Anteil und Aufteilung nach Aufenthaltsdauer (Nächte/Tage)
- Fremdwährungen mit EZB-Kursen, manuellem Kurs oder tatsächlich abgebuchtem Betrag
- Kategorien, Salden pro Kasse, Ausgleichsvorschläge (vereinfacht oder direkt), Zahlungen mit Bestätigung
- Änderungsverlauf, PWA (installierbar, Offline-Lesezugriff), Docker-Image mit Healthcheck

## Betrieb mit Docker Compose

```bash
cp .env.example .env    # Werte anpassen
docker compose up -d
```

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

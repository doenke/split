# Hinweise für die Arbeit an diesem Repository

- Entwickelt wird direkt auf `main`.
- **Bei jeder Änderung, die gepusht wird, die Version in `package.json` erhöhen** (Semver: Patch für
  Korrekturen, Minor für neue Funktionen) und einen Eintrag in `CHANGELOG.md` ergänzen.
- Vor dem Push: `npm run check`, `npm test`, `npm run build`.
- Nach Schemaänderungen in `src/lib/server/db/schema.ts`: `npm run db:generate` (Migrationen laufen beim Start).
- UI-Texte sind Deutsch, Code und Kommentare Englisch. Geldbeträge immer als Integer in der kleinsten Einheit.
- Das Konzept steht in `docs/KONZEPT.md`.

# Changelog

Die Version steht in `package.json`, wird bei jeder Änderung erhöht und ist in der App unten auf jeder
Seite sowie unter `/api/health` zu sehen. Docker-Images gibt es als `latest` und mit der Versionsnummer.

## 0.6.0
- Gruppenadmins können jede Person einzeln oder alle auf einmal abschließen (und wieder öffnen) –
  auch Personen ohne Login

## 0.5.0
- Versionsnummer in der App, im Healthcheck und als Docker-Tag
- Sauberes Neuladen nach Server-Updates: offene Apps erkennen eine neue Version, laden beim nächsten
  Seitenwechsel bzw. beim Zurückkehren in die App neu (nicht mitten in einer Eingabe) und zeigen sonst
  einen Hinweis „Neue Version – jetzt neu laden“

## 0.4.0
- „Ich habe alles eingetragen“ für sich oder die ganze Kasse; wenn alle fertig sind, steht die Endabrechnung
- Aufteilung nach Aufenthaltsdauer: Nächte oder Tage deutlicher wählbar, Anzahl pro Person sichtbar

## 0.3.0
- Gruppen-Einladungslink „Wer bist du?“, Gerät koppeln, Gruppe als Vorlage, Papierkorb
- Abrechnung abschließen, CSV-Export, druckbare Abrechnung
- Push-Benachrichtigungen und Zahlungserinnerungen, Offline-Erfassung

## 0.2.0
- Gemeinsame Kassen mit Verrechnung über Gruppen, Merkmale und Profile
- Zahlungsdaten mit Wero, GiroCode und PayPal, Belegfotos, Kostenübersicht

## 0.1.0
- Erste Version: Gruppen, Ausgaben mit Aufteilungsregeln und Faktoren, Fremdwährungen, Salden,
  Gast-Login per Link und Passkey, OIDC, PWA, Docker

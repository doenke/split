# Changelog

Die Version steht in `package.json`, wird bei jeder Änderung erhöht und ist in der App unten auf jeder
Seite sowie unter `/api/health` zu sehen. Docker-Images gibt es als `latest` und mit der Versionsnummer.

## 0.26.0
- Persönliche Zugangslinks sind jetzt mehrfach nutzbar: Der Link ist der Schlüssel, jede Nutzung verlängert ihn auf
  90 Tage. Ein neu erstellter Link ersetzt den alten. Der Link zum Koppeln eines weiteren Geräts bleibt einmalig
- Einladungsseiten erklären: kein Konto nötig – einfach den Link wieder öffnen oder einen Passkey speichern

## 0.25.1
- `ADMIN_EMAILS` wieder entfernt; Instanz-Admins kommen nur über `OIDC_ADMIN_GROUP`
- Compose-Beispiel: `OIDC_SCOPES` enthält jetzt `groups`, damit der Login-Anbieter die Gruppen mitschickt

## 0.25.0
- Neue Personen mit Vorname und (optionalem) Nachname – in der Gruppe, in der Kasse und beim Beitreten über den
  Gruppenlink. Gibt es den Namen schon (in der Gruppe/Kasse oder unter den bekannten Personen), kommt ein Hinweis,
  die bekannte Person zu wählen oder den Nachnamen zu ergänzen
- `OIDC_ADMIN_GROUP` hat jetzt den Standardwert `admins`

## 0.24.0
- Admin: „Personen verwalten“ (im Profil, nur für Instanz-Admins) – Personen deaktivieren und wieder aktivieren.
  Deaktivierte werden nirgends mehr als „bekannte Person“ angeboten; Gruppen, Kassen und Salden bleiben erhalten
- Instanz-Admins lassen sich jetzt auch per `ADMIN_EMAILS` festlegen (statt oder zusätzlich zu `OIDC_ADMIN_GROUP`),
  wirksam beim nächsten Login

## 0.23.0
- Gruppenübersicht nach Status gruppiert: „Laufend“, „Abgerechnet“ und – zugeklappt – „Archiviert“

## 0.22.0
- Kassen für andere anlegen (z.B. für befreundete Familien): beim Anlegen „Ich gehöre selbst dazu“ abwählen. Du
  verwaltest die Kasse dann, ohne mitzurechnen, und kannst sie in Gruppen als „Ganze Kasse“ hinzufügen. Die erste
  hinzugefügte Person wird Verwalter und Zahlungsempfänger

## 0.21.0
- Salden: „+ Zahlung eintragen“ für beliebige Zahlungen zwischen Personen bzw. Kassen der Gruppe – z.B. Bargeld,
  das jemand braucht, oder eine Teilzahlung –, mit Von, An, Betrag, Art und Datum. Wird mit den Salden verrechnet
- Beim Ausgleich („Bezahlt“) ist deutlicher, dass auch ein Teilbetrag eingetragen werden kann

## 0.20.0
- Kassen automatisch: Sind mindestens zwei Personen einer Kasse in derselben offenen Gruppe, rechnen sie dort über
  die Kasse ab – nach dem Hinzufügen einer Person zur Kasse, einer Person zur Gruppe oder einer ganzen Kasse.
  Umgestellt wird nur, wer bisher „sich allein“ abrechnet; abgeschlossene und archivierte Gruppen bleiben, ebenso
  Personen mit schon eingetragenen Zahlungen. Ein Pop-up zeigt, was umgestellt wurde
- Kasse: das Kästchen „In Gruppen übernehmen“ beim Hinzufügen entfällt (passiert jetzt automatisch)

## 0.19.0
- Updates kommen zuverlässiger an: eine offene App lädt die neue Version, sobald sie erkannt ist (spätestens nach
  einer Minute) – außer man tippt gerade etwas, dann beim nächsten Seitenwechsel. Vorher wird jeweils auch der neue
  Service Worker geholt; beim Zurückkehren in die App wird er ebenfalls geprüft

## 0.18.0
- Salden: gemeinsame Kassen (z.B. Familien) zeigen ihre Personen eingerückt darunter, jeweils mit „bezahlt“ und
  „Anteil“; der Saldo steht weiterhin bei der Kasse

## 0.17.0
- Wero-Zahlungslink entfernt (die Links der Banking-Apps laufen nach kurzer Zeit ab). Für Wero bleibt die
  E-Mail-Adresse bzw. Handynummer; gespeicherte Links werden gelöscht

## 0.16.0
- Wero: Zahlungslinks aus der Banking-App laufen ab (Sparkasse: nach 30 Tagen). Im Profil gibt es dafür „Link gültig
  bis“ (bei einem neuen Link auf 30 Tage vorbelegt, leer = läuft nicht ab). Abgelaufene Links werden beim Bezahlen
  nicht mehr angezeigt, das Profil weist darauf hin. E-Mail/Handynummer bleibt der dauerhafte Weg

## 0.15.1
- Kamera-Button sieht jetzt genauso aus wie der Plus-Button (gleiche Größe und Farbe)

## 0.15.0
- „📲 Als App installieren“: auf der Startseite (lässt sich mit „Nicht jetzt“ ausblenden) und im Profil unter „App“.
  Android/Chrome/Edge öffnen direkt den Installationsdialog, auf dem iPhone erklärt der Knopf den Weg über
  „Teilen → Zum Home-Bildschirm“. Läuft Split schon als App, verschwindet der Knopf

## 0.14.1
- Kamera: Kam beim Zurückkehren aus der Kamera gerade eine neue Server-Version, lud die App neu und das Foto ging
  verloren. Solange Kamera oder Dateiauswahl offen sind, wartet das Neuladen jetzt
- Startseite: Gruppen zeigen die Zahl der vorbereiteten Ausgaben („📷 1 vorbereitet“)

## 0.14.0
- Docker: der Container setzt beim Start die Rechte des Upload-Ordners selbst (z.B. bei Bind-Mounts, die root gehören)
  und läuft danach als Benutzer `node` – vorher scheiterten Fotos dann mit „Internal Error“
- Fehler beim Hochladen von Fotos werden verständlich angezeigt (auch ein zu kleines Upload-Limit im Reverse-Proxy);
  `/api/health` meldet, ob der Upload-Ordner beschreibbar ist

## 0.13.0
- Kamera-Button neben dem Plus: Bon direkt im Laden fotografieren. Daraus wird eine „vorbereitete“ Ausgabe (nur Foto,
  Datum, Zahler), die später vervollständigt wird – automatisch ausgelesen (läuft schon im Hintergrund) oder von Hand.
  Vorbereitete Ausgaben zählen noch nicht; solange es welche gibt, wartet die Endabrechnung
- Fremdwährung: „Abgebuchten Betrag später nachtragen“ – erst mit Tageskurs erfassen, den Euro-Betrag aus der
  Kreditkartenabrechnung dann in der Gruppe unter „Abgebuchten Betrag nachtragen“ eintragen
- Gewichtung als kompaktes Kästchen „Alle gleich gewichten“ statt großem Umschalter

## 0.12.0
- Ausgabe erfassen vereinfacht: die Merkmal-Auswahl ist wieder raus (bestehende Ausgaben behalten ihre Aufteilung)
- Profile haben einen eigenen Menüpunkt; neue Profile starten mit „Bestimmte Personen“, neue Gruppen bekommen
  keine vorgefertigten Profile mehr
- Faktoren sichtbar: bei jeder beteiligten Person steht ihr Faktor (×0,5), ein Tipp zeigt, woher er kommt;
  auch in der Detailansicht einer Ausgabe
- Privater Anteil: Rechnung „Betrag − privat = wird geteilt“ direkt am Eingabefeld

## 0.11.0
- Abrechnung (PDF): alle Ausgaben mit dem Anteil jeder Person, dazu Summen für Anteil, bezahlt und Saldo;
  Druck im Querformat, die Tabelle beginnt auf einer neuen Seite
- Druck: Versionszeile und grauer Hintergrund erscheinen nicht mehr im PDF

## 0.10.0
- Ausgaben-Profile mit bestimmten Personen und eigenen Faktoren (z.B. „Mietwagen“: Anna ×2, Sönke)
- Ausgabe: Schalter „Voreingestellte Faktoren“ / „Alle gleich“ für die Gewichtung
- Das automatische Merkmal „alle“ wurde wieder entfernt – auch aus bestehenden Mitgliedern, Profilen und Ausgaben

## 0.9.0
- Bon-Erkennung: Fotos und PDFs von Kassenbons werden mit Claude (Anthropic) ausgelesen – Händler, Datum,
  Betrag, Währung, Kategorie-Vorschlag und Positionen füllen das Formular vor
- Positionen eines Bons an- oder abwählen; abgewählte Posten werden zum privaten Anteil. Die Auswahl bleibt am
  Beleg gespeichert und kann später geändert werden
- Aktiv, sobald `ANTHROPIC_API_KEY` gesetzt ist (abschaltbar mit `RECEIPT_OCR_ENGINE=none`)

## 0.8.0
- Ausgabe anlegen: Aufteilung direkt nach Merkmal – „Nur Kinder“, „Nur Erwachsene“ (alle ohne „Kind“) und jedes
  weitere Merkmal der Gruppe, mit Anzahl der Personen
- Fix: Beim Hinzufügen mehrerer Personen blieben die Merkmale der vorigen Person ausgewählt

## 0.7.0
- Jedes Mitglied bekommt automatisch das Merkmal „alle“ (pro Person entfernbar, in Profilen nutzbar);
  bestehende Mitglieder erhalten es beim Update
- Mitgliederliste: lange Namen und viele Merkmale brechen in die nächste Zeile um statt abgeschnitten zu werden
- Gruppen-Reiter passen auch auf schmalen Handys in eine Zeile

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

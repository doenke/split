# Changelog

Die Version steht in `package.json`, wird bei jeder Änderung erhöht und ist in der App unten auf jeder
Seite sowie unter `/api/health` zu sehen. Docker-Images gibt es als `latest` und mit der Versionsnummer.

## 0.39.0
- Neue Variable `OIDC_PROVIDER_NAME` (z. B. „Pocket ID“): Der Login-Button heißt dann „Mit Pocket ID anmelden“, die Texte „Angemeldet über Pocket ID“
- `OIDC_BUTTON_LABEL` ist veraltet: Es wird nur noch gelesen, solange `OIDC_PROVIDER_NAME` fehlt, und beim Start gibt es einen Hinweis im Log

## 0.38.9
- Der Login-Anbieter heißt in allen Texten so wie auf dem Login-Button (z. B. „Angemeldet über Pocket ID“); abgeleitet aus `OIDC_BUTTON_LABEL`, überschreibbar mit `OIDC_PROVIDER_NAME`

## 0.38.8
- Titelzeile aufgeräumt: nur noch Logo (zur Gruppenübersicht) und Profilbild – „Gruppen“ und „Kassen“ sind raus, Kassen findest du im Profil

## 0.38.7
- Standardkategorie „Sprit“ entfernt – Ausgaben damit zählen jetzt zu „Transport“

## 0.38.6
- Standardkategorie „Aktivitäten“ entfernt – Ausgaben damit zählen jetzt zu „Eintritt“

## 0.38.5
- Aufgeräumt: die einmalige Umrechnung der früheren Merkmale beim Start und die alte Seite `/willkommen` entfallen
  (alle Instanzen sind darüber hinweg). Achtung: Ein Datenbank-Backup von vor 0.33.0 bitte zuerst mit 0.38.4 starten

## 0.38.4
- Gruppeneinstellungen: eigene Kategorie direkt unter der Kategorie-Auswahl anlegen; weitere Währungen als
  aufklappbare Liste zum Abhaken (mit Namen, z.B. „CHF Schweizer Franken“)

## 0.38.3
- Standardkategorien „Einkauf“ und „Sonstiges“ entfernt: Ausgaben mit „Einkauf“ zählen jetzt zu „Lebensmittel“,
  „Sonstiges“ wird zu „ohne Kategorie“

## 0.38.2
- Betragsfeld: Hinweis „minus = Erstattung“ entfernt, Währungssymbol mittig neben dem Feld

## 0.38.1
- Betragsfeld: kleine ±-Taste zum Umschalten auf Erstattung (die iPhone-Zahlentastatur hat kein Minus)

## 0.38.0
- Gruppeneinstellungen: „Weitere Währungen beim Erfassen“ – ohne Auswahl steht beim Betrag fest das Währungssymbol
  (z.B. €), sonst eine Auswahl. Gruppen ohne Einstellung bekommen die Fremdwährungen, die sie schon verwendet haben
- Gruppeneinstellungen: „Kategorien beim Erfassen“ an- und abwählen und eigene Kategorien (mit Symbol) anlegen;
  die Bon-Erkennung und der KI-Assistent schlagen nur diese vor
- Kategorie-Chips brechen um statt abgeschnitten zu werden

## 0.37.0
- Erstattungen: der Knopf „↩ Erstattung“ entfällt – ein negativer Betrag (z.B. „-3,50“) ist eine Erstattung

## 0.36.0
- Salden: oben „Wer zahlt wem“ mit Bezahlen/Bezahlt, darunter die Salden kompakt (Name, Balken, Betrag) –
  „bezahlt / Anteil“ und die Personen einer Kasse erscheinen nach einem Tipp
- Mitglieder: hinzufügen in einer Zeile (Name, Enter – der Cursor bleibt für die nächste Person im Feld); Faktor und
  „ab wann dabei“ unter „Optionen“; bekannte Personen und ganze Kassen über kleine Links darunter

## 0.35.0
Einfacher, nach dem Vorbild von Splid:
- Ausgabe erfassen: der Betrag steht oben und hat sofort den Fokus; „Wofür?“ ist optional (ohne Eingabe heißt die
  Ausgabe wie ihre Kategorie); Kategorien als Chips; Datum und Beleg stehen unter „Weiteres“ (bei vorhandenem Beleg offen)
- Drei Reiter: Ausgaben · Salden · Gruppe – unter „Gruppe“ liegen Mitglieder, Profile und Einstellungen
- Deutlich weniger Erklärtexte auf allen Seiten (Details stehen in der Hilfe)
- „Kassen“ erscheint oben nur noch, wenn man Kassen nutzt; sonst über Mitglieder („Familien oder Paare als Kasse
  zusammenfassen“) oder das Profil erreichbar

## 0.34.3
- Mitglieder: Admins können für Platzhalter (Personen ohne Zugang, z.B. Kinder) auch einen Anzeigenamen setzen

## 0.34.2
- Ausgabe bearbeiten: nach dem Speichern geht es zurück zur Detailansicht der Ausgabe (bei Fehlern bleibt das Formular offen)

## 0.34.1
- Mitglieder: nach „Zugangslink erstellen“ scrollt die Seite zum Link hoch

## 0.34.0
- Anzeigenamen: Überall steht der Vorname – gibt es ihn mehrfach, mit so vielen Buchstaben des Nachnamens, bis er
  eindeutig ist („Anna Ja.“, „Anna Je.“). Unter Profil → Name lässt sich ein eigener Anzeigename eintragen; einer, den
  es schon gibt (als Anzeige- oder voller Name), wird abgelehnt. Für Überweisung/GiroCode bleibt der volle Name

## 0.33.4
- Detailansicht einer Ausgabe: das Profil steht immer bei der Aufteilung (auch bei „Alle gleich“)
- Profil-Symbol: Auswahl aus einer Symbol-Tabelle statt Textfeld, eigene Emojis weiterhin möglich

## 0.33.3
- Profile: nur noch eine Zeile pro Profil – wer derzeit beteiligt ist (mit eigenem Faktor) und ob neue Mitglieder
  automatisch dabei sind
- Ausgabenübersicht: das Profil einer Ausgabe steht in der Zeile (z.B. „· 🍺 Alkohol“)

## 0.33.2
- Kategorie „Essen & Trinken“ heißt jetzt „Restaurant & Kneipe“ (auch in bestehenden Installationen)

## 0.33.1
- Erstattungen: „gezahlt an …“ statt „erhalten von …“ (Ausgabenliste, Detailansicht, Formular)

## 0.33.0
- Merkmale (z.B. „Kind“) komplett entfernt – zu kompliziert. Profile nennen die Personen jetzt direkt:
  „Bestimmte Personen“ oder „Alle (außer …)“, jeweils mit eigenen Faktoren
- Bestehende Profile und Ausgaben, die nach Merkmalen aufgeteilt haben, werden beim Update einmalig auf dieselbe
  Aufteilung nach Personen umgestellt (z.B. „ohne Kind“ → „Alle außer Lea, Tim“; „Kind zählt 1“ → Faktor 1 für Lea
  und Tim) – an den Abrechnungen ändert sich nichts

## 0.32.1
- Neue Kasse: „Ich gehöre selbst dazu“ ist nicht mehr vorausgewählt, wenn man schon in einer Kasse ist

## 0.32.0
- Kasse: „+ Person“ zeigt bekannte Personen als Liste mit Häkchen (Standard), filterbar nach „nur ohne Kasse“ und
  mit Suche; mehrere lassen sich auf einmal hinzufügen. Bei jeder Person steht, in welcher Kasse sie schon ist

## 0.31.0
- Einladungslinks (persönlich und für die Gruppe) haben einen „Kopieren“-Knopf
- Einladung in einem Schritt: nach „Ja, das bin ich“ (bzw. „Wer bist du?“) geht es direkt in die Gruppe. Dort zeigt
  eine Willkommen-Karte den Link zum Speichern und bietet einen Passkey an – die eigene Willkommensseite entfällt

## 0.30.1
- Ausgabe: eine Auswahl „Gewichtung“ – Faktoren, Alle gleich oder Aufenthalt (Nächte/Tage, auf Wunsch zusätzlich mit
  Faktoren) – statt Kästchen und getrennter Aufenthalts-Option

## 0.30.0
- Ausgabe erfassen aufgeräumt: „↩ Erstattung“ ist ein kleiner Schalter neben der Währung; „Bezahlt von“,
  „Aufgeteilt auf“ und „Weiteres“ (privater Anteil, Notiz) sind eingeklappt und zeigen eine Zusammenfassung
  (z.B. „Nur Anna, Ben · alle gleich · nach Nächten“). „Nach Aufenthaltsdauer“ steht jetzt unter „Aufgeteilt auf“
- Vorläufige Abrechnung (Salden und PDF) nennt, wer noch nicht abgeschlossen hat

## 0.29.0
- Abschließen nach Enddatum: Vor dem Enddatum (oder ohne Enddatum) steht der Abschluss-Hinweis nur als kleine Zeile
  („0 von 3 haben alles eingetragen · Abschließen …“), ab dem Tag nach dem Enddatum als große Karte
- Erinnerungs-E-Mail schon am Tag nach dem Enddatum, mit Knopf „Ich bin fertig – abschließen“, der ohne Anmeldung
  funktioniert (z.B. wenn man keine Ausgaben hatte)
- Solange nicht alle abgeschlossen haben, heißt es „Vorläufige Abrechnung, Stand heute“ (Salden, PDF); danach
  „Endabrechnung – steht seit …“ statt des unverständlichen „abgeschlossen bis“-Datums
- E-Mails können einen zweiten Knopf haben

## 0.28.1
- „verbraucht“ heißt jetzt überall „Anteil“ (Salden, Kassen, Abrechnung, Kostenübersicht)

## 0.28.0
- E-Mails per SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`):
  - Zugangslink beim Erstellen per E-Mail verschicken
  - Zahlungsaufforderung nach der Endabrechnung (mit IBAN/PayPal/Wero des Empfängers) und Zahlungserinnerung,
    wenn dich jemand erinnert – als einzige standardmäßig an
  - auf Wunsch: zu einer Gruppe hinzugefügt, neue Ausgabe, Zahlung zum Bestätigen, Erinnerung zum Abschluss (wenn das
    Enddatum vorbei ist, höchstens wöchentlich und dreimal), Endabrechnung, wöchentliche Erinnerung an offene Zahlungen
- Profil → E-Mails: eigene Adresse (wenn sie nicht vom Login-Anbieter kommt) mit Bestätigungslink, Auswahl der
  E-Mails, „Gar keine E-Mails“; jede E-Mail hat einen Abbestellen-Link
- Gruppen-Einstellungen: „Hintergrundgruppe“ – keine E-Mails zu dieser Gruppe
- Eine selbst eingetragene Adresse bleibt erhalten, wenn der Login-Anbieter keine mitschickt

## 0.27.0
- MCP-Server für KI-Assistenten (z.B. Claude) unter `/mcp`: Gruppen, Salden und Ausgaben lesen, Ausgaben eintragen
  (auch in Fremdwährung, mit Zahler, Beteiligten, Kategorie, Profil) und Zahlungen erfassen – mit den Rechten des
  Nutzers. Schlüssel im Profil unter „KI-Assistenten“ erzeugen und widerrufen
- Hilfe in der App (`/hilfe`, verlinkt in der Fußzeile und im Profil): Erklärung aller Funktionen und wie man den
  MCP-Server in Claude Code, Claude Desktop, Claude.ai und andere Clients einbindet

## 0.26.2
- Überall, wo der Passkey erklärt wird (Einladung, Gruppenlink, Willkommen, Profil), steht die allgemeine Adresse von
  Split, unter der man sich mit Passkey anmeldet

## 0.26.1
- Einladungs- und Willkommensseite zeigen die persönliche Link-Adresse zum Speichern als Lesezeichen, mit
  Kopieren-Knopf

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

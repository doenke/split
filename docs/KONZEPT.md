# Konzept: Split – Kosten in Gruppen fair aufteilen

> Status: **Entwurf v0.4** – Grundlage für Diskussion, noch keine Implementierung.
> Entscheidungen stehen in Kapitel 14, offene Fragen (❓) in Kapitel 15.

---

## 1. Vision

Eine selbst gehostete PWA (Docker), mit der Gruppen – z.B. Reisegruppen, WGs,
Vereinsausflüge – gemeinsame Ausgaben erfassen und fair aufteilen.

**Abgrenzung zu Splitwise / Tricount / Spliit:**

| Merkmal | Splitwise | Tricount | Spliit (OSS) | **Split** |
|---|---|---|---|---|
| Teilnahme ohne Account | ❌ | ✅ (pro Gruppe) | ✅ | ✅ gruppenübergreifend, ohne Passwort |
| Personen ohne Gerät (Kinder) | eingeschränkt | ✅ | ✅ | ✅ |
| **Gemeinsame Kassen (Familien)** | ❌ | ❌ | ❌ | ✅ gruppenübergreifend |
| Standard-Faktoren pro Person | ❌ | ❌ | ❌ | ✅ |
| Ausgaben-Profile (z.B. „Alkohol“) | ❌ | ❌ | ❌ | ✅ |
| Dynamische Aufteilung für Nachzügler | ❌ | ❌ | ❌ | ✅ |
| Self-Hosted / OIDC | ❌ | ❌ | ✅ / ❌ | ✅ / ✅ |

Kern-Alleinstellungsmerkmale:
1. **Kein Anmeldezwang** – Gäste kommen per Link + Passkey rein, ohne Passwort.
2. **Kassen** – Familien/Paare rechnen als Einheit ab, auch über mehrere Gruppen hinweg.
3. **Regelbasierte Aufteilung** – Ausgaben speichern *Regeln*, nicht feste Beträge.
   Dadurch werden später hinzugefügte Personen automatisch korrekt beteiligt.

---

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Person** | Ein Mensch im System. Global, also gruppenübergreifend. Kann ein Login haben – muss aber nicht. |
| **Konto (Login)** | Eine Anmeldemöglichkeit, die zu genau einer Person gehört: OIDC-Identität, Passkey oder Geräte-Token. |
| **Gruppe** | Ein Kontext, in dem Ausgaben anfallen (z.B. „Toskana 2027“). |
| **Mitgliedschaft** | Eine Person in einer Gruppe, mit Faktor, Merkmalen und Teilnahmezeitraum. |
| **Merkmal (Tag)** | Eigenschaft einer Person in der Gruppe, z.B. `Kind`, `Erwachsen`, `Vegetarier`, `Fahrer`. |
| **Profil** | Eine wiederverwendbare Aufteilungsvorlage einer Gruppe, z.B. „Alkohol: nur `Erwachsen`“. |
| **Ausgabe** | Ein Betrag, den jemand bezahlt hat, plus eine Aufteilungsregel. |
| **Kasse** | Eine Abrechnungseinheit aus einer oder mehreren Personen (z.B. „Familie Jacobs“). Gilt gruppenübergreifend. |
| **Ausgleich** | Eine Zahlung zwischen Kassen, um Salden auszugleichen. |

---

## 3. Benutzer & Anmeldung

### 3.1 Drei Arten von Personen

1. **OIDC-Nutzer** – melden sich über den konfigurierten Identity Provider an
   (Authentik, Keycloak, Authelia, Google, …). Name, E-Mail und **Avatar**
   (`picture`-Claim) kommen aus dem IdP. **Nur sie dürfen Gruppen anlegen.**
   Der **Text des Login-Buttons ist konfigurierbar** (z.B. „Mit Familien-Login
   anmelden“ statt „Mit OIDC anmelden“), damit Nutzer ihren Anbieter wiedererkennen.
2. **Gäste** – Personen ohne OIDC, die die App aber aktiv nutzen
   (Ausgaben erfassen, Salden sehen). Kein Passwort, kein Registrierungsformular.
3. **Platzhalter** – Personen, die sich nie anmelden (Kinder, Oma ohne Smartphone).
   Werden von anderen verwaltet. Ein Platzhalter kann jederzeit zum Gast werden,
   indem ihm ein Zugangslink geschickt wird.

Technisch ist das **ein und dieselbe Entität „Person“** – der Unterschied ist nur,
welche Konten mit ihr verknüpft sind. Ein Gast kann später auch eine OIDC-Identität
verknüpfen („Upgrade“), ohne Daten zu verlieren.

### 3.2 Die clevere Gast-Anmeldung: „Link + Passkey“

Ziel: Ein Gast tippt einmal auf einen Link und ist drin – dauerhaft, sicher, ohne Passwort.

**Ablauf beim ersten Mal:**

```
Organisator                         Gast
    │  legt Person „Anna“ an            │
    │  (Platzhalter)                    │
    │──── teilt Link / QR-Code ────────▶│  (WhatsApp, Signal, ausgedruckt …)
    │                                   │  öffnet Link
    │                                   │  „Hallo Anna! Bist du das?“  [Ja]
    │                                   │  „Dieses Gerät merken?“
    │                                   │    → Passkey anlegen (Face ID / Fingerabdruck)
    │                                   │    → Fallback: langlebiges Geräte-Cookie
    │                                   │  ✔ eingeloggt, App kann installiert werden
```

Zwei Arten von Links:

- **Persönlicher Link** (`/j/<einmaltoken>`): gehört zu genau einer Person.
  Einmal verwendbar (oder bis ein Passkey angelegt ist), läuft nach z.B. 14 Tagen ab.
  Am sichersten.
- **Gruppen-Einladungslink** (`/g/<token>`): „Wer bist du?“ – der Gast wählt
  sich aus der Liste der noch nicht beanspruchten Personen oder legt sich selbst
  neu an (wie bei Tricount, sehr bequem für große Gruppen). Bereits beanspruchte
  Personen sind gesperrt. Kann vom Organisator deaktiviert werden.

**Weitere Geräte / Gerät verloren:**

- **Gerät koppeln:** Auf einem eingeloggten Gerät „Neues Gerät hinzufügen“ →
  QR-Code (kurzlebig, 5 min) → mit dem zweiten Gerät scannen → dort Passkey anlegen.
- **Passkey-Sync:** Passkeys werden über iCloud-Schlüsselbund / Google
  Passwortmanager ohnehin oft synchronisiert.
- **Wiederherstellung:** Ein Gruppenadmin erzeugt einen neuen persönlichen Link.
- **Optional Magic-Link per E-Mail**, falls der Gast eine E-Mail hinterlegt hat
  (erfordert SMTP-Konfiguration, daher nur optional).

**Gruppenübergreifend:** Wenn Anna bereits auf ihrem Gerät eingeloggt ist und einen
Link zu einer *neuen* Gruppe öffnet, fragt die App: „Als Anna beitreten?“ – damit
bleibt Anna eine einzige Person über alle Gruppen hinweg (wichtig für Kassen).
Legt ein Organisator versehentlich eine zweite „Anna“ an, gibt es eine
**Personen-Zusammenführung** (Merge).

### 3.3 Avatare

- OIDC-Nutzer: `picture`-Claim, wird lokal gecacht (falls IdP nicht erreichbar).
- Gäste/Platzhalter: eigenes Foto hochladen oder generierter Avatar
  (Initialen + Farbe, oder z.B. DiceBear-Stil, lokal generiert).

### 3.4 Rollen & Rechte

| Aktion | OIDC-Nutzer | Gast | Platzhalter |
|---|---|---|---|
| Gruppe anlegen | ✅ | ❌ | – |
| Gruppe verwalten (Mitglieder, Profile, Einstellungen) | ✅ wenn Gruppenadmin | ✅ wenn zum Gruppenadmin ernannt | – |
| Ausgaben erfassen | ✅ | ✅ | über andere |
| Fremde Ausgaben bearbeiten | konfigurierbar pro Gruppe: *alle* / *nur Ersteller + Admins* | | |
| Personen hinzufügen | ✅ | ✅ (pro Gruppe abschaltbar) | – |
| Kassen anlegen & verwalten | ✅ | ✅ | – |
| Platzhalter verwalten (z.B. eigene Kinder) | ✅ | ✅ für Personen der eigenen Kassen | – |

**Lesen:** Jedes Gruppenmitglied sieht alle Ausgaben, Belege und Salden der Gruppe.

Der Ersteller einer Gruppe ist automatisch Gruppenadmin und kann weitere
Personen – auch Gäste – zu Gruppenadmins ernennen. Das **Anlegen** neuer
Gruppen bleibt OIDC-Nutzern vorbehalten.

Instanzweit gibt es zusätzlich einen **Instanz-Admin** (über OIDC-Gruppe/Claim
festgelegt), der z.B. die OIDC-Nutzer sieht und die Instanz konfiguriert.

---

## 4. Gruppen & Mitgliedschaften

Eine Gruppe hat:
- Name, Bild/Emoji, Beschreibung
- **Basiswährung** (z.B. EUR) – siehe Fremdwährungen
- optional Zeitraum (Reise vom … bis …)
- Kategorien, Profile, Merkmale (gruppenspezifisch, mit Vorlagen)
- Status: *aktiv* → *abgerechnet* → *archiviert*

**Gruppe als Vorlage:** Eine bestehende Gruppe kann kopiert werden
(„Sommerurlaub 2028 wie 2027“). Übernommen werden wahlweise Personen samt
Kassenzuordnung, Faktoren, Merkmale, Profile und Kategorien – keine Ausgaben.
Weil Personen gruppenübergreifend existieren, sind alle sofort wieder dabei und
müssen nicht neu eingeladen werden.

Eine **Mitgliedschaft** hat:
- **Standard-Faktor** (Default `1.0`, z.B. Kind `0.5`, Kleinkind `0`)
- **Merkmale** (`Kind`, `Erwachsen`, `Vegetarier`, …)
- **Teilnahmezeitraum** (optional `von` / `bis`) – z.B. „kommt erst Dienstag nach“
- **Kasse** in dieser Gruppe – genau eine, gewählt aus den Kassen der Person (siehe Kapitel 7)

### Nachzügler

Wenn eine Person zu einer Gruppe hinzugefügt wird, die schon Ausgaben hat, fragt die App:

> **Max an bisherigen Ausgaben beteiligen?**
> ◉ Ja, an allen „Alle“-Ausgaben (Teilnahme ab Gruppenbeginn)
> ○ Erst ab heute
> ○ Ab Datum: [__]
> ○ Einzeln auswählen …

**Default ist „an allen beteiligen“** – wer die Frage einfach bestätigt, wird an
allen bisherigen „Alle“-/„Alle außer“-Ausgaben beteiligt.

Technisch wird dabei nur der `teilnahme_von`-Zeitpunkt gesetzt (bzw. bei
„einzeln auswählen“ die betroffenen Ausgaben angepasst). Weil Ausgaben Regeln
speichern, rechnet sich alles automatisch neu.

---

## 5. Ausgaben & Aufteilung (Herzstück)

### 5.1 Ausgabe

- Titel, Betrag, Währung, Datum
- **Bezahlt von**: eine Person *oder* mehrere Personen mit Teilbeträgen
  (z.B. Anna 30 €, Ben 20 € an der Kasse)
- **Kategorie** (Essen, Unterkunft, Transport, …)
- **Aufteilungsregel** (siehe unten), optional über ein **Profil**
- Belege (Fotos/PDF), Notiz, Ort (optional)
- Typ: *Ausgabe*, *Einnahme/Erstattung* (z.B. Pfand zurück, Rückerstattung), *Ausgleich*

### 5.2 Aufteilungsregeln

Eine Ausgabe speichert **keine festen Beträge pro Person, sondern eine Regel**.
Die Anteile werden bei jeder Berechnung aus dem aktuellen Stand der Gruppe
abgeleitet.

| Regel | Wer ist beteiligt | Verhalten bei neuen Mitgliedern |
|---|---|---|
| **Alle** | alle Mitglieder, die am Ausgabedatum teilnehmen | werden automatisch einbezogen |
| **Alle außer …** | alle Teilnehmenden ohne die ausgeschlossenen | werden automatisch einbezogen |
| **Nur …** | nur explizit gewählte Personen | werden **nicht** einbezogen |
| **Merkmal** (über Profil) | alle Teilnehmenden mit/ohne Merkmal X | werden einbezogen, wenn Merkmal passt |
| **Individuell** | explizite Anteile, Prozente oder feste Beträge | statisch |

**Gewichtung:** Bei allen Regeln außer „Individuell (Beträge)“ wird nach Faktoren
gewichtet. Priorität:

```
Faktor = Override in der Ausgabe
      ?? Faktor im Profil (für Person oder Merkmal)
      ?? Standard-Faktor der Mitgliedschaft
      ?? 1.0
```

**Individuell** erlaubt auch Mischformen:
„Ben zahlt 12 € fix (hatte das Steak), der Rest wird nach Faktoren auf alle verteilt.“

### 5.3 Profile

Profile sind benannte Regelvorlagen einer Gruppe – sie machen das Erfassen schnell:

| Profil | Regel | Faktor-Overrides |
|---|---|---|
| **Standard** | Alle | – (Standard-Faktoren) |
| **Alkohol** 🍺 | Alle ohne Merkmal `Kind` | Nichttrinker → 0 |
| **Unterkunft** 🏠 | Alle | `Kind` → 1.0 (Kinder zahlen hier voll) |
| **Eintritt Erwachsene** | Merkmal `Erwachsen` | – |
| **Sprit** ⛽ | Nur Mitfahrer | – |

Ein Profil kann eine **Standard-Kategorie** vorschlagen. Beim Kassenbon-Scan
schlägt die KI Kategorie und Profil für die ganze Ausgabe vor.

### 5.4 Rechenbeispiel

Gruppe: Anna (1.0), Ben (1.0), Kind Lea (0.5), Kind Tim (0.5).
Ausgabe „Abendessen“ 90 €, Regel *Alle*:

```
Σ Faktoren = 1 + 1 + 0.5 + 0.5 = 3
Anna = 90 × 1/3   = 30,00 €
Ben  = 90 × 1/3   = 30,00 €
Lea  = 90 × 0.5/3 = 15,00 €
Tim  = 90 × 0.5/3 = 15,00 €
```

Später kommt Carla (1.0) hinzu, Teilnahme ab Gruppenbeginn → Σ = 4:
Anna/Ben/Carla je 22,50 €, Lea/Tim je 11,25 € – ohne dass jemand die Ausgabe anfasst.

**Rundung:** Alle Beträge werden intern als ganze Cent (Integer) gespeichert.
Rest-Cents werden deterministisch nach dem Largest-Remainder-Verfahren verteilt,
damit die Summe immer exakt stimmt.

### 5.5 Stabilität vs. Dynamik

Dynamische Regeln haben einen Nachteil: Ändert jemand Faktoren oder Mitglieder,
ändern sich auch alte Salden – auch nach bereits erfolgten Ausgleichszahlungen.

Lösung:
- Jede Änderung, die Salden verschiebt, zeigt vorher eine **Vorschau**
  („Annas Saldo ändert sich um −7,50 €“).
- **Abrechnung abschließen:** Ein Admin kann einen Stichtag setzen. Ausgaben
  davor werden „eingefroren“ (Anteile werden als Snapshot gespeichert und nicht
  mehr neu berechnet).
- Vollständiges **Änderungsprotokoll** (wer hat wann was geändert) – schafft Vertrauen.

### 5.6 Fremdwährungen

Auf Reisen zentral, daher Teil des MVP.

- Jede Gruppe hat eine **Basiswährung**; alle Salden und Ausgleichsvorschläge
  werden in ihr berechnet.
- Jede Ausgabe kann in **beliebiger Währung** erfasst werden. Gespeichert werden
  Originalbetrag, Originalwährung **und der verwendete Kurs** – der Kurs wird
  beim Erfassen festgeschrieben, damit sich Salden nicht täglich verschieben.
- **Kursquelle:** EZB-Referenzkurse (täglich, kostenlos, kein API-Key), auf dem
  Server zwischengespeichert. Vorschlag ist der Kurs am Ausgabedatum.
- **Tatsächlicher Betrag:** Alternativ zum Kurs kann der tatsächlich
  abgebuchte Betrag eingegeben werden („Karte belastet mit 47,12 €“) – der
  Kurs inkl. Bankgebühr ergibt sich daraus. Das ist der fairste Weg.
- **Offline:** Die PWA hält die letzten Kurse lokal vor; im Funkloch wird der
  letzte bekannte Kurs genutzt und als „vorläufig“ markiert.
- Die zuletzt genutzte Währung einer Gruppe wird beim Erfassen vorausgewählt
  (wer in der Schweiz ist, tippt meist CHF).
- **Ausgleich in Fremdwährung** ist möglich (z.B. bar in CHF zurückgezahlt) und
  wird zum Tageskurs umgerechnet.
- **Gruppenübergreifendes Verrechnen** zwischen Gruppen mit unterschiedlicher
  Basiswährung erfolgt zum aktuellen Kurs und wird vor dem Bestätigen angezeigt.
- Anzeige: Liste zeigt den Originalbetrag („42,00 CHF“) und klein den Betrag
  in Basiswährung („≈ 44,80 €“).

### 5.7 Zeitanteilige Aufteilung (z.B. Unterkunft)

Manche Ausgaben betreffen einen **Zeitraum** statt eines Tages: Das Ferienhaus
wird einmal für 14 Nächte bezahlt, wer erst Dienstag anreist, soll aber nur
seine Nächte zahlen.

- Eine Ausgabe kann optional einen **Leistungszeitraum** haben
  (z.B. 01.08.–15.08., Einheit *Nächte* oder *Tage*).
- Der Anteil jeder Person ergibt sich dann aus
  `Faktor × anwesende Nächte im Zeitraum`. Die Anwesenheit kommt aus dem
  Teilnahmezeitraum der Mitgliedschaft.
- Funktioniert mit allen Regeln und Profilen (z.B. „Alle außer …“ + Zeitraum).
- Ändert sich die Anreise einer Person, rechnet sich die Ausgabe automatisch neu.

Beispiel: Ferienhaus 1.400 € für 14 Nächte. Anna und Ben (je 1.0) sind alle
14 Nächte da, Carla (1.0) kommt nach 4 Nächten und bleibt 10:

```
Gewichte:  Anna 14, Ben 14, Carla 10   → Σ = 38
Anna  = 1.400 × 14/38 = 515,79 €
Ben   = 1.400 × 14/38 = 515,79 €
Carla = 1.400 × 10/38 = 368,42 €
```

---

## 6. Kategorien

- Vordefinierte Standardkategorien mit Icon & Farbe (Essen & Trinken, Lebensmittel,
  Unterkunft, Transport, Sprit, Aktivitäten, Eintritt, Einkauf, Sonstiges …)
- Pro Gruppe anpassbar (umbenennen, ausblenden, eigene hinzufügen)
- Auswertungen: Ausgaben pro Kategorie, pro Person, pro Kasse, pro Tag (Diagramme)
- **„Was hat uns die Reise gekostet?“** – eigene Ansicht pro Person und pro Kasse:
  der tatsächlich verbrauchte Anteil (nicht was bezahlt wurde und nicht nur der
  Saldo), aufgeschlüsselt nach Kategorien, z.B. „Familie Jacobs: 2.340 € gesamt,
  davon Unterkunft 980 €, Essen 720 €, …“. Auch über alle Gruppen einer Kasse
  hinweg, z.B. pro Jahr.
- Automatischer Kategorie-Vorschlag anhand von Titel / Händler auf dem Bon

---

## 7. Kassen

### 7.1 Idee

Eine **Kasse** fasst Personen zusammen, die nach außen als eine Einheit abrechnen –
typischerweise eine Familie oder ein Paar. Die Kasse ist **global**, d.h. die
„Kasse Familie Jacobs“ existiert unabhängig von Gruppen und wird in jeder Gruppe
verwendet, in der Familienmitglieder vorkommen.

- Jede Person hat immer eine implizite **Einzelkasse**.
- Eine Person kann **mehreren Kassen** angehören (z.B. Patchwork: Kind ist in
  der Kasse von Papa *und* in der von Mama; oder jemand ist in „Familie“ und
  in „WG“).
- **Pro Gruppe gilt genau eine Kasse je Person.** Sie wird beim Beitritt
  festgelegt:
  - gehört die Person nur ihrer Einzelkasse → Einzelkasse
  - gehört sie genau einer gemeinsamen Kasse → diese wird vorausgewählt
  - mehrere gemeinsame Kassen → Auswahl beim Hinzufügen; hat die Person eine
    **bevorzugte Kasse** markiert, wird diese vorausgewählt. Zusätzlich schlägt
    die App die Kasse vor, die in der Gruppe schon von anderen Kassenmitgliedern
    genutzt wird (Lea wird zusammen mit Papa hinzugefügt → Kasse „Papa & Kinder“).
- Ein Wechsel der Kasse innerhalb einer Gruppe ist möglich, verschiebt aber
  Salden (Vorschau wie in 5.5).
- **Kassen dürfen alle angemeldeten Personen anlegen** – OIDC-Nutzer und Gäste.
  Der Ersteller ist Verwalter und kann weitere Verwalter ernennen, Personen
  einladen und Platzhalter (z.B. Kinder) anlegen und pflegen.

### 7.2 Salden

```
Saldo(Person, Gruppe) = bezahlt − Anteil − erhaltene Ausgleiche + geleistete Ausgleiche
Saldo(Kasse, Gruppe)  = Σ Saldo(Person, Gruppe) aller Personen, deren
                        Mitgliedschaft in dieser Gruppe auf diese Kasse zeigt
Saldo(Kasse, gesamt)  = Σ Saldo(Kasse, Gruppe) über alle Gruppen
```

Weil pro Gruppe jede Person genau einer Kasse zugeordnet ist, wird kein Betrag
doppelt gezählt – auch wenn die Person global mehreren Kassen angehört.

Innerhalb einer Kasse ist egal, *wer* bezahlt hat – Anna zahlt fürs Essen,
Ben fürs Tanken, das ist familienintern. Nach außen zählt nur die Kasse.
Optional kann man in die Kasse „hineinzoomen“, um interne Salden zu sehen
(z.B. bei einem Paar, das intern doch auseinanderrechnet).

### 7.3 Ausgleich

- **Ausgleichsvorschläge** werden auf **Kassen-Ebene** berechnet und minimieren
  die Anzahl der Überweisungen (Greedy-Verfahren: größter Gläubiger ↔ größter
  Schuldner).
- **Gruppenübergreifendes Verrechnen:** Schuldet Familie A Familie B 50 € aus
  der Toskana-Reise, B aber A 30 € vom Skiwochenende, schlägt die App eine
  einzige Zahlung über 20 € vor.
  - Die Zahlung wird dann intern als zwei verknüpfte Ausgleichsbuchungen in den
    beiden Gruppen verbucht, sodass jede Gruppe für sich korrekt bleibt.
  - Nur möglich bei gleicher Währung bzw. mit festgelegtem Kurs.
  - **Datenschutz:** Gruppenübergreifende Salden sehen nur Mitglieder der
    beteiligten Kassen; Mitglieder einer Gruppe sehen keine Ausgaben anderer Gruppen.

### 7.4 Nicht geplant: „Gemeinsamer Topf“

Eine Reisekasse, in die alle einzahlen und aus der bezahlt wird, ist **nicht
vorgesehen**. Falls sie später doch gebraucht wird, ließe sie sich als
eigener Zahler-Typ „Topf“ nachrüsten, ohne das Datenmodell umzubauen.

---

## 8. Ausgleich bezahlen: PayPal, Wero & Co.

Für jeden Ausgleichsvorschlag gibt es einen Button „Jetzt bezahlen“. Dafür
hinterlegt jede Person ihre **Zahlungsdaten** im Profil:

| Feld | Pflicht | Verwendung |
|---|---|---|
| **Wero: E-Mail-Adresse oder Handynummer** | empfohlen | Wird angezeigt und kann kopiert werden. Damit lässt sich in jeder Wero-App Geld senden |
| **Wero: offener Zahlungslink** | optional | Wird als Button und QR-Code angezeigt (siehe unten) |
| **IBAN + Kontoinhaber** | empfohlen | Daraus erzeugt Split den **GiroCode** |
| **PayPal.me-Name** | optional | Daraus erzeugt Split den PayPal-Link |

Eine **Kasse** hat keine eigenen Zahlungsdaten. Stattdessen legt sie fest,
welches Mitglied Ausgleichszahlungen empfängt (z.B. Anna für „Familie Jacobs“).
Dessen Zahlungsdaten werden angezeigt. Zahlungsdaten sehen nur Personen, die mit
dem Inhaber in einer gemeinsamen Gruppe sind.

| Zahlungsweg | Umsetzung | Aufwand |
|---|---|---|
| **SEPA-Überweisung per GiroCode (EPC-QR)** | QR-Code nach EPC-Standard (EPC069-12) mit IBAN, Name, **Betrag** und Verwendungszweck („Split: Toskana 2027“). Wird lokal erzeugt, ohne externen Dienst. Funktioniert mit fast allen deutschen und österreichischen Banking-Apps, auch als Echtzeitüberweisung. Auf dem Handy zusätzlich: IBAN und Betrag zum Kopieren | gering |
| **Wero** | Es gibt kein öffentliches Format, mit dem eine fremde App Wero-Links oder -QR-Codes mit Betrag erzeugen kann. Split zeigt deshalb die hinterlegte **Wero-E-Mail-Adresse bzw. Handynummer** und den Betrag, jeweils mit Kopieren-Button. Ist zusätzlich ein **offener Wero-Zahlungslink** hinterlegt (in der Banking-App ohne festen Betrag erstellt), erscheint er als Button und QR-Code | gering |
| **PayPal** | `https://paypal.me/<name>/<betrag>EUR` öffnet PayPal mit vorausgefülltem Betrag | gering, keine API nötig |
| **Bar** | Nur als „bar bezahlt“ markieren | – |

**Zahlungserinnerung:** Beim Ausgleichsvorschlag hat der Empfänger einen
Button „Erinnern“. Er schickt dem Zahler eine Push-Benachrichtigung (bzw. zeigt
die Erinnerung beim nächsten Öffnen der App an). Damit es nicht nervt: höchstens
eine Erinnerung pro Tag und Zahlung.

Ablauf: Zahler klickt „bezahlt“ → Ausgleich wird als *ausstehend* gebucht →
Empfänger bestätigt (oder automatisch nach X Tagen). Eine echte
Zahlungsbestätigung über Bank-/PayPal-APIs ist für eine Self-Hosted-App
unverhältnismäßig aufwändig und wird nicht angestrebt.

---

## 9. Kassenbon: Foto & automatisches Auslesen

### 9.1 Stufe 1 – Beleg anhängen
- Foto direkt aus der PWA (Kamera) oder Datei/PDF hochladen
- Clientseitig verkleinern/komprimieren, Speicherung im Docker-Volume
  (optional S3-kompatibel)

### 9.2 Stufe 2 – Auslesen (das I-Tüpfelchen)
Erkannt werden sollen: **Händler, Datum, Gesamtbetrag, Währung** und optional
die **einzelnen Positionen**.

**Standard ist ein Vision-LLM via API (Claude).** Das ist die eleganteste
Lösung: keine lokale Hardware, sehr gute Erkennung auch von Positionen, und
die Ausgabe kommt direkt als strukturiertes JSON (Händler, Datum, Summe,
Positionen, Kategorie- und Profilvorschlag). Der Bon wird dafür an die API
übertragen; das wird in der App transparent angezeigt.

Die Engine bleibt austauschbar (Interface), damit später bei Bedarf eine
lokale Alternative ergänzt werden kann:

| Engine | Qualität | Datenschutz | Hardware |
|---|---|---|---|
| **Vision-LLM via API** (Claude) – *Standard* | sehr gut, auch Positionen | Bild verlässt den Server | keine |
| **Lokales Vision-LLM** (z.B. via Ollama) | gut | bleibt lokal | GPU empfohlen |
| **Klassische OCR** (Tesseract/PaddleOCR) + Heuristik | ok für Summe/Datum | bleibt lokal | gering |
| **Aus** | – | – | – |

Das Ergebnis wird **immer als Vorschlag** angezeigt und vom Nutzer bestätigt.

### 9.3 Positionen abwählen

Ein Bon wird **nicht** in mehrere Teilausgaben mit eigenen Regeln zerlegt. Das
würde Bedienung und Datenmodell stark aufblähen. Die erkannten Positionen dienen
nur dazu, einzelne Posten **an- oder abzuwählen**, z.B. um einen privaten Einkauf
herauszunehmen:

```
Edeka, 14.07.2027                    Bon: 87,40 €
  ☑ Brot, Käse, Obst, …                   61,20 €
  ☑ 2× Kiste Bier                         22,00 €
  ☐ Zeitschrift (privat)                   4,20 €
  ─────────────────────────────────────────────
  Gemeinsame Ausgabe:                     83,20 €
```

- Alle Positionen sind zunächst angewählt. Der Betrag der Ausgabe ist die Summe
  der angewählten Positionen, der Rest bleibt privat beim Zahler.
- Die Ausgabe selbst hat weiterhin **eine** Aufteilungsregel bzw. ein Profil.
- Weicht die Summe der erkannten Positionen vom Bon-Gesamtbetrag ab (z.B. Pfand,
  Rabatte, Lesefehler), zeigt die App den Unterschied als eigene Zeile
  „Differenz / nicht erkannt“ an, die ebenfalls an- oder abwählbar ist.
- Die Auswahl wird mit dem Erkennungsergebnis am Beleg gespeichert und kann
  später geändert werden. Gespeichert werden Bon-Gesamtbetrag und gemeinsamer
  Betrag, damit sichtbar bleibt, dass etwas herausgenommen wurde.
- Ohne Bon-Scan geht dasselbe von Hand: Gesamtbetrag eingeben und einen
  „privaten Anteil“ abziehen.

---

## 10. Weitere Funktionen

**Wichtig für Reisen:**
- **Offline-Fähigkeit:** Ausgaben im Funkloch erfassen, später synchronisieren
  (Service Worker + lokale Warteschlange). Für eine Reise-App sehr wichtig.
- **Push-Benachrichtigungen** (Web Push): „Ben hat 45 € fürs Abendessen eingetragen“,
  „Du hast 30 € von Anna erhalten“. Pro Person/Gruppe abschaltbar.

**Komfort:**
- Schnellerfassung: Betrag eintippen → Profil wählen → fertig (≤ 3 Taps)
- **PWA-Share-Target:** Bon-Foto aus der Galerie oder PDF-Rechnung aus der Mail
  direkt „an Split teilen“ → öffnet eine neue Ausgabe mit angehängtem Beleg
  (und startet die Bon-Erkennung)
- **App-Shortcuts:** Langes Drücken auf das App-Symbol → „Neue Ausgabe“,
  „Bon fotografieren“, zuletzt genutzte Gruppe
- Wiederkehrende Ausgaben (für WGs: Miete, Internet)
- Kommentare / Reaktionen an Ausgaben
- Suche & Filter (Person, Kategorie, Zeitraum, Profil)
- Mehrsprachigkeit (DE/EN zum Start)
- Dark Mode

**Daten & Betrieb:**
- Export: CSV, PDF-Abrechnung („Endabrechnung Toskana 2027“)
- Import aus Splitwise/Tricount (CSV) ❓
- Backup/Restore, Healthcheck-Endpoint
- **Papierkorb:** Gelöschte Ausgaben, Personen und Gruppen landen 30 Tage im
  Papierkorb und können von Gruppenadmins wiederhergestellt werden; danach
  endgültige Löschung
- REST-API (z.B. für Home Assistant / n8n-Automationen) ❓

**Datenschutz:**
- DSGVO: Personen- und Belegdaten löschbar, Platzhalter für Kinder
  enthalten nur Name + optional Avatar
- Konfigurierbare Aufbewahrung von Belegfotos

---

## 11. Datenmodell (Entwurf)

```
Person            (id, name, avatar, email?, created_at, merged_into?)
Credential        (id, person_id, typ: oidc|passkey|device_token, subject/public_key, last_used)
InviteToken       (id, person_id?|group_id?, typ: personal|group, expires_at, used_at)

Group             (id, name, emoji/bild, basiswaehrung, von?, bis?, status, settings, vorlage_von_group_id?, deleted_at?)
Membership        (group_id, person_id, rolle, faktor, teilnahme_von?, teilnahme_bis?, kasse_id)
                  -- kasse_id: genau eine Kasse pro Person und Gruppe; muss eine Kasse der Person sein
Tag               (id, group_id, name)               -- „Kind“, „Erwachsen“ …
MembershipTag     (membership_id, tag_id)

Kasse             (id, name, avatar, einzelkasse: bool, erstellt_von)   -- global
KassenMitglied    (kasse_id, person_id, verwalter: bool, bevorzugt: bool)
                  -- eine Person kann in mehreren Kassen sein

ExchangeRate      (datum, waehrung, kurs_zu_eur)      -- EZB-Cache

Category          (id, group_id?, name, icon, farbe) -- group_id NULL = Standard
Profile           (id, group_id, name, icon, regel_json, default_category_id?)

Expense           (id, group_id, titel, datum, betrag_cent, privat_anteil_cent, waehrung, kurs, kurs_quelle: ezb|manuell|tatsaechlich, betrag_basis_cent, typ,
                   category_id, profile_id?, regel_json?, zeitraum_von?, zeitraum_bis?, zeiteinheit?: tage|naechte,
                   notiz, erstellt_von, frozen, deleted_at?)
ExpensePayer      (expense_id, person_id, betrag_cent)
ExpenseShareSnapshot (expense_id, person_id, betrag_cent)   -- nur bei eingefrorenen Ausgaben
Attachment        (id, expense_id, pfad, mime, ocr_result_json?)   -- inkl. Positionen mit Flag angewählt/abgewählt

Settlement        (id, group_id, von_kasse_id, an_kasse_id, betrag_cent, status,
                   methode, link_id?)               -- link_id verknüpft gruppenübergreifende Verrechnung
PaymentDetails    (person_id, wero_kontakt?, wero_link?, iban?, kontoinhaber?, paypal_me?)
Kasse.empfaenger_person_id                   -- wer in der Kasse Ausgleiche empfängt
AuditLog          (id, group_id, person_id, aktion, vorher_json, nachher_json, zeit)
```

Beispiel `regel_json`:

```json
{
  "typ": "alle_ausser",
  "ausgeschlossen": ["person:ben"],
  "merkmal_filter": { "ohne": ["Kind"] },
  "faktor_overrides": { "tag:Kind": 1.0, "person:anna": 2.0 },
  "fixbetraege": { "person:ben": 1200 }
}
```

---

## 12. Technik

Es gibt keine Vorgaben zum Stack – festgelegt wird:

| Bereich | Entscheidung | Begründung |
|---|---|---|
| Frontend + Backend | **SvelteKit** (TypeScript) | eine Codebasis, SSR, sehr gute PWA-Unterstützung, schlank |
| Datenbank | **PostgreSQL** | Transaktionen, JSON-Felder; für die Zielgröße mehr als ausreichend |
| ORM | Drizzle | typsicher, Migrationen |
| OIDC | `openid-client` | Standard, PKCE |
| Passkeys | SimpleWebAuthn | etablierte WebAuthn-Bibliothek |
| PWA | Service Worker, Web App Manifest, Web Push (VAPID) | Installierbar, offline |
| Bon-Erkennung | Claude Vision via Anthropic SDK, hinter austauschbarem Interface | beste Qualität ohne lokale Hardware |
| Betrieb | **ein Docker-Image** + `docker-compose.yml` (App + Postgres), Konfiguration per ENV | einfach selbst zu hosten, hinter Reverse Proxy |

Wichtige Prinzipien:
- **Geld immer als Integer-Cent**, niemals Float.
- **Aufteilungslogik als reine, gut getestete Bibliothek** (ohne DB-Abhängigkeit),
  da sie das Herz der App ist.
- HTTPS ist Pflicht (Passkeys, Service Worker, Kamera funktionieren nur damit).

Beispiel-Konfiguration:

```env
PUBLIC_URL=https://split.example.de
DATABASE_URL=postgres://split:***@db/split
OIDC_ISSUER=https://auth.example.de/application/o/split/
OIDC_CLIENT_ID=split
OIDC_CLIENT_SECRET=***
OIDC_ADMIN_GROUP=split-admins
OIDC_BUTTON_LABEL="Mit Authentik anmelden"   # Text des Login-Buttons
RECEIPT_OCR_ENGINE=anthropic   # anthropic (Standard) | none – weitere Engines später
ANTHROPIC_API_KEY=***
```

---

## 13. Ausbaustufen

**Phase 1 – MVP**
- OIDC-Login, Gruppen anlegen, Personen/Platzhalter
- Gast-Login per persönlichem Link + Passkey/Geräte-Token
- Ausgaben mit Regeln Alle / Alle außer / Nur / Individuell, Faktoren
- Fremdwährungen (EZB-Kurse, Kurs festschreiben, tatsächlicher Betrag)
- Kategorien, Salden, Ausgleichsvorschläge (pro Gruppe, pro Person)
- PWA installierbar, Docker-Image

**Phase 2 – Alleinstellungsmerkmale**
- Kassen (inkl. gruppenübergreifender Salden)
- Merkmale & Profile
- Nachzügler-Dialog, Teilnahmezeitraum, zeitanteilige Aufteilung
- PayPal-Link, GiroCode, hinterlegter Wero-Zahlungslink
- Beleg-Fotos, Share-Target
- Kostenübersicht pro Person/Kasse

**Phase 3 – Komfort**
- Kassenbon-Erkennung inkl. Positionen an-/abwählen
- Offline-Modus, Push
- Gruppen-Einladungslink („Wer bist du?“), Geräte koppeln
- Gruppenübergreifendes Verrechnen, Abrechnung abschließen, Export
- Gruppe als Vorlage, Zahlungserinnerung, Papierkorb, App-Shortcuts

---

## 14. Entscheidungen

| # | Thema | Entscheidung |
|---|---|---|
| E1 | Nachzügler | Neue Personen werden standardmäßig an **allen** bisherigen „Alle“-Ausgaben beteiligt |
| E2 | Kassen-Zugehörigkeit | Eine Person kann in **mehreren Kassen** sein, pro Gruppe aber genau **einer** zugeordnet |
| E3 | Rechte von Gästen | Gäste dürfen Kassen anlegen, Personen hinzufügen und – wenn ernannt – Gruppen verwalten. Gruppen *anlegen* bleibt OIDC-Nutzern vorbehalten |
| E4 | Gemeinsamer Topf | Nicht geplant |
| E5 | Bon-Erkennung | Externe KI-API (Claude Vision) als Standard |
| E6 | Tech-Stack | Keine Vorgaben → SvelteKit + PostgreSQL + Docker |
| E7 | Fremdwährungen | Wichtig → Teil des MVP (Kapitel 5.6) |
| E8 | OIDC | Genau **ein** OIDC-Provider pro Instanz |
| E9 | Sichtbarkeit | Jedes Gruppenmitglied sieht **alle** Ausgaben, Belege und Salden der Gruppe |
| E10 | Größe | Familie & Freunde; Gruppen mit max. ca. 20 Personen |

**Konsequenzen aus E9/E10:**
- Kein feingranulares Rechtesystem für Lesezugriffe nötig – Gruppenmitglied = sieht alles.
  Andere Gruppen bleiben weiterhin unsichtbar (7.3).
- Salden können bei jedem Aufruf vollständig neu berechnet werden; Caching,
  Paginierung oder Vorberechnung sind nicht nötig. Das hält die dynamische
  Regel-Logik einfach.
- Bei max. 20 Personen ist der Ausgleichsalgorithmus (Greedy) unkritisch, und
  Auswahllisten („Nur …“, „Alle außer …“) passen ohne Suche auf einen Bildschirm.

## 15. Offene Punkte ❓

1. **Wero:** Wenn EPI ein offenes Format für Wero-Links oder -QR-Codes mit Betrag veröffentlicht, nutzen wir es statt des hinterlegten Links.

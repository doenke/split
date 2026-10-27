# Konzept: Split – Kosten in Gruppen fair aufteilen

> Status: **Entwurf v0.1** – Grundlage für Diskussion, noch keine Implementierung.
> Offene Fragen sind mit ❓ markiert und am Ende gesammelt.

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
| Gruppe verwalten (Mitglieder, Profile, Einstellungen) | ✅ wenn Gruppenadmin | ✅ wenn zum Admin ernannt ❓ | – |
| Ausgaben erfassen | ✅ | ✅ | über andere |
| Fremde Ausgaben bearbeiten | konfigurierbar pro Gruppe: *alle* / *nur Ersteller + Admins* | | |
| Personen hinzufügen | ✅ | konfigurierbar | – |
| Platzhalter verwalten (z.B. eigene Kinder) | ✅ | ✅ für Personen der eigenen Kasse | – |

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

Eine **Mitgliedschaft** hat:
- **Standard-Faktor** (Default `1.0`, z.B. Kind `0.5`, Kleinkind `0`)
- **Merkmale** (`Kind`, `Erwachsen`, `Vegetarier`, …)
- **Teilnahmezeitraum** (optional `von` / `bis`) – z.B. „kommt erst Dienstag nach“
- **Kasse** in dieser Gruppe (siehe Kapitel 7)

### Nachzügler

Wenn eine Person zu einer Gruppe hinzugefügt wird, die schon Ausgaben hat, fragt die App:

> **Max an bisherigen Ausgaben beteiligen?**
> ◉ Ja, an allen „Alle“-Ausgaben (Teilnahme ab Gruppenbeginn)
> ○ Erst ab heute
> ○ Ab Datum: [__]
> ○ Einzeln auswählen …

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
- optional **Positionen** (Teilausgaben, z.B. aus einem Kassenbon) mit eigener Regel
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
können Positionen automatisch einem Profil zugeordnet werden („Bier“ → Alkohol).

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

---

## 6. Kategorien

- Vordefinierte Standardkategorien mit Icon & Farbe (Essen & Trinken, Lebensmittel,
  Unterkunft, Transport, Sprit, Aktivitäten, Eintritt, Einkauf, Sonstiges …)
- Pro Gruppe anpassbar (umbenennen, ausblenden, eigene hinzufügen)
- Auswertungen: Ausgaben pro Kategorie, pro Person, pro Kasse, pro Tag (Diagramme)
- Automatischer Kategorie-Vorschlag anhand von Titel / Händler auf dem Bon

---

## 7. Kassen

### 7.1 Idee

Eine **Kasse** fasst Personen zusammen, die nach außen als eine Einheit abrechnen –
typischerweise eine Familie oder ein Paar. Die Kasse ist **global**, d.h. die
„Kasse Familie Jacobs“ existiert unabhängig von Gruppen und wird in jeder Gruppe
verwendet, in der Familienmitglieder vorkommen.

- Jede Person hat implizit eine **Einzelkasse**, solange sie keiner gemeinsamen
  Kasse angehört.
- Eine Person gehört standardmäßig zu genau **einer** Kasse.
  Pro Gruppe kann das überschrieben werden (z.B. Patchwork: Kind ist bei der
  Reise mit Papa in dessen Kasse, bei der Reise mit Mama in ihrer). ❓
- Kassen haben Verwalter (Personen mit Login), die Platzhalter der Kasse pflegen dürfen.

### 7.2 Salden

```
Saldo(Person, Gruppe) = bezahlt − Anteil − erhaltene Ausgleiche + geleistete Ausgleiche
Saldo(Kasse, Gruppe)  = Σ Saldo(Person, Gruppe) aller Kassenmitglieder
Saldo(Kasse, gesamt)  = Σ Saldo(Kasse, Gruppe) über alle Gruppen
```

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

### 7.4 Abgrenzung: „Gemeinsamer Topf“ ❓

Häufig gewünscht auf Reisen: Alle zahlen 100 € in eine Reisekasse, daraus wird
bezahlt. Das ist etwas anderes als die Familien-Kasse. Vorschlag: als eigener
„Zahler“ vom Typ **Topf** modellieren (Einzahlungen = Ausgleich an den Topf,
Ausgaben „bezahlt vom Topf“). → Kandidat für eine spätere Phase.

---

## 8. Ausgleich bezahlen: PayPal, Wero & Co.

Für jeden Ausgleichsvorschlag gibt es einen Button „Jetzt bezahlen“. Der
Empfänger hinterlegt dafür in seinem Profil (bzw. seiner Kasse) die
gewünschten Zahlungswege:

| Zahlungsweg | Umsetzung | Aufwand |
|---|---|---|
| **PayPal** | `https://paypal.me/<name>/<betrag>EUR` – öffnet PayPal mit vorausgefülltem Betrag | gering, keine API nötig |
| **SEPA-Überweisung (GiroCode / EPC-QR)** | QR-Code mit IBAN, Name, Betrag, Verwendungszweck – funktioniert mit fast allen Banking-Apps, inkl. Echtzeitüberweisung | gering |
| **Wero** | Wero bietet derzeit keine offene API bzw. standardisierte Bezahl-Links für P2P an. Pragmatisch: Handynummer/E-Mail des Empfängers + Betrag anzeigen, „Kopieren“-Button, ggf. Deep-Link in die Wero-App, sobald verfügbar. ❓ Zum Implementierungszeitpunkt neu prüfen | gering bis unklar |
| **Bar** | Nur als „bar bezahlt“ markieren | – |

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

Konfigurierbare Engines (Datenschutz!):

| Engine | Qualität | Datenschutz | Hardware |
|---|---|---|---|
| **Vision-LLM via API** (z.B. Claude) | sehr gut, auch Positionen | Bild verlässt den Server | keine |
| **Lokales Vision-LLM** (z.B. via Ollama) | gut | bleibt lokal | GPU empfohlen |
| **Klassische OCR** (Tesseract/PaddleOCR) + Heuristik | ok für Summe/Datum | bleibt lokal | gering |
| **Aus** | – | – | – |

Das Ergebnis wird **immer als Vorschlag** angezeigt und vom Nutzer bestätigt.

### 9.3 Stufe 3 – Positionen aufteilen
Der eigentliche Mehrwert: Aus einem Supermarkt-Bon werden Positionen erkannt,
die man einzeln Profilen/Personen zuordnen kann:

```
Edeka, 14.07.2027                         87,40 €
  ├─ Lebensmittel (Standard, Alle)        61,20 €
  ├─ 2× Kiste Bier  (Profil Alkohol)      22,00 €   ← automatisch vorgeschlagen
  └─ Zigaretten     (Nur Ben)              4,20 €
```

---

## 10. Weitere Funktionen (Vorschläge)

**Wichtig für Reisen:**
- **Fremdwährungen:** Ausgabe in CHF/USD/…, Umrechnung in Basiswährung zum Kurs
  am Ausgabedatum (z.B. EZB-Referenzkurse, offline zwischengespeichert) oder
  manuell eingegebener Kurs (der tatsächliche Kreditkartenkurs).
- **Offline-Fähigkeit:** Ausgaben im Funkloch erfassen, später synchronisieren
  (Service Worker + lokale Warteschlange). Für eine Reise-App sehr wichtig.
- **Push-Benachrichtigungen** (Web Push): „Ben hat 45 € fürs Abendessen eingetragen“,
  „Du hast 30 € von Anna erhalten“. Pro Person/Gruppe abschaltbar.

**Komfort:**
- Schnellerfassung: Betrag eintippen → Profil wählen → fertig (≤ 3 Taps)
- Wiederkehrende Ausgaben (für WGs: Miete, Internet)
- Kommentare / Reaktionen an Ausgaben
- Suche & Filter (Person, Kategorie, Zeitraum, Profil)
- Mehrsprachigkeit (DE/EN zum Start)
- Dark Mode

**Daten & Betrieb:**
- Export: CSV, PDF-Abrechnung („Endabrechnung Toskana 2027“)
- Import aus Splitwise/Tricount (CSV) ❓
- Backup/Restore, Healthcheck-Endpoint
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

Group             (id, name, emoji/bild, basiswaehrung, von?, bis?, status, settings)
Membership        (group_id, person_id, rolle, faktor, teilnahme_von?, teilnahme_bis?, kasse_override_id?)
Tag               (id, group_id, name)               -- „Kind“, „Erwachsen“ …
MembershipTag     (membership_id, tag_id)

Kasse             (id, name, avatar)                 -- global
KassenMitglied    (kasse_id, person_id, verwalter: bool)

Category          (id, group_id?, name, icon, farbe) -- group_id NULL = Standard
Profile           (id, group_id, name, icon, regel_json, default_category_id?)

Expense           (id, group_id, titel, datum, betrag_cent, waehrung, kurs, typ,
                   category_id, profile_id?, regel_json?, notiz, erstellt_von, frozen)
ExpensePayer      (expense_id, person_id, betrag_cent)
ExpenseItem       (id, expense_id, titel, betrag_cent, profile_id?, regel_json?)
ExpenseShareSnapshot (expense_id, person_id, betrag_cent)   -- nur bei eingefrorenen Ausgaben
Attachment        (id, expense_id, pfad, mime, ocr_result_json?)

Settlement        (id, group_id, von_kasse_id, an_kasse_id, betrag_cent, status,
                   methode, link_id?)               -- link_id verknüpft gruppenübergreifende Verrechnung
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

## 12. Technik (Vorschlag)

| Bereich | Vorschlag | Begründung |
|---|---|---|
| Frontend + Backend | **SvelteKit** (TypeScript), alternativ Next.js | eine Codebasis, SSR, sehr gute PWA-Unterstützung, schlank |
| Datenbank | **PostgreSQL**, optional SQLite für Mini-Installationen | Transaktionen, JSON-Felder |
| ORM | Drizzle | typsicher, Migrationen |
| OIDC | `openid-client` | Standard, PKCE |
| Passkeys | SimpleWebAuthn | etablierte WebAuthn-Bibliothek |
| PWA | Service Worker, Web App Manifest, Web Push (VAPID) | Installierbar, offline |
| OCR | austauschbares Interface, Engines siehe Kap. 9 | Datenschutz-Wahlfreiheit |
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
RECEIPT_OCR_ENGINE=anthropic   # none | tesseract | ollama | anthropic
ANTHROPIC_API_KEY=***
```

---

## 13. Ausbaustufen

**Phase 1 – MVP**
- OIDC-Login, Gruppen anlegen, Personen/Platzhalter
- Gast-Login per persönlichem Link + Passkey/Geräte-Token
- Ausgaben mit Regeln Alle / Alle außer / Nur / Individuell, Faktoren
- Kategorien, Salden, Ausgleichsvorschläge (pro Gruppe, pro Person)
- PWA installierbar, Docker-Image

**Phase 2 – Alleinstellungsmerkmale**
- Kassen (inkl. gruppenübergreifender Salden)
- Merkmale & Profile
- Nachzügler-Dialog, Teilnahmezeitraum
- PayPal-Link, GiroCode, Wero-Hinweis
- Beleg-Fotos

**Phase 3 – Komfort**
- Kassenbon-OCR inkl. Positionen
- Fremdwährungen, Offline-Modus, Push
- Gruppen-Einladungslink („Wer bist du?“), Geräte koppeln
- Gruppenübergreifendes Verrechnen, Abrechnung abschließen, Export

---

## 14. Offene Fragen ❓

1. **Gäste als Admins:** Darf ein Gast (ohne OIDC) Gruppen *verwalten*, wenn ein
   OIDC-Nutzer ihn dazu ernennt? Oder bleibt Verwaltung OIDC-Nutzern vorbehalten?
2. **Nachzügler-Default:** Soll eine neu hinzugefügte Person standardmäßig an
   allen bisherigen „Alle“-Ausgaben beteiligt werden, oder erst ab Beitritt?
3. **Kassen-Zugehörigkeit:** Reicht „eine Person = eine Kasse“ mit Override pro
   Gruppe, oder gibt es Fälle, in denen eine Person gleichzeitig in mehreren Kassen ist?
4. **Wer darf Kassen anlegen / Personen hinzufügen?** Kann Anna (Gast) selbst
   „Familie Müller“ anlegen und ihre Kinder dort eintragen?
5. **Gemeinsamer Topf** (Reisekasse zum Einzahlen) – gewünscht? Wenn ja, in welcher Phase?
6. **Fremdwährungen** schon im MVP?
7. **OCR-Engine:** Ist es okay, Bon-Fotos an eine externe KI-API zu schicken,
   oder soll es primär lokal laufen?
8. **Mehrere OIDC-Provider** oder genau einer?
9. **Sichtbarkeit:** Sieht jedes Gruppenmitglied alle Ausgaben und alle Salden,
   oder nur die eigenen?
10. **Instanzgröße:** Familie & Freunde (≤ 50 Personen) oder auch größere Vereine?
    Beeinflusst SQLite vs. Postgres und Performance-Überlegungen.
11. **Tech-Stack:** Gibt es Präferenzen (Sprache/Framework), z.B. weil du den Code
    selbst warten möchtest?

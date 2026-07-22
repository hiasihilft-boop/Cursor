# Hiasi hilft vor Ort – Auftragsbestätigung (App)

Digitale Version der Auftragsbestätigung von **Hiasi hilft vor Ort**
(Matthias Müller · Bürgermeister-Koeniger-Straße 12 · 86415 Mering).

Aus dem handschriftlichen Papier-Formular wurde eine schlanke Web-App, mit der
Aufträge direkt vor Ort am Handy oder Tablet erfasst, vom Kunden unterschrieben
und anschließend gedruckt bzw. als PDF gespeichert werden können.

## Funktionen

- Formular nach Vorlage: Nr., Datum, Uhrzeit, Kunde, Objekt, Leistungen,
  Material, Kontakt, Abrechnungsart und Betrag.
- **Leistungsbeschreibung** als Liste – Positionen beliebig hinzufügen/entfernen.
- **Abrechnung** wahlweise Pauschal oder Stundensatz; bei Stundensatz wird der
  Gesamtbetrag aus Stundensatz × geschätzten Stunden berechnet
  (gem. § 19 UStG ohne Umsatzsteuer).
- **Unterschriften** (Kunde + Hiasi) direkt per Finger/Maus auf dem Bildschirm.
- **Speichern** der Aufträge lokal im Browser (localStorage) – inkl. laufender
  Auftragsnummer.
- **Drucken / PDF** über die Druckfunktion des Browsers (Bedien-Elemente werden
  dabei automatisch ausgeblendet).
- Responsiv – funktioniert am Smartphone genauso wie am Rechner.

## Starten

Es ist kein Server und keine Installation nötig. Einfach `index.html` im Browser
öffnen. Für die Nutzung auf mehreren Geräten kann man die drei Dateien auf einen
beliebigen Webspace oder GitHub Pages legen.

Zum lokalen Testen mit kleinem Server:

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

## Dateien

- `index.html` – Aufbau des Formulars
- `styles.css` – Gestaltung (grün/orange wie das Original) + Druck-Layout
- `app.js` – Logik (Unterschrift, Speichern, Betragsberechnung, Drucken)

## Hinweise / Datenschutz

Alle Eingaben bleiben **lokal auf dem Gerät** (Browser-Speicher). Es werden keine
Daten an einen Server oder Dritte gesendet.

## Nächste mögliche Ausbaustufen

- Export einzelner Aufträge als Datei (Backup / Übertragung zwischen Geräten)
- Kundenliste / Wiederverwenden von Kontakten
- Echtes Logo statt Platzhalter im Kopf
- PDF-Erzeugung ohne Browser-Druckdialog

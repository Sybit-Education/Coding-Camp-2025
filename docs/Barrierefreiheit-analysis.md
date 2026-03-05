# Schritt-für-Schritt-Anleitung: Barrierefreie Integration in die Jubiläums-App (Coding Camp 2025)

## Projektüberblick

- **Name**: Coding Camp 2025 - 1200 Jahre Radolfzell
- **Framework**: Angular 19.2.14
- **Datenbank**: SurrealDB
- **URL**: [1200-jahre-radolfzell.sybit.education](https://1200-jahre-radolfzell.sybit.education)
- **Beschreibung**: Jubiläums-App für 1200 Jahre Radolfzell

## Accessibility-Audit (Februar 2025)

- **Interaktive Elemente**: Alle Admin-Tabellen (Events, Locations, Organizers) verwenden Buttons statt Dummy-Links (`src/app/pages/admin-*-overview/*.html`). Alle Click-Targets besitzen verständliche Texte oder `aria-labels`.
- **Dialoge**: Native `confirm`/`alert`-Aufrufe wurden vollständig durch das barrierefreie `ConfirmDialogComponent` (`src/app/component/confirm-dialog/confirm-dialog.component.*`) ersetzt. Dieses Component setzt `role="alertdialog"`, fokussiert automatisch die Primäraktion und lässt sich per Escape schließen.
- **Live-Regionen**: Kritische Statusmeldungen werden über `LiveAnnouncer` ausgesprochen (z. B. `src/app/pages/admin-event-overview/admin-event-overview.component.ts`, `.../admin-location-overview/...`, `.../location-edit/...`, `.../event-create/...`). Dadurch werden Lösch- und Speichervorgänge screenreader-freundlich angekündigt.
- **Warnhinweise**: Formularseiten zeigen statusrelevante Informationen in mit `role="status"` versehenen Bereichen an (z. B. verknüpfte Events bei Locations/Organizers).
- **Code-Guidelines**: Ein `rg`-Audit bestätigte, dass weder `href="javascript:void(0)"` noch `confirm()/alert()` noch vorkommen. Diese Checks sind als Pre-Commit-Task dokumentiert.

## Wichtige Datenbank-Entitäten

- **event:** id, name, date_start, date_end, description, organizer, event_type, location, topic, media
- **organizer:** id, name, email, phonenumber
- **event_type:** id, name, description
- **location:** id, name, street, city, zip_code, geo_point
- **media:** id, file, fileName, fileType
- **topic:** id, name, color
- **user:** id, name, password

---

## Schritt 1: Projektstruktur vorbereiten

1. **Komponente für Barrierefreiheitserklärung erstellen**
   - Beispiel: `ng generate component accessibility-statement`
2. **Route für `/barrierefreiheit` in der Angular-Routing-Konfiguration anlegen** ✔ erledigt
3. **Footer-Link zur Barrierefreiheitsseite überall einfügen**

## Schritt 2: Angular CDK a11y installieren und konfigurieren

1. **Bibliothek installieren:**
   ```bash
   npm install @angular/cdk
   ```
2. **A11yModule in App importieren:**
   ```typescript
   import { A11yModule } from '@angular/cdk/a11y';
   @NgModule({ imports: [A11yModule] })
   ```
3. **LiveAnnouncer und FocusTrap für dynamische Accessibility nutzen**

## Schritt 3: Barrierefreiheitserklärung implementieren

1. **Semantische HTML-Struktur nutzen** (z.B. `<main>`, `<header>`, `<nav>`, `<footer>`)
2. **ARIA-Landmarks definieren**
   - z.B. `role="navigation"`, `aria-label="Hauptnavigation"`, `role="main"`
3. **Feedback-Formular für Barriere-Meldungen einbauen**

## Schritt 4: Event-Liste und Event-Karten barrierefrei gestalten

1. **Keyboard-Fokus für Event-Karten sicherstellen**
2. **Alt-Texte für Event-Bilder setzen (aus media-Tabelle)**
3. **ARIA-Labels für Event-Infos verwenden**

## Schritt 5: Formulare zugänglich machen

1. **Alle Inputs mit Labels verknüpfen**
2. **Fehlermeldungen über `aria-live` ansagen lassen**
3. **Fokus-Management bei Validierung verbessern**

## Schritt 6: Navigation und Routing optimieren

1. **Skip-Navigation-Link für Hauptinhalt ergänzen**
2. **`ariaCurrentWhenActive` für aktive Links einsetzen**
3. **Seitentitel (`TitleService`) bei Routenwechsel aktualisieren**

## Schritt 7: Testing und Validierung

1. **Angular ESLint a11y rules aktivieren:**
   ```json
   {
     "extends": ["plugin:@angular-eslint/template/accessibility"]
   }
   ```
2. **Axe-core und Lighthouse für Accessibility-Audits nutzen**
3. **Manuelle Tastatur- und Screen Reader-Tests durchführen**

---

## Komponenten-spezifische Anforderungen

- **event_card:**
  - Fokussierbar mit Tastatur
  - Ausführliche Event-Beschreibung für Screen Reader
  - Alt-Texte aus media-Tabelle
  - Datum im zugänglichen Format
  - Preisangabe mit Währungsbezeichnung

- **event_filter:**
  - Tastatur-Navigation durch Filteroptionen
  - ARIA-Labels für Filter
  - Live-Announcement für Änderungen
  - Klare Markierung aktiver Filter

- **location_map:**
  - Alternative Textbeschreibung der Location anbieten
  - Tastatur-Navigation für interaktive Karte
  - Adresse als Standardtext zugänglich machen

---

## Best Practices für Accessibility in Angular

- Native HTML-Elemente bevorzugen (statt div/button)
- Alle Bilder und interaktiven Elemente mit Alt- und ARIA-Texten versehen
- Nutzern alternative Kontaktmöglichkeiten und Feedback-Form anbieten
- Barrierefreiheitserklärung regelmäßig aktualisieren und testen

---

**Weiterführende Ressourcen**

- [Angular Accessibility Guide](https://angular.dev/guide/accessibility)
- [WCAG 2.1 Checkliste (deutsch)](https://bfsg-gesetz.de)
- [SurrealDB Dokumentation](https://surrealdb.com/docs)

---

> Diese Anleitung unterstützt Sie dabei, die Barrierefreiheits-Anforderungen für das Jubiläums-App-Projekt mit Angular umzusetzen und gesetzeskonform zu gestalten. Ergänzend empfehlen sich Usability-Tests mit Endanwendern.

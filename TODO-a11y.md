# Barrierefreiheit (a11y) – Konsolidierte TODO-Liste

## Hohe Priorität

1. Semantische Struktur (Landmarks)
   - [x] App-Shell nutzt semantische Landmarks: <header>, <main id="main-content" role="main" tabindex="-1">, <footer> (app.component.html)
   - [ ] Komponenten prüfen und ggf. ergänzen (section/article/nav): HeaderComponent, FooterComponent (innerer Inhalt), BottomNavComponent, EventCardComponent

2. Tastaturnavigation
   - [x] Fokus-Styles vorhanden (Tailwind focus:ring auf .card, Buttons, Links)
   - [ ] Interaktive Karten/Slider/Carousels per Tastatur bedienbar machen (EventCarouselComponent, MapComponent)
   - [ ] Tab-Reihenfolge prüfen/optimieren, insbesondere BottomNavComponent

3. ARIA-Attribute
   - [x] Erste ARIA-Labels ergänzt (KategorieCard: aria-label; Live-Regionen/role für Updates/Spinner)
   - [x] aria-current für aktive Navigationslinks einsetzen (z. B. ariaCurrentWhenActive="page" bei Routerlinks)
   - [ ] aria-expanded/-controls für aufklappbare Bereiche ergänzen (falls vorhanden)

4. Alt-Texte für Bilder
   - [ ] Aussagekräftige alt-Texte für alle Bilder, speziell EventCard, Header-Logo, Detailseitenbilder
   - [ ] Falls rein dekorativ: alt="" setzen

5. Farbkontraste
   - [ ] Kontraste (Text/Icons vs. Hintergrund) nach WCAG AA prüfen (4.5:1 normal, 3:1 groß)
   - [ ] Bei Bedarf Farbwerte/Schriftstärken anpassen

## Mittlere Priorität

6. Skip-Link
   - [x] Skip-Link implementiert und sichtbar bei Fokus (styles.scss .skip-link)
   - [x] Fokus bei Navigation auf Hauptinhalt setzen (AppComponent → main.focus())

7. Formulare zugänglich machen
   - [ ] Labels jedem Input zuordnen (for/id oder aria-labelledby)
   - [ ] Fehlerzustände über aria-live/aria-invalid/aria-describedby ansagen
   - [ ] Autocomplete-Attribute setzen (z. B. email, name, tel)
   - [ ] Fokus-Management bei Validierungsfehlern (zum ersten fehlerhaften Feld springen)

8. Navigation & Routing
   - [x] Titelverwaltung: TitleService/TitleStrategy nutzen, Titel pro Route pflegen
   - [x] LiveAnnouncer für Seitenwechsel (polite) integriert
   - [ ] routerLinkActive + ariaCurrentWhenActive flächendeckend einsetzen (Header/Footer/BottomNav)

9. Dynamische Inhalte
   - [x] Ladeindikator mit aria-live="polite" und verstecktem Text (COMMON.LOADING)
   - [x] Update-Benachrichtigung als role="status" (polite)
   - [ ] Weitere dynamische Statusmeldungen (Filterwechsel, Suchtrefferzahl) über LiveRegion announcen

10. Responsive/Zoom
   - [ ] Nutzbarkeit bei 200% Zoom testen und sicherstellen (Layout bricht nicht, keine Overlays blockieren)

## Niedrigere Priorität

11. Barrierefreiheitserklärung
   - [x] Seite /barrierefreiheit vorhanden inkl. Grundinhalte (ACCESSIBILITY.*)
   - [ ] Feedback-Kanal/Formular einbauen (Kontakt-Link oder simples Formular mit Beschreibungen)

12. Animationen/Bewegungen
   - [ ] prefers-reduced-motion berücksichtigen (z. B. Spinner/Transitions reduzieren/deaktivieren)

13. Sprachattribute
   - [ ] lang-Attribut auf <html> dynamisch zur aktuellen Sprache setzen (I18nService/APP_INITIALIZER)

14. Karte/Map
   - [ ] Alternative Textbeschreibung der Location und Tastatur-Navigation für interaktive Karte
   - [ ] Adresse als Standardtext zugänglich machen (bereits teils vorhanden, prüfen)

15. Automatisierte A11y-Tests
   - [ ] Lint-Regeln für Templates: angular-eslint template/accessibility aktivieren
   - [ ] CI-Audits mit axe-core/Lighthouse
   - [ ] Manuelle Screenreader-Tests (NVDA/JAWS/VoiceOver) dokumentieren

## Technische Umsetzung (Status)

- Angular CDK a11y
  - [x] @angular/cdk installiert
  - [x] A11yModule global importiert (app.config.ts → importProvidersFrom)
  - [x] LiveAnnouncer in AppComponent im Einsatz (Seitenwechsel)
  - [ ] FocusTrap/FocusMonitor für Dialoge/Overlays einsetzen (falls vorhanden)

- I18n & Live-Region
  - [x] ngx-translate konfiguriert, TranslateModule eingebunden
  - [x] Texte ergänzt: COMMON.SKIP_TO_MAIN, COMMON.MAIN_CONTENT, COMMON.PAGE_UPDATED, etc.
  - [x] LiveAnnouncer-Elemente visuell versteckt (styles.scss: .cdk-visually-hidden, .cdk-live-announcer-element)

## Nächste Quick Wins

- [ ] ariaCurrentWhenActive="page" und routerLinkActive in Header/Footer/BottomNav ergänzen
- [ ] TitleService/TitleStrategy einführen, Route-Titel konsequent setzen/übersetzen
- [ ] Alt-Texte auf EventCard/Detailseiten ergänzen
- [ ] Form-Labels/Fehlermeldungen mit aria-Attributen verdrahten (Create/Edit-Formulare)
- [ ] prefers-reduced-motion in styles.scss berücksichtigen

## Referenzen

- Angular Accessibility Guide: https://angular.dev/guide/accessibility
- WCAG 2.1 Checkliste: https://www.w3.org/TR/WCAG21/
- SurrealDB Docs (Datenquelle, nicht a11y-spezifisch): https://surrealdb.com/docs

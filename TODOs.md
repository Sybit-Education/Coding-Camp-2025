# TODOs für das Angular‑20 Projekt

Basierend auf den Vorgaben aus `AGENTS.md` sind folgende Punkte offen:

## Angular 20 Konformität
- [x] `standalone: true` aus allen Komponenten entfernen (z. B. `src/app/pages/admin-event-overview/admin-event-overview.component.ts`, `src/app/component/organizer-input/organizer-input.component.ts`)
- [ ] Inputs/Outputs/Models komplett auf `input()/output()/model()` umstellen und `EventEmitter` ersetzen (z. B. Organizer-/Location-Input, Image-Upload)
- [ ] Alle `*ngIf`, `*ngFor`, `*ngTemplateOutlet`, `ngClass` etc. auf native Control-Flow-Syntax und Signal-basierte Bindings migrieren (z. B. Organizer-Edit, Image-Upload, Snack-Bar)
- [ ] Jede `@for`-Schleife mit stabilem `track`-Ausdruck (IDs) versehen
- [ ] Zustandsverwaltung in Komponenten (Organizer-/Location-Input, Home, Kategorie, Admin*-Übersichten) auf `signal/computed/effect` + OnPush + DestroyRef umstellen

## Internationalisierung
- [ ] Von `ngx-translate` auf `provideI18n`/`I18nService` wechseln und alle Hardcoded-Strings (Route-Titel, Buttons, Confirm/Alert-Texte, aria-labels) nach `assets/i18n` auslagern
- [ ] Systemweite Alerts/Bestätigungen durch übersetzte, a11y-konforme Dialoge ersetzen

## Tailwind & Styling
- [x] Tailwind Utility-First strikt anwenden und Custom-SCSS (z. B. `.card`, `.action-button`, `.tailwind-table` in `src/styles.scss` sowie component-spezifische `.scss`) abbauen bzw. in `@layer components` überführen

## Accessibility
- [x] Interaktive Elemente mit validen Semantik-Elementen (Buttons statt `href="javascript:void(0)"`) und übersetzten ARIA-Labels versehen
- [x] Live-Regionen/`LiveAnnouncer` für Statusmeldungen, Fokus-Management nach Dialogen und keine nativen `confirm/alert` Dialoge mehr

## SurrealDB & Datenfluss
- [ ] `SurrealdbService` um `signal`-basierte Verbindung, `liveQuery`, Disconnect-Handling und Auth-Flüsse erweitern
- [ ] Admin-Listen auf Live-Queries mit `DestroyRef`-Cleanup umstellen statt manueller Reloads

## Routing & Struktur
- [ ] Doppelte Route-Konfigurationen in `src/app/app.routes.ts` entfernen und Seitentitel dynamisch per i18n setzen

## Tests & Qualität
- [ ] Signal-/Control-Flow-Refactorings mit Unit-Tests absichern (besonders Form-/Listen-Komponenten)
- [ ] Accessibility-/i18n-Linting aktivieren (wie in AGENTS gefordert) und fehlende Regeln ergänzen

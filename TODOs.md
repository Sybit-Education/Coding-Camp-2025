# TODOs für das Angular 19 Projekt

Basierend auf den Anforderungen in `agents.md` fehlen noch folgende Komponenten oder Implementierungen:

## Internationalisierung (I18n)
- [x] `ngx-translate` ist installiert und konfiguriert
- [x] Übersetzungsdateien im `locale/` Verzeichnis vorhanden
- [x] Verwendung von `TranslateService` in den Komponenten
- [x] Build-Konfigurationen für mehrere Sprachen (de, en)

## Barrierefreiheit (A11y)
- [ ] Keine Skip-Links für Tastaturnavigation
- [ ] Unzureichende ARIA-Attribute in den Komponenten
- [ ] Kein explizites Fokus-Management implementiert
- [ ] Keine Verwendung von `LiveAnnouncer` oder `cdkTrapFocus` aus Angular CDK

## State Management
- [ ] Kein klares State Management (NgRx, ComponentStore oder Signals)
- [ ] Keine zoneless Change Detection implementiert

## Codequalität & Tests
- [ ] Keine ESLint-Regeln für i18n konfiguriert
- [ ] Unzureichende Unit-Tests
- [ ] Keine E2E-Tests mit Cypress

## Projektstruktur
- [ ] Keine klare Feature-basierte Architektur / Domain-Driven Design
- [ ] Unvollständige Ordnerstruktur (z.B. fehlendes `locale/` Verzeichnis)

## Performance & Optimierungen
- [ ] Keine explizite Verwendung von `OnPush` Change Detection
- [ ] Keine Vorbereitung für Server-Side Rendering (SSR)

## SurrealDB Integration
- [ ] Live-Query-Funktionalität nicht vollständigy implementiert
- [ ] Authentifizierung über SurrealDB nicht implementiert

## Nächste Schritte
1. Internationalisierung implementieren (höchste Priorität)
2. Barrierefreiheit verbessern
3. State Management einführen
4. Tests hinzufügen
5. Projektstruktur optimieren

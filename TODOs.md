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

## SEO & AI-Auffindbarkeit
- [x] SEO-Service für Meta-Tags und strukturierte Daten implementiert
- [x] Statische Sitemap.xml erstellt
- [x] Robots.txt mit AI-Crawler-Anweisungen konfiguriert
- [ ] Keine strukturierten Daten (JSON-LD) für Events in den Komponenten
- [ ] Keine dynamische Meta-Tag-Aktualisierung in den Komponenten
- [ ] Keine Canonical URLs für mehrsprachige Inhalte in den Komponenten
- [ ] Keine semantische HTML-Struktur für bessere Indexierung
- [ ] Keine Optimierung für Core Web Vitals (LCP, FID, CLS)

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
- [ ] Live-Query-Funktionalität nicht vollständig implementiert
- [ ] Authentifizierung über SurrealDB nicht implementiert

## Nächste Schritte
1. Internationalisierung implementieren (höchste Priorität)
2. SEO & AI-Auffindbarkeit verbessern
3. Barrierefreiheit verbessern
4. State Management einführen
5. Tests hinzufügen
6. Projektstruktur optimieren

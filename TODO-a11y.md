# Barrierefreiheit (a11y) TODO-Liste

Diese Liste enthält Aufgaben zur Verbesserung der Barrierefreiheit der 1200-Jahre-Radolfzell App, sortiert nach Priorität.

## Hohe Priorität

1. **Semantische HTML-Struktur überprüfen**
   - Sicherstellen, dass alle Komponenten semantisch korrektes HTML verwenden (header, nav, main, section, article, footer)
   - Besonders wichtig für: HeaderComponent, FooterComponent, BottomNavComponent

2. **Tastaturnavigation implementieren**
   - Sicherstellen, dass alle interaktiven Elemente mit der Tastatur bedienbar sind
   - Fokus-Styles für alle interaktiven Elemente hinzufügen
   - Tab-Reihenfolge logisch gestalten
   - Besonders wichtig für: EventCardComponent, KategorieCardComponent, BottomNavComponent

3. **ARIA-Attribute hinzufügen**
   - Fehlende aria-label für Icons und Buttons ohne Text hinzufügen
   - aria-expanded für aufklappbare Elemente implementieren
   - aria-current für aktuelle Navigation hinzufügen

4. **Alt-Texte für Bilder**
   - Sicherstellen, dass alle Bilder aussagekräftige Alt-Texte haben
   - Besonders wichtig für: EventCardComponent, HeaderComponent (Logo)

5. **Farbkontraste überprüfen**
   - Alle Text/Hintergrund-Kombinationen auf ausreichenden Kontrast prüfen (WCAG AA: 4.5:1 für normalen Text, 3:1 für großen Text)
   - Besonders wichtig für: EventCardComponent, KategorieCardComponent

## Mittlere Priorität

6. **Skip-Links implementieren**
   - Link zum Überspringen der Navigation zum Hauptinhalt hinzufügen
   - Besonders wichtig für Screenreader-Nutzer

7. **Formularelemente verbessern**
   - Labels für alle Formularelemente hinzufügen
   - Fehlermeldungen für Screenreader zugänglich machen
   - Autocomplete-Attribute verwenden, wo sinnvoll

8. **Responsive Design für Zoom**
   - Sicherstellen, dass die Anwendung bei 200% Zoom benutzbar bleibt
   - Text-Größen in relativen Einheiten (rem, em) definieren

9. **Screenreader-Tests durchführen**
   - Mit NVDA, JAWS oder VoiceOver die Anwendung testen
   - Besonders wichtig für: EventCarouselComponent, MapComponent

10. **Dynamische Inhalte zugänglich machen**
    - Live-Regions für dynamisch aktualisierte Inhalte verwenden
    - Statusänderungen für Screenreader ankündigen

## Niedrigere Priorität

11. **Dokumentation der Barrierefreiheit**
    - Barrierefreiheitserklärung erstellen
    - Bekannte Probleme dokumentieren

12. **Animationen und Bewegungen**
    - Möglichkeit zum Deaktivieren von Animationen anbieten (prefers-reduced-motion)
    - Besonders wichtig für: EventCarouselComponent

13. **Sprachattribute**
    - lang-Attribute für die Hauptsprache und abweichende Sprachinhalte setzen

14. **Barrierefreiheit der Karte verbessern**
    - Alternative Darstellung oder Textbeschreibung für die MapComponent anbieten
    - Tastaturzugänglichkeit für Karteninteraktionen implementieren

15. **Automatisierte Tests**
    - a11y-Tests in die CI/CD-Pipeline integrieren
    - axe-core oder ähnliche Tools einbinden

## Technische Implementierungshinweise

- Angular CDK a11y-Module für verbesserte Tastaturunterstützung verwenden
- @angular/cdk/a11y für FocusMonitor und LiveAnnouncer nutzen
- Erwägen Sie die Verwendung von ngAria
- Lighthouse oder axe DevTools für regelmäßige Tests verwenden

## Ressourcen

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [Angular Accessibility Guide](https://angular.io/guide/accessibility)
- [MDN Web Docs: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

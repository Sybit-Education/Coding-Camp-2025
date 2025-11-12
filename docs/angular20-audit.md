# Angular 20 Audit – Best Practices & Performance TODO-Liste

Stand: 2025-11-12

Diese Liste priorisiert Quick Wins und zeigt konkrete Verbesserungen mit Beispielen auf Basis der bereitgestellten Dateien.

## Prio A – Quick Wins (Fehler/Leaks/klare Verbesserungen)

1) [x] Typfehler in NavigationService – erledigt
- Status: Erledigt – `commands` ist korrekt typisiert (any[]).
- Datei: src/app/services/navigation.service.ts
- Ziel: `commands` korrekt typisieren (z. B. `any[]` oder `unknown[]` oder die Angular-Typen).
- Beispiel-Änderung:
  ```ts
  // vorher
  async navigateTo(commands: undefined[], extras?: NavigationExtras): Promise<boolean> {

  // nachher (minimal-invasiv und kompatibel)
  async navigateTo(commands: any[], extras?: NavigationExtras): Promise<boolean> {
  ```
- Bonus: Für „Zurück“-Navi ggf. Angular `Location` Service verwenden, um History-Edge-Cases zu vermeiden.

2) [x] Doppelte Routen entfernen – erledigt
- Status: Erledigt – Duplikate entfernt; Routen sind einmalig definiert.
- Datei: src/app/app.routes.ts
- Ziel: Duplikate entfernen, die Routen nur einmal definieren.
- Beispiel:
  - Entferne den zweiten Block für die drei Duplikate.

3) [x] Speicherleck vermeiden: IconComponent – erledigt
- Status: Erledigt – Subscription mit `take(1)`.
- Ziel: `take(1)` verwenden oder auf ein Signal/AsyncPipe umstellen.
- Beispiel-Änderung:
  ```ts
  this.registry.get(this.name).pipe(take(1)).subscribe({ ... })
  ```
  oder
  ```ts
  // per toSignal
  svg$ = toSignal(this.registry.get(this.name), { initialValue: null });
  ```

4) [x] SurrealdbService: Konsistentes Initialisieren vor allen DB-Operationen – erledigt
- Status: Erledigt – `deleteRow` initialisiert die Verbindung vor dem Löschen.
- Datei: src/app/services/surrealdb.service.ts
- Ziel: Vor jeder Operation sicherstellen, dass `await this.initialize()` ausgeführt wurde.
- Beispiel-Änderung:
  ```ts
  async deleteRow(recordId: RecordId<string> | StringRecordId) {
    await this.initialize();
    await super.delete(recordId);
  }
  ```

5) [x] I18n: Konsistenz von Sprache vs. Locale im DOM – erledigt
- Status: Erledigt – `lang` wird korrekt mit Sprachkürzel gesetzt und `data-locale` enthält das Locale.
- Ziel:
  - Attribut `lang` nur mit Sprachkürzel (z. B. `de`, `en`, `fr`) setzen.
  - Optional ein separates Attribut für Locale setzen (z. B. `data-locale="de-DE"`).
- Beispiel:
  ```ts
  document.documentElement.lang = lang;           // 'de' | 'en' | 'fr'
  document.documentElement.setAttribute('data-locale', locale); // 'de-DE' | 'en-GB' | 'fr-FR'
  ```
- Hinweis: LOCALE_ID ist zur Bootstrap-Zeit fix. Für dynamische Date/Number-Formate nutzt ihr bereits eigene Pipes – das ist gut.

6) [x] Preconnect optimieren – erledigt
- Status: Erledigt – preconnect mit `crossorigin` ist gesetzt; zusätzlich `dns-prefetch` vorhanden.
- Datei: src/index.html
- Ziel: Bei Bedarf ergänzen:
  ```html
  <link rel="preconnect" href="https://surrealdb.sybit.education" crossorigin />
  ```
- Optional: `dns-prefetch` als Low-Risk-Optimierung ergänzen:
  ```html
  <link rel="dns-prefetch" href="//surrealdb.sybit.education" />
  ```

## Prio B – Performance & Bundle

7) [x] HTTP-Client per Fetch betreiben – erledigt
- Status: Erledigt – `withFetch()` ist aktiv in app.config.ts.
- Datei: src/app/app.config.ts
- Ziel:
  ```ts
  import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';

  provideHttpClient(withInterceptorsFromDi(), withFetch())
  ```

8) [x] Router-Preloading verifizieren
- Status: `withPreloading(PreloadAllModules)` ist gesetzt – gut für schnelle Navigation.
- Optional:
  - Preload nur bei „guter Verbindung“ (Network Information API) oder Idle-Zeiten steuern, falls Datenvolumen kritisch ist.
  - ViewTransitions sind aktiv – gut! Darauf achten, keine großen Layout-Shifts zu verursachen.

9) [ ] NGSW: Offline-Fallback und API-Gruppen – offen
- Status: Assets/Translations werden sinnvoll gecacht.
- Empfehlungen:
  - Einen Offline-Fallback (z. B. `/offline`) bereitstellen und in `navigationUrls` bzw. `routing` abfangen.
  - Eine dedizierte DataGroup für weitere API-Routen definieren, falls ihr später mehr Endpunkte nutzt, mit differenzierten `freshness/performance`-Strategien.

10) [ ] Budgets prüfen – optional/offen
- Status: production-Budgets vorhanden (600kB Warnung, 1MB Error). Bei wachsendem Scope kann es sinnvoll sein, die Budgets leicht zu senken, um frühzeitig auf Bloat zu reagieren.
- Empfehlung:
  - Periodisch `ng build --configuration production` prüfen und Source-Map-Explorer/Bundle-Analyzer verwenden.

11) [ ] Leaflet und CommonJS – offen
- Status: `allowedCommonJsDependencies: ["leaflet", "quill-delta"]` – ok. Prüfen, ob ESM-Version verfügbar ist, um Tree-Shaking zu verbessern.

## Prio B – A11y

12) [ ] Icons zugänglicher machen – offen
- Problem: `app-icon` rendert ein `<span>` mit `innerHTML`. Screenreader-Verhalten ist unklar.
- Ziel:
  - Wenn dekorativ: `aria-hidden="true"`, `role="img"` vermeiden.
  - Wenn semantisch: `role="img"` + `aria-label="..."`
- Beispiel:
  ```html
  <app-icon name="calendar" aria-hidden="true"></app-icon>
  ```
  oder
  ```html
  <app-icon name="calendar" role="img" aria-label="Kalender"></app-icon>
  ```

13) [ ] Fokus-Management & Live-Regionen – offen
- Status: `MoreComponent` loggt Navigation, aber keine LiveAnnouncer-Nutzung.
- Empfehlung:
  - `@angular/cdk/a11y` LiveAnnouncer einsetzen, um Screenreadern Navigation oder Statusänderungen anzukündigen.
  - Skip-Links in der Shell (`index.html` + Header) anbieten.

## Prio B – Sicherheit

14) [ ] SVG-Sanitizing im IconRegistryService – offen
- Problem: Es wird `bypassSecurityTrustHtml` verwendet. Das ist ok, wenn Quellen vertrauenswürdig sind – aber riskant, wenn externe Quellen zugelassen werden.
- Ziel:
  - Nur interne, geprüfte SVGs registrieren.
  - Alternativ vor `bypass...` eine Whitelist-Sanitization implementieren (oder `DOMPurify` in "safe SVG"-Konfiguration – Tradeoff: Zusatzabhängigkeit).

15) [x] LocalStorage-Nutzung für Sprache – OK
- Status: OK. Beachte, dass LocalStorage in striktem SSR-Kontext nicht verfügbar ist (hier aktuell kein SSR – unkritisch).
- Empfehlung: Defensive Checks belassen.

## Prio C – Codequalität & Konsistenz

16) [ ] Naming-Konsistenz von Translate/I18n – offen
- Datei: src/app/services/translate.service.ts exportiert `I18nService`.
- Empfehlung: Entweder Datei in `i18n.service.ts` umbenennen oder Klasse an Dateinamen angleichen, um Auffindbarkeit zu erhöhen.

17) [ ] Signals + Subjects doppelt in Services – offen
- Beispiel: `LocalStorageService` (aus euren Referenzdateien) nutzt beides. Das ist ok für schrittweise Migration, aber langfristig vereinheitlichen (Signals bevorzugen).
- Vorteil: Weniger doppelte States, kleinere Fehlerfläche.

18) [ ] Unit/E2E-Tests – offen
- Empfehlung:
  - Kritische Services testen: `SurrealdbService` (Init-Race, Error-Handling), `UpdateService` (SW Enabled/Disabled), `IconRegistryService` (Caching/Transform).
  - E2E für Routing (inkl. Fallback/404), PWA-Installierbarkeit.

## Konkrete Code-Snippets (für spätere Umsetzung)

A) IconComponent – Subscription sicher beenden
```ts
// src/app/icons/icon.component.ts
import { take } from 'rxjs/operators';

ngOnChanges(changes: SimpleChanges): void {
  if (changes['name']?.currentValue) {
    this.registry.get(this.name).pipe(take(1)).subscribe({
      next: (svg) => {
        this.safeSvg = svg;
        this.cdr.markForCheck();
      },
      error: () => {
        this.safeSvg = null;
        this.cdr.markForCheck();
      },
    });
  }
}
```

B) NavigationService – Typen korrigieren
```ts
// src/app/services/navigation.service.ts
async navigateTo(commands: any[], extras?: NavigationExtras): Promise<boolean> {
  const result = await this.router.navigate(commands, extras);
  this.markForCheck();
  return result;
}
```

C) SurrealdbService – deleteRow initialisieren
```ts
// src/app/services/surrealdb.service.ts
async deleteRow(recordId: RecordId<string> | StringRecordId) {
  await this.initialize();
  await super.delete(recordId);
}
```

D) I18n – Sprachen/Lokalisierung im DOM trennen
```ts
// src/app/services/translate.service.ts
document.documentElement.lang = lang; // 'de' | 'en' | 'fr'
document.documentElement.setAttribute('data-locale', locale); // 'de-DE' | 'en-GB' | 'fr-FR'
```

E) HTTP-Client – Fetch aktivieren
```ts
// src/app/app.config.ts
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';

providers: [
  provideHttpClient(withInterceptorsFromDi(), withFetch()),
  // ...
]
```

## Optional – Zukunftsthemen

- SSR/SSG (Angular Universal/Prerender): Bessere SEO/TTV bei öffentlichen Seiten.
- Code-Splitting feiner granulieren (falls Pages groß werden).
- RUM-Tracking (Web Vitals, Logging in Prod gedrosselt).
- CSP-Header sauber definieren (insbesondere für Inline-SVG/innerHTML).

---

Wenn du willst, setze ich die Quick-Win-Fixes direkt um (NavigationService-Typen, IconComponent `take(1)`, SurrealdbService `deleteRow` Init, Route-Duplikate entfernen) – sag mir einfach Bescheid.

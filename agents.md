# 🧠 AI‑Agent Prompt – Angular 19 + TypeScript + SurrealDB + PWA + Tailwind + Accessibility + Mehrsprachigkeit

> Gib diesen Prompt unserem AI‑Agenten (z. B. ChatGPT via API), um eine moderne Angular 19 Anwendung zu generieren, mit SurrealDB‑Unterstützung, PWA‑Funktionalität, Tailwind‑Styling, Barrierefreiheit (A11y) und Mehrsprachigkeit (I18n).

---

## 🚀 Anforderungen

1. **Angular 19** mit Standalone Components  
2. **TypeScript** mit `strict: true` (kein `any`)  
3. **Tailwind CSS v4** als primärer CSS‑Stack  
4. **Progressive Web App (PWA)**:  
   - `ng add @angular/pwa` für Service Worker, Manifest, Caching  
   - Offline‑Support mittels `ngsw-config.json` ([Angular SW-Praktiken])  
5. **SurrealDB Integration**:  
   - Nutze das offizielle JavaScript/TypeScript SDK für Browser oder WebAssembly  
   - Setze WebSocket oder Live‑Query für Echtzeit‑Daten ein ([SurrealDB SDK unterstützt Angular])  
   - Führe Auth, CRUD, Live-Abfragen über SurrealQL aus ([SDK Übersicht])  
6. **Feature‑basierte Architektur / Domain‑Driven Design** (Mono‑Repo via Nx optional)  
7. **State Management**:  
   - Für komplexe Flows: NgRx oder ComponentStore  
   - Alternativ Signals oder rxResource für zoneless Change Detection  
8. **Internationalisierung (I18n)**:  
   - Verwende `ngx-translate` für die Übersetzungsverwaltung
   - Nutze `TranslateService` mit JSON‑Dateien für Übersetzungen
   - Aktivierung von ESLint‑Regeln wie `@angular-eslint/template/i18n` ([i18n Best Practices])  
   - Build‑Konfigurationen für mindestens zwei Sprachen (`de`, `en`)  
9. **Barrierefreiheit (Accessibility / A11y)**:  
   - Semantisches HTML, ARIA‑Attribute mit `attr.aria‑...`, Tastatur‑Navigation  
   - Skip‑Links, Fokus‑Management, Live Announcements, Angular CDK (`LiveAnnouncer`, `cdkTrapFocus`) ([Accessibility Best Practices in Angular 19])  
   - Hoher Kontrast, Fokus-Styling, alt‑Texte, Fehlerbeschreibungen  
10. **Performance & Optimierungen**:  
    - Lazy‑Loading, PreloadAllModules, `OnPush` Change Detection, AOT, Tree‑Shaking, SSR‑Vorbereitung  
11. **Codequalität & Tests**:  
    - Saubere DTOs / Interfaces, kein `any`, RxJS‑Pipes (`pipe`, `takeUntil`, etc.)  
    - Tooling: ESLint, Prettier, Husky Hooks  
    - Unit‑Tests (Jest oder Jasmine/Karma), E2E mit Cypress  

---

## 📦 Beispiel Ordnerstruktur

```bash
src/
  app/
    component/
      shared/
      features/
        feature‑a/
        feature‑b/
    models/ # Modelle/DTOs die genutzt werden.
    pages/ # Die einzelnen Pages
    locale/ # Übersetzungs‑Dateien (JSON)
    services/ # Services der app
    styles/
    tailwind.css
  environments/
  assets/
  index.html

```

---

## 🛠 Beispiel Codeausschnitte

```ts
// surreal.service.ts
import { Injectable } from '@angular/core';
import Surreal from 'surrealdb.js';

@Injectable({ providedIn: 'root' })
export class SurrealService {
  private db = new Surreal('https://your‑db‑url:port');

  async connect() {
    await this.db.signin({ user: 'user', pass: 'pw' });
    await this.db.use('namespace', 'database');
  }

  liveQuery(sql: string, callback: any) {
    this.db.subscribeLive({ sql }, callback);
  }

  query(sql: string) {
    return this.db.query(sql);
  }
}
```

```ts
// app.main.ts oder standalone Setup
ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: environment.production
})
```

```html
<!-- barrierefreies & i18n-konformes UI -->
<a href="#mainContent" class="skip-link sr-only focus:not-sr-only">
  {{ 'SKIP_TO_MAIN' | translate }}
</a>
<main id="mainContent">
  <h1 i18n="@@pageTitle">{{ 'PAGE_TITLE' }}</h1>
  <button
    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-yellow-500"
    [attr.aria-label]="('SAVE' | translate)">
    {{ 'SAVE' | translate }}
  </button>
  <div aria-live="polite">{{ notificationMessage }}</div>
</main>
```

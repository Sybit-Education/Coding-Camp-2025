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
10. **SEO & AI-Auffindbarkeit**:
    - Strukturierte Daten mit JSON-LD für Events, Orte und Organisationen
    - Meta-Tags für soziale Medien (Open Graph, Twitter Cards)
    - Semantische HTML-Struktur mit korrekten Heading-Hierarchien
    - Statische und dynamische Sitemap-Generierung
    - Canonical URLs für mehrsprachige Inhalte
    - Web Mentions und Schema.org Markup
    - AI-spezifische Meta-Tags und Optimierungen für AI-Crawler
    - Progressive Enhancement für Suchmaschinen
11. **Performance & Optimierungen**:  
    - Lazy‑Loading, PreloadAllModules, `OnPush` Change Detection, AOT, Tree‑Shaking
    - Server-Side Rendering (SSR) mit Angular Universal
    - Optimierung für Core Web Vitals (LCP, FID, CLS)
12. **Codequalität & Tests**:  
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
    seo/ # SEO-Services und Komponenten
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
<!-- barrierefreies & i18n-konformes UI mit SEO-Optimierung -->
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
  
  <!-- Strukturierte Daten für SEO -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "{{ event.name }}",
      "startDate": "{{ event.date_start | date:'yyyy-MM-dd' }}",
      "endDate": "{{ event.date_end | date:'yyyy-MM-dd' }}",
      "location": {
        "@type": "Place",
        "name": "{{ event.location.name }}",
        "address": "{{ event.location.address }}"
      },
      "description": "{{ event.description }}"
    }
  </script>
</main>
```

```ts
// seo.service.ts
import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private meta: Meta,
    private title: Title
  ) {}

  updateMetaTags(config: {
    title: string;
    description: string;
    image?: string;
    url?: string;
  }) {
    this.title.setTitle(config.title);
    
    // Standard Meta-Tags
    this.meta.updateTag({ name: 'description', content: config.description });
    
    // Open Graph Tags
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
    }
    if (config.url) {
      this.meta.updateTag({ property: 'og:url', content: config.url });
    }
    
    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: config.image });
    }
    
    // AI-spezifische Meta-Tags
    this.meta.updateTag({ name: 'ai:description', content: config.description });
    this.meta.updateTag({ name: 'ai:keywords', content: 'events,veranstaltungen,kultur' });
  }
}
```

# SSR Implementation Status

## ✅ Was wurde implementiert

### 1. Angular SSR Grundkonfiguration
- **@angular/ssr** und **@angular/platform-server** Dependencies hinzugefügt
- **server.ts**: Express-Server für SSR erstellt
- **main.server.ts**: Server-side Bootstrap konfiguriert
- **app.config.server.ts**: SSR-Provider konfiguriert
- **app.routes.server.ts**: Server-Routes mit `RenderMode.Server` definiert
- **angular.json**: Build-Konfiguration für SSR erweitert
- **Zone.js** als Polyfill hinzugefügt (erforderlich für Route-Extraction)

### 2. Code-Anpassungen für SSR-Kompatibilität
✅ **LocalStorageService**: isPlatformBrowser-Checks für localStorage  
✅ **I18nService**: Platform-Checks für document/localStorage  
✅ **NavigationService**: Platform-Check für window.history  
✅ **NetworkService**: Bereits SSR-kompatibel (verwendet typeof window !== 'undefined')  
✅ **zoneless-helpers.ts**: afterNextRender nur auf Browser ausführen  
✅ **main.ts**: App Initializer nur browser-spezifischen Code auf Browser ausführen  
✅ **main.ts**: LOCALE_ID Factory mit Platform-Check  

### 3. Docker & Deployment
✅ **Dockerfile.ssr**: Multi-Stage Build für Node.js SSR-Server  
✅ **docker-compose.ssr.yml**: Production-ready Konfiguration mit Traefik-Labels  
✅ **npm scripts**: `build:ssr` und `serve:ssr` hinzugefügt  

### 4. Dokumentation
✅ **SSR-SETUP.md**: Umfassendes 13KB Deployment-Guide  
  - Lokale Entwicklung
  - Production Build
  - Docker Deployment
  - Traefik Integration
  - Troubleshooting
  - Migrationsanleitung
✅ **README.md**: SSR Quick Start hinzugefügt  

---

## ⚠️ Bekanntes Problem: Runtime NG0201 Error

### Problem
Der SSR-Build ist **erfolgreich**, aber zur **Laufzeit** tritt ein Dependency Injection Error auf:

```
Error: NG0201 (No provider for [Token])
```

### Was funktioniert
✅ Build komplett erfolgreich  
✅ Browser- und Server-Bundles werden erstellt  
✅ Express Server startet auf Port 4000  
✅ Health Check antwortet (Server läuft)  

### Was nicht funktioniert
❌ Erste HTTP-Request führt zu NG0201 Error  
❌ Keine Server-Side gerenderte HTML-Ausgabe  

### Mögliche Ursachen

1. **Service Worker Provider**
   ```typescript
   // main.ts
   provideServiceWorker('ngsw-worker.js', {
     enabled: !isDevMode()  // ❌ Läuft auch auf Server!
   })
   ```
   **Fix:** Platform-Check hinzufügen
   ```typescript
   provideServiceWorker('ngsw-worker.js', {
     enabled: !isDevMode() && isPlatformBrowser(platformId)
   })
   ```

2. **ApplicationRef.tick() in I18nService**
   ```typescript
   // translate.service.ts:60
   this.appRef.tick()
   ```
   Möglicherweise Problem auf Server-Seite.

3. **TranslateModule HttpLoader**
   HTTP-Requests auf Server könnten problematisch sein.

4. **SurrealDB oder andere Third-Party Dependencies**
   Browser-only Libraries könnten über App-Init geladen werden.

### Debug-Strategie

#### Schritt 1: Source Maps aktivieren
```json
// angular.json
{
  "configurations": {
    "development": {
      "optimization": false,
      "sourceMap": true  // ✅ Aktivieren für SSR-Debug
    }
  }
}
```

```bash
npm run build:ssr -- --configuration development
node dist/1200-jahre-radolfzell/server/server.mjs
```

→ Bessere Stack Traces

#### Schritt 2: Minimal App Test
Temporär alle Services in `app.config.ts` auskommentieren:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // ❌ TEMPORÄR AUSKOMMENTIEREN:
    // provideAppIcons(),
    // importProvidersFrom(TranslateModule.forRoot(...)),
    // provideServiceWorker(...)
  ]
}
```

→ Wenn NG0201 weg ist, dann einen nach dem anderen wieder aktivieren

#### Schritt 3: Service Worker explizit deaktivieren
```typescript
// main.ts - TEMPORÄR für Debug
const bootstrapConfig: ApplicationConfig = {
  providers: [
    ...appConfig.providers.filter(p => {
      // Filter Service Worker Provider aus
      return !(typeof p === 'object' && p?.provide?.toString().includes('ServiceWorker'))
    }),
    // ... rest
  ]
}
```

#### Schritt 4: App Initializer vereinfachen
```typescript
// main.ts
provideAppInitializer(async () => {
  const platformId = inject(PLATFORM_ID)
  
  if (isPlatformBrowser(platformId)) {
    console.log('Browser init')
    // Alle Browser-Init hier
  } else {
    console.log('Server init - SKIP ALL')
    // ❌ NICHTS auf Server ausführen!
    return Promise.resolve()
  }
})
```

---

## 🔧 Sofortmaßnahmen (Quick Fixes)

### Fix 1: Service Worker nur Browser
```typescript
// main.ts
{
  provide: PLATFORM_ID,
  useValue: inject(PLATFORM_ID)  // Inject in Provider
},
provideAppInitializer(() => {
  const platformId = inject(PLATFORM_ID)
  if (isPlatformBrowser(platformId)) {
    // Service Worker nur hier registrieren
  }
})
```

### Fix 2: TranslateModule mit Server-Safe Loader
```typescript
// Create server-safe loader
export class ServerSafeTranslateLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    private platformId: Object
  ) {}
  
  getTranslation(lang: string): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(`/assets/i18n/${lang}.json`)
    }
    // Server: Return static object or empty
    return of({})
  }
}
```

### Fix 3: Zone.js wieder entfernen (falls möglich)
Zone.js wurde wegen Route-Extraction hinzugefügt. Wenn SSR ohne Route-Extraction läuft:

```typescript
// main.ts
provideZonelessChangeDetection()  // Zurück zu zoneless
```

```json
// angular.json
{
  "polyfills": []  // Zone.js entfernen
}
```

---

## 📝 Nächste Schritte

### Priorität 1: Runtime Error fixen
1. Source Maps aktivieren
2. Minimal App Test durchführen
3. Service Worker Provider isolieren
4. NG0201 Ursprung identifizieren

### Priorität 2: Hydration testen
Nach NG0201-Fix:
```bash
curl http://localhost:4000/
```
→ Vollständig gerendertes HTML erwarten

### Priorität 3: Docker Build testen
```bash
docker build -f Dockerfile.ssr -t ssr-test .
docker run -p 4000:4000 ssr-test
```

### Priorität 4: Production Deployment
1. GitHub Actions für SSR-Image
2. Traefik-Konfiguration anpassen
3. Zero-Downtime Deployment planen

---

## 🎯 Erfolgsmetriken

### Build ✅
- [x] `npm run build:ssr` erfolgreich
- [x] Browser-Bundle erstellt
- [x] Server-Bundle erstellt
- [x] Keine Build-Errors

### Runtime ⚠️
- [x] Server startet auf Port 4000
- [ ] ❌ HTTP-Request ohne NG0201 Error
- [ ] Server-gerendertes HTML
- [ ] Hydration erfolgreich

### Docker ✅
- [x] Dockerfile.ssr erstellt
- [x] docker-compose.ssr.yml konfiguriert
- [ ] Docker Build getestet
- [ ] Container startet

### Production 📋
- [ ] GitHub Actions CI/CD
- [ ] Traefik Integration getestet
- [ ] Zero-Downtime Deployment
- [ ] Performance Benchmarks

---

## 💡 Alternative: Statisches Rendering (Fallback)

Falls SSR-Runtime nicht zeitnah gelöst werden kann:

### Option A: Pre-Rendering (SSG)
```typescript
// app.routes.server.ts
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'team', renderMode: RenderMode.Prerender },
  // Dynamic routes als Server
  { path: 'event/:id', renderMode: RenderMode.Server }
]
```

→ Statische Seiten vorrendern, dynamische per SSR

### Option B: Original nginx Deployment nutzen
Der originale `Dockerfile` (nginx + statische Files) funktioniert weiterhin:

```bash
docker build -t coding-camp-static .
docker-compose up -d  # Original docker-compose.yml
```

---

## 📚 Ressourcen

- **Angular SSR Docs:** https://angular.dev/guide/ssr
- **NG0201 Error:** https://angular.io/errors/NG0201
- **Platform Browser Check:** https://angular.io/api/common/isPlatformBrowser

---

**Status:** 🟡 Infrastruktur komplett, Runtime-Fix erforderlich  
**Nächster Schritt:** NG0201 Debug mit Source Maps  
**Geschätzte Zeit bis Produktionsreife:** 2-4 Stunden Debug  

---

Erstellt: 19. Januar 2026  
Autor: GitHub Copilot Agent

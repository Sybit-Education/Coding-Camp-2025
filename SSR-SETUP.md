# Server-Side Rendering (SSR) Setup & Deployment Guide

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Production Build](#production-build)
- [Docker Deployment](#docker-deployment)
- [Traefik Integration](#traefik-integration)
- [Troubleshooting](#troubleshooting)
- [Migrationsanleitung](#migrationsanleitung-von-statischer-app-zu-ssr)

---

## Überblick

Das Projekt nutzt **Angular 20 Server-Side Rendering (SSR)** für bessere Performance und SEO:

### Vorteile von SSR

✅ **Schnellere Initial Page Load** - Server rendert HTML vor dem Senden  
✅ **Besseres SEO** - Suchmaschinen erhalten vollständig gerenderte Seiten  
✅ **Social Media Previews** - Korrekte Meta-Tags für Facebook, Twitter, etc.  
✅ **Verbesserte Core Web Vitals** - FCP, LCP werden optimiert  

### Technische Details

- **Framework:** Angular 20 mit SSR-Support
- **Server:** Node.js mit Express
- **Port:** 4000 (konfigurierbar über `PORT` env variable)
- **Build-Output:**
  - `dist/1200-jahre-radolfzell/browser/` - Statische Client-Assets
  - `dist/1200-jahre-radolfzell/server/` - SSR Server-Bundle

---

## Lokale Entwicklung

### Voraussetzungen

```bash
node >= 18.x
npm >= 9.x
```

### Installation

```bash
# Dependencies installieren
npm install --legacy-peer-deps

# Hinweis: --legacy-peer-deps ist erforderlich wegen Angular Version-Kompatibilität
```

### Development Server (ohne SSR)

Für schnelle Entwicklung **ohne** Server-Side Rendering:

```bash
npm start
# oder
ng serve
```

→ App läuft auf `http://localhost:4200`

### Development mit SSR

1. **Build mit SSR:**

```bash
npm run build:ssr
```

2. **SSR Server starten:**

```bash
npm run serve:ssr
```

→ SSR App läuft auf `http://localhost:4000`

### Wichtige npm Scripts

```json
{
  "build": "ng build",                    // Production build ohne SSR
  "build:ssr": "ng build --configuration production", // Production build mit SSR
  "serve:ssr": "node dist/1200-jahre-radolfzell/server/server.mjs" // SSR Server starten
}
```

---

## Production Build

### SSR Build erstellen

```bash
# Standard Production Build mit SSR
npm run build:ssr

# Mit Environment-Konfiguration
npm run build:ssr -- --configuration production
npm run build:ssr -- --configuration staging
```

### Build-Output prüfen

Nach dem Build sollten folgende Verzeichnisse existieren:

```
dist/1200-jahre-radolfzell/
├── browser/          # Client-Bundle (statische Assets)
│   ├── index.html
│   ├── main-*.js
│   ├── polyfills-*.js
│   └── ...
├── server/           # Server-Bundle
│   ├── server.mjs    # Express SSR Server
│   ├── main.server.mjs
│   └── ...
└── 3rdpartylicenses.txt
```

### SSR Server lokal testen

```bash
# Nach erfolgreichem Build
npm run serve:ssr

# Server läuft auf http://localhost:4000
curl http://localhost:4000
```

✅ **Erfolgreicher Test:** Vollständig gerendertes HTML wird zurückgegeben (nicht nur `<app-root></app-root>`)

---

## Docker Deployment

### SSR-Dockerfile

Es gibt nun **zwei** Dockerfiles:

1. **`Dockerfile`** - Original (nginx + statische Files) - **Legacy**
2. **`Dockerfile.ssr`** - **NEU** für SSR mit Node.js

### Docker Image bauen

```bash
# SSR Image mit Production-Konfiguration bauen
docker build -f Dockerfile.ssr -t coding-camp-2025-ssr:latest .

# Mit custom Environment
docker build -f Dockerfile.ssr --build-arg ENV=staging -t coding-camp-2025-ssr:staging .
```

### Docker Container lokal testen

```bash
# Container starten
docker run -d \
  --name test-ssr \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  coding-camp-2025-ssr:latest

# Logs prüfen
docker logs -f test-ssr

# Health Check
curl http://localhost:4000/

# Container stoppen
docker stop test-ssr && docker rm test-ssr
```

### Docker Compose mit SSR

Verwende **`docker-compose.ssr.yml`** statt dem originalen `docker-compose.yml`:

```bash
# Container mit docker-compose starten
docker-compose -f docker-compose.ssr.yml up -d

# Logs verfolgen
docker-compose -f docker-compose.ssr.yml logs -f

# Container stoppen
docker-compose -f docker-compose.ssr.yml down
```

---

## CI/CD Pipeline - Automatische Docker Image Builds

### GitHub Actions Workflow

Die GitHub Actions Pipeline baut und veröffentlicht **beide Varianten** automatisch:

#### Automatische Builds

Bei jedem Push auf `main` oder bei Tags (`v*.*.*`):

1. **Static Variant** → `ghcr.io/sybit-education/coding-camp-2025:main`
2. **SSR Variant** → `ghcr.io/sybit-education/coding-camp-2025-ssr:main`

#### Verfügbare Images

```bash
# Static variant (nginx)
docker pull ghcr.io/sybit-education/coding-camp-2025:main
docker pull ghcr.io/sybit-education/coding-camp-2025:latest
docker pull ghcr.io/sybit-education/coding-camp-2025:v1.0.0  # bei Tags

# SSR variant (Node.js)
docker pull ghcr.io/sybit-education/coding-camp-2025-ssr:main
docker pull ghcr.io/sybit-education/coding-camp-2025-ssr:latest
docker pull ghcr.io/sybit-education/coding-camp-2025-ssr:v1.0.0  # bei Tags
```

#### Image Tags

| Branch/Tag | Static Image | SSR Image |
|------------|--------------|-----------|
| `main` | `:main`, `:latest` | `-ssr:main`, `-ssr:latest` |
| `v1.0.0` | `:v1.0.0` | `-ssr:v1.0.0` |
| PR #123 | Nur Build-Test | Nur Build-Test |

#### Pipeline-Features

✅ **Multi-Stage Builds** - Optimierte Layer-Caching  
✅ **Image Signing** - Mit Cosign signiert  
✅ **Security Scanning** - CodeQL in separatem Workflow  
✅ **Parallele Builds** - Beide Varianten gleichzeitig  
✅ **Cache-Optimierung** - Separate Caches für static/SSR  

#### Deployment mit CI/CD Images

**docker-compose.ssr.yml anpassen:**

```yaml
services:
  1200-jahre-radolfzell-ssr:
    # Verwende das automatisch gebaute SSR-Image
    image: ghcr.io/sybit-education/coding-camp-2025-ssr:main
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=4000
    labels:
      # Traefik configuration...
      traefik.http.services.1200-jahre-radolfzell-ssr.loadbalancer.server.port: "4000"
```

**Update auf neueste Version:**

```bash
# Pull neuestes Image
docker-compose -f docker-compose.ssr.yml pull

# Container neu starten
docker-compose -f docker-compose.ssr.yml up -d

# Logs prüfen
docker-compose -f docker-compose.ssr.yml logs -f
```

---

## Traefik Integration

### Wichtige Unterschiede zu statischer Nginx-Lösung

| Aspekt | Nginx (Static) | Node.js SSR |
|--------|---------------|-------------|
| **Port** | 80 | 4000 |
| **Service** | nginx | node |
| **Health Check** | `/healthz` | `/` |
| **Caching** | Statische Files | SSR-Response |

### Traefik-Konfiguration anpassen

#### 1. docker-compose.yml ersetzen

**Alt (Nginx):**
```yaml
services:
  1200-jahre-radolfzell-frontend:
    image: ghcr.io/sybit-education/coding-camp-2025:main
    # ...
    labels:
      traefik.http.services.1200-jahre-radolfzell-frontend.loadbalancer.server.port: 80
```

**Neu (SSR):**
```yaml
services:
  1200-jahre-radolfzell-ssr:
    image: ghcr.io/sybit-education/coding-camp-2025-ssr:main
    # ...
    labels:
      traefik.http.services.1200-jahre-radolfzell-ssr.loadbalancer.server.port: 4000
```

#### 2. Traefik Labels für SSR

Die wichtigsten Labels in `docker-compose.ssr.yml`:

```yaml
labels:
  # Enable Traefik
  traefik.enable: "true"
  
  # Router
  traefik.http.routers.1200-jahre-radolfzell-ssr.entrypoints: web-secure
  traefik.http.routers.1200-jahre-radolfzell-ssr.rule: Host(`1200-jahre-radolfzell.sybit.education`)
  traefik.http.routers.1200-jahre-radolfzell-ssr.tls: "true"
  
  # Service (Node.js Port 4000!)
  traefik.http.services.1200-jahre-radolfzell-ssr.loadbalancer.server.port: "4000"
  traefik.http.services.1200-jahre-radolfzell-ssr.loadbalancer.server.scheme: http
  
  # Health Check
  traefik.http.services.1200-jahre-radolfzell-ssr.loadbalancer.healthcheck.path: /
  traefik.http.services.1200-jahre-radolfzell-ssr.loadbalancer.healthcheck.interval: 30s
```

#### 3. Middleware (Security Headers)

SSR benötigt **dieselben** Security-Header wie die statische Version.

Stelle sicher, dass `secHeaders@file` Middleware in Traefik konfiguriert ist:

```yaml
# /etc/traefik/dynamic/middlewares.yml
http:
  middlewares:
    secHeaders:
      headers:
        customResponseHeaders:
          X-Frame-Options: "SAMEORIGIN"
          X-Content-Type-Options: "nosniff"
          X-XSS-Protection: "1; mode=block"
          Referrer-Policy: "strict-origin-when-cross-origin"
```

### Migration in Production

#### Schritt 1: Backup erstellen

```bash
# Aktuellen Container-Status sichern
docker-compose ps
docker-compose logs > backup-logs.txt
```

#### Schritt 2: Alten Container stoppen

```bash
docker-compose down
```

#### Schritt 3: Neuen SSR-Container starten

```bash
# docker-compose.yml durch docker-compose.ssr.yml ersetzen
# oder neue Datei verwenden:
docker-compose -f docker-compose.ssr.yml up -d
```

#### Schritt 4: Health Check

```bash
# Prüfen ob Container läuft
docker ps | grep ssr

# Logs überprüfen
docker logs 1200-jahre-radolfzell-ssr

# HTTP-Test (von außen)
curl https://1200-jahre-radolfzell.sybit.education
```

### Rollback-Strategie

Falls Probleme auftreten:

```bash
# SSR Container stoppen
docker-compose -f docker-compose.ssr.yml down

# Alte nginx-Version neu starten
docker-compose up -d
```

---

## Troubleshooting

### Problem: "Zone.js is required"

**Symptom:** Build schlägt fehl mit `NG0908: In this configuration Angular requires Zone.js`

**Lösung:** 
```typescript
// angular.json
{
  "polyfills": ["zone.js"]  // Zone.js hinzufügen
}
```

Zone.js ist für Angular SSR Route-Extraction erforderlich.

---

### Problem: "Cannot find module express"

**Symptom:** Container-Start schlägt fehl

**Lösung:**
```bash
# Dependencies im Dockerfile korrekt installieren
RUN npm ci --only=production --legacy-peer-deps
```

Stelle sicher, dass `express` in `dependencies` (nicht `devDependencies`) steht.

---

### Problem: Container startet nicht (Port bereits belegt)

**Symptom:** `Error: listen EADDRINUSE :::4000`

**Lösung:**
```bash
# Prozess auf Port 4000 finden und beenden
lsof -ti:4000 | xargs kill -9

# Oder anderen Port verwenden
docker run -p 4100:4000 coding-camp-2025-ssr
```

---

### Problem: SSR-Seite zeigt nur leere Seite

**Symptom:** Browser zeigt weiße Seite, keine Fehler in Console

**Mögliche Ursachen:**

1. **Browser-Only Code läuft auf Server:**
   ```typescript
   // ❌ FALSCH
   const value = localStorage.getItem('key')
   
   // ✅ RICHTIG
   private platformId = inject(PLATFORM_ID)
   
   if (isPlatformBrowser(this.platformId)) {
     const value = localStorage.getItem('key')
   }
   ```

2. **document/window ohne Check:**
   ```typescript
   // ❌ FALSCH
   document.getElementById('myId')
   
   // ✅ RICHTIG
   if (isPlatformBrowser(this.platformId)) {
     document.getElementById('myId')
   }
   ```

3. **Service Worker läuft auf Server:**
   ```typescript
   // main.ts
   provideServiceWorker('ngsw-worker.js', {
     enabled: !isDevMode() && isPlatformBrowser(platformId)  // Platform-Check hinzufügen!
   })
   ```

---

### Problem: Hydration Fehler

**Symptom:** `NG0500: During hydration Angular expected...`

**Lösung:**
```typescript
// Stelle sicher, dass Server und Client denselben HTML-Output generieren
// Vermeide zufällige IDs oder timestamps im Template

// ❌ FALSCH
<div id="{{ Math.random() }}">...</div>

// ✅ RICHTIG
<div [id]="componentId">...</div>  // componentId als konstante Property
```

---

### Problem: Bundle Size Warning

**Symptom:** `bundle initial exceeded maximum budget`

**Ist OK:** Dies ist nur eine Warnung. SSR-Bundles sind größer wegen:
- Zone.js (~100KB)
- Server-Runtime-Code

**Optional optimieren:**
```json
// angular.json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "700kB",  // Erhöhen für SSR
      "maximumError": "1MB"
    }
  ]
}
```

---

## Migrationsanleitung von statischer App zu SSR

### 1. Code-Anpassungen

#### a) Browser-APIs mit Platform-Check schützen

**Betroffene APIs:**
- `localStorage` / `sessionStorage`
- `window.*`
- `document.*`
- `navigator.*`

**Pattern:**
```typescript
import { inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

export class MyService {
  private platformId = inject(PLATFORM_ID)
  private isBrowser = isPlatformBrowser(this.platformId)
  
  doSomething() {
    if (this.isBrowser) {
      const value = localStorage.getItem('key')
      // ...
    }
  }
}
```

#### b) App Initializer nur auf Browser

```typescript
// main.ts
provideAppInitializer(async () => {
  const platformId = inject(PLATFORM_ID)
  
  if (isPlatformBrowser(platformId)) {
    // Browser-spezifische Initialisierung
    const surrealdb = inject(SurrealdbService)
    await surrealdb.initialize()
  }
})
```

### 2. Build-Konfiguration

#### a) Zone.js hinzufügen

```bash
npm install zone.js --save --legacy-peer-deps
```

```json
// angular.json
{
  "polyfills": ["zone.js"]
}
```

#### b) Keep Zoneless Change Detection

**Important**: Do NOT remove `provideZonelessChangeDetection()`. The app should run zoneless at runtime.

```typescript
// main.ts - KEEP THIS:
provideZonelessChangeDetection()  // ✅ App runs zoneless!
```

Zone.js is only needed for the build process (route extraction), not at runtime. See `docs/ZONELESS-SSR-CLARIFICATION.md` for details.

### 3. Docker-Umgebung

#### a) Dockerfile.ssr verwenden

```bash
# Neues Image bauen
docker build -f Dockerfile.ssr -t myapp-ssr .
```

#### b) docker-compose anpassen

```yaml
# Port von 80 auf 4000 ändern
traefik.http.services.myapp.loadbalancer.server.port: "4000"
```

### 4. CI/CD Pipeline

GitHub Actions anpassen (`.github/workflows/`):

```yaml
# Altes Build-Kommando
- run: npm run build

# Neues SSR-Build
- run: npm run build:ssr

# Docker Build
- run: docker build -f Dockerfile.ssr -t ghcr.io/org/repo-ssr:${{ github.sha }} .
```

---

## Performance-Optimierung

### 1. Caching-Strategie

SSR-Responses können gecached werden:

```typescript
// server.ts - Optional: Response-Caching hinzufügen
import { createNodeRequestHandler } from '@angular/ssr/node'
import * as cache from 'memory-cache'

app.use((req, res, next) => {
  const key = req.url
  const cachedResponse = cache.get(key)
  
  if (cachedResponse) {
    return res.send(cachedResponse)
  }
  
  // Intercept response
  const originalSend = res.send
  res.send = function(data) {
    cache.put(key, data, 60000) // 1 min cache
    return originalSend.call(this, data)
  }
  
  next()
})
```

### 2. Static Files separat ausliefern

Für maximale Performance: Statische Assets über CDN/nginx ausliefern:

```nginx
# nginx als Reverse Proxy vor Node.js
location / {
  proxy_pass http://nodejs:4000;
}

location ~* \.(js|css|png|jpg|svg)$ {
  root /var/www/static;
  expires 1y;
}
```

### 3. PM2 für Production

Verwende PM2 für bessere Process-Management:

```bash
# In Dockerfile
CMD ["pm2-runtime", "start", "dist/1200-jahre-radolfzell/server/server.mjs"]
```

---

## Weitere Ressourcen

- **Angular SSR Docs:** https://angular.dev/guide/ssr
- **Express.js:** https://expressjs.com/
- **Traefik Docs:** https://doc.traefik.io/traefik/

---

**Version:** 1.0.0  
**Letztes Update:** Januar 2026  
**Autor:** Coding Camp 2025 Team

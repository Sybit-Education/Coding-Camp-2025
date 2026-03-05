# CI/CD Docker Build Pipeline

## Übersicht

Die GitHub Actions Pipeline baut und veröffentlicht automatisch **zwei Docker Image Varianten**:

1. **Static Variant** (nginx) - Original statische Auslieferung
2. **SSR Variant** (Node.js) - Server-Side Rendering

## Workflow-Konfiguration

**Datei:** `.github/workflows/docker-publish.yml`

### Matrix-Build-Strategie

```yaml
strategy:
  matrix:
    variant:
      - name: static
        dockerfile: Dockerfile
        suffix: ""
      - name: ssr
        dockerfile: Dockerfile.ssr
        suffix: -ssr
```

Die Pipeline baut beide Varianten **parallel** für maximale Effizienz.

## Image-Naming

### Static Variant

- **Dockerfile:** `Dockerfile`
- **Image:** `ghcr.io/sybit-education/coding-camp-2025`
- **Tags:**
  - `main` - Neuester Build vom main Branch
  - `latest` - Alias für main
  - `v1.0.0` - Bei Git-Tags
  - `pr-123` - Bei Pull Requests (nicht gepusht)

### SSR Variant

- **Dockerfile:** `Dockerfile.ssr`
- **Image:** `ghcr.io/sybit-education/coding-camp-2025-ssr`
- **Tags:**
  - `main` - Neuester SSR Build vom main Branch
  - `latest` - Alias für main
  - `v1.0.0` - Bei Git-Tags
  - `pr-123` - Bei Pull Requests (nicht gepusht)

## Build-Trigger

Die Pipeline wird getriggert bei:

```yaml
on:
  push:
    branches: [ "main" ]
    tags: [ 'v*.*.*' ]
  pull_request:
    branches: [ "main" ]
```

### Verhalten je nach Trigger

| Trigger | Builds | Push to Registry | Signing |
|---------|--------|------------------|---------|
| Push to `main` | ✅ Beide | ✅ Ja | ✅ Ja |
| Tag `v1.0.0` | ✅ Beide | ✅ Ja | ✅ Ja |
| Pull Request | ✅ Beide | ❌ Nein | ❌ Nein |

## Cache-Strategie

Separate Caches für bessere Performance:

```yaml
cache-from: type=gha,scope=${{ matrix.variant.name }}
cache-to: type=gha,mode=max,scope=${{ matrix.variant.name }}
```

- **Static Cache Scope:** `static`
- **SSR Cache Scope:** `ssr`

Dies verhindert Cache-Konflikte zwischen den Varianten.

## Image-Signing

Alle produktiven Images werden mit **Cosign** signiert:

```bash
# Signature verifizieren
cosign verify ghcr.io/sybit-education/coding-camp-2025-ssr:main \
  --certificate-identity-regexp="https://github.com/Sybit-Education/Coding-Camp-2025" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

## Verwendung der Images

### Production Deployment

#### Static Variant (nginx)

```yaml
# docker-compose.yml
services:
  frontend:
    image: ghcr.io/sybit-education/coding-camp-2025:main
    ports:
      - "80:80"
```

#### SSR Variant (Node.js)

```yaml
# docker-compose.ssr.yml
services:
  frontend-ssr:
    image: ghcr.io/sybit-education/coding-camp-2025-ssr:main
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
```

### Lokales Testen

```bash
# Static Variant testen
docker run -p 80:80 ghcr.io/sybit-education/coding-camp-2025:main

# SSR Variant testen
docker run -p 4000:4000 ghcr.io/sybit-education/coding-camp-2025-ssr:main
```

## Updates auf neueste Version

### Automatisch mit docker-compose

```bash
# Neuestes Image pullen
docker-compose -f docker-compose.ssr.yml pull

# Container mit neuem Image neu starten
docker-compose -f docker-compose.ssr.yml up -d

# Alte Images aufräumen
docker image prune -f
```

### Manuell

```bash
# Neuestes Image pullen
docker pull ghcr.io/sybit-education/coding-camp-2025-ssr:main

# Laufende Container stoppen
docker stop my-ssr-container

# Container mit neuem Image starten
docker run -d \
  --name my-ssr-container \
  -p 4000:4000 \
  ghcr.io/sybit-education/coding-camp-2025-ssr:main
```

## Build-Zeiten

Typische Build-Zeiten auf GitHub Actions (2-core, 8GB RAM):

- **Static Variant:** ~3-5 Minuten
- **SSR Variant:** ~4-6 Minuten
- **Parallel Total:** ~5-7 Minuten

Mit Cache:
- **Static Variant:** ~1-2 Minuten
- **SSR Variant:** ~2-3 Minuten

## Troubleshooting

### Image Pull Fehler

```bash
# Login erforderlich für private Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Image pullen
docker pull ghcr.io/sybit-education/coding-camp-2025-ssr:main
```

### Build Fehler in CI

1. **Check Workflow-Logs:** GitHub Actions → Workflow → Failed Job
2. **Cache Problem:** Cache-Keys in Workflow prüfen
3. **Dependencies:** package.json Version-Konflikte?
4. **Dockerfile Syntax:** Lokaler Test mit `docker build -f Dockerfile.ssr .`

### Image Größe

Aktuelle Image-Größen:

- **Static Variant:** ~50-100 MB (nginx + static files)
- **SSR Variant:** ~300-400 MB (Node.js + dependencies)

Optimierungen:
- Multi-stage builds entfernen build dependencies
- `npm ci --only=production` in production stage
- `.dockerignore` reduziert build context

## Monitoring

### Build-Status

GitHub Actions Badge im README:

```markdown
![Docker Build](https://github.com/Sybit-Education/Coding-Camp-2025/actions/workflows/docker-publish.yml/badge.svg)
```

### Image-Versionen

```bash
# Alle verfügbaren Tags anzeigen
curl -s https://api.github.com/orgs/sybit-education/packages/container/coding-camp-2025-ssr/versions | jq '.[].metadata.container.tags'
```

## Best Practices

✅ **Verwende spezifische Tags** in Production (z.B. `v1.0.0` statt `latest`)  
✅ **Pin Dependencies** in Dockerfile (z.B. `node:20.11-bookworm-slim`)  
✅ **Health Checks** in docker-compose konfigurieren  
✅ **Resource Limits** setzen für Container  
✅ **Secrets Management** mit docker secrets oder env files  
✅ **Monitoring** mit Prometheus/Grafana für Production  

---

**Erstellt:** 2026-01-23  
**Workflow:** `.github/workflows/docker-publish.yml`  
**Autor:** GitHub Copilot Agent

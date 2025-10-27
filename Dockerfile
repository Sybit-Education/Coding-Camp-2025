FROM node:lts-bookworm-slim AS build-stage

# Set build args (Angular-Konfiguration: production|staging|...).
ARG ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Angular CLI (falls nicht im devDependencies)
RUN npx -y @angular/cli@latest ng version >/dev/null 2>&1 || true

COPY . .

RUN npm run build -- --configuration=${ENV} --output-path=dist/app

# -----------------------------------------------------------------------
FROM nginx:stable-alpine AS production-stage

RUN rm -rf /usr/share/nginx/html/*

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist/app/browser  /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1

# Angular 22 Migration — Fix-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Build von Branch `chore/angular-22-and-deps-upgrade` zum Laufen bringen und alle Angular 22 Best Practices durchsetzen.

**Architecture:** 3 Phasen: (1) Quick Wins die den Build entblocken, (2) SurrealDB Service-Reparatur, (3) Best Practice Migrationen. Jede Phase baut auf der vorherigen auf.

**Tech Stack:** Angular 22, TypeScript 6.0, SurrealDB SDK v2, @ngx-translate v18

## Global Constraints

- Kein explizites `standalone: true` setzen (default in Angular 22)
- Native Control Flow (`@if`/`@for`/`@switch`) verwenden — kein `*ngIf`/`*ngFor`
- `inject()` statt Constructor Injection
- `ChangeDetectionStrategy.OnPush` als Standard (außer bei berechtigten Ausnahmen)
- Signal-basierte `input()`/`output()` statt `@Input`/`@Output` Decorators
- Kein `ChangeDetectionStrategy.Eager` (existiert nicht)
- `[class]`/`[style]` statt `[ngClass]`/`[ngStyle]`
- `track` in allen `@for` Loops
- Build muss `ng build` ohne Fehler durchlaufen

---

## Phase 1: Quick Wins (Build entblocken)

### Task 1: `ignoreDeprecations` aus tsconfig.json entfernen

**Files:**
- Modify: `tsconfig.json:7`

**Interfaces:**
- Consumes: nothing
- Produces: gültige tsconfig.json

- [ ] **Step 1: `ignoreDeprecations` entfernen**

  Edit `tsconfig.json` Zeile 7 — die Zeile `"ignoreDeprecations": "6.0",` entfernen. Dieses Flag gilt nur für TS 5.0-Übergang und wird mit TS 6.0 nicht unterstützt.

- [ ] **Step 2: Build testen**

  Run: `npx ng build 2>&1 | head -5`
  Expected: Der `TS5103` Fehler zu `--ignoreDeprecations` erscheint nicht mehr.

- [ ] **Step 3: Commit**

  ```bash
  git add tsconfig.json
  git commit -m "fix: remove invalid ignoreDeprecations flag for TS 6.0"
  ```

---

### Task 2: `ChangeDetectionStrategy.Eager` → `OnPush` in 5 Komponenten

**Files:**
- Modify: `src/app/component/go-back-button/go-back-button.component.ts:10`
- Modify: `src/app/component/location-input/location-input.component.ts:16`
- Modify: `src/app/component/organizer-input/organizer-input.component.ts:14`
- Modify: `src/app/component/snack-bar/snack-bar.component.ts:12`
- Modify: `src/app/pages/login/login.component.ts:12`

**Interfaces:**
- Consumes: nothing
- Produces: gültige `ChangeDetectionStrategy` in 5 Komponenten

- [ ] **Step 1: `Eager` → `OnPush` in allen 5 Komponenten ersetzen**

  ```typescript
  // ❌ vorher
  changeDetection: ChangeDetectionStrategy.Eager,
  // ✅ nachher
  changeDetection: ChangeDetectionStrategy.OnPush,
  ```

  **Betrifft diese Dateien:**
  - `src/app/component/go-back-button/go-back-button.component.ts:10`
  - `src/app/component/location-input/location-input.component.ts:16`
  - `src/app/component/organizer-input/organizer-input.component.ts:14`
  - `src/app/component/snack-bar/snack-bar.component.ts:12`
  - `src/app/pages/login/login.component.ts:12`

  In `login.component.ts` muss zusätzlich `ChangeDetectionStrategy` importiert werden (ist schon da).

- [ ] **Step 2: Build testen**

  Run: `npx ng build 2>&1 | grep -E 'NG1010|Eager'`
  Expected: Keine `NG1010` oder `Eager` Fehler mehr.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/component/go-back-button/go-back-button.component.ts \
          src/app/component/location-input/location-input.component.ts \
          src/app/component/organizer-input/organizer-input.component.ts \
          src/app/component/snack-bar/snack-bar.component.ts \
          src/app/pages/login/login.component.ts
  git commit -m "fix: replace invalid ChangeDetectionStrategy.Eager with OnPush"
  ```

---

### Task 3: `$safeNavigationMigration` entfernen und Templates fixen

**Files:**
- Modify: `src/app/component/event-card/event-card.component.html:8,27,64`
- Modify: `src/app/pages/kategorie/kategorie.component.html:67`

**Interfaces:**
- Consumes: nothing
- Produces: saubere Template-Ausdrücke ohne `$safeNavigationMigration`

- [ ] **Step 1: `$safeNavigationMigration` Aufrufe durch direkte Ausdrücke ersetzen**

  Der `$safeNavigationMigration()` Call ist ein Migration-Relikt. Die Funktion existiert nirgends. Die Ausdrücke müssen durch die direkten Property-Zugriffe ersetzt werden.

  **event-card.component.html — Zeile 8:**
  ```html
  <!-- ❌ vorher -->
  [routerLink]="['/event', $safeNavigationMigration(event()?.id?.id)]"
  <!-- ✅ nachher -->
  [routerLink]="['/event', event()?.id?.id]"
  ```

  **event-card.component.html — Zeilen 23-28:**
  ```html
  <!-- ❌ vorher -->
  [alt]="
    event()?.name
      ? ('event-card.image-alt' | translate: { name: $safeNavigationMigration(event()?.name) })
      : ('event-card.placeholder-alt' | translate)
  "
  <!-- ✅ nachher -->
  [alt]="
    event()?.name
      ? ('event-card.image-alt' | translate: { name: event()?.name })
      : ('event-card.placeholder-alt' | translate)
  "
  ```

  **event-card.component.html — Zeile 64:**
  ```html
  <!-- ❌ vorher -->
  [eventId]="$safeNavigationMigration(event()?.id)"
  <!-- ✅ nachher -->
  [eventId]="event()?.id"
  ```

  **kategorie.component.html — Zeile 67:**
  ```html
  <!-- ❌ vorher -->
  [id]="$safeNavigationMigration(categorie.id?.id?.toString())"
  <!-- ✅ nachher -->
  [id]="categorie.id?.id?.toString()"
  ```

  **Hinweis:** Wenn die Templates danach noch TS2339 Fehler für `event()` oder `categorie` werfen, liegt das an den TypeScript-Strict-Null-Checks. In Angular 22 sind `?` (safe navigation) und `??` (nullish coalescing) in Templates standardmäßig erlaubt — die extendedDiagnostics-Suppressions in `tsconfig.app.json` decken das ab.

- [ ] **Step 2: Build testen**

  Run: `npx ng build 2>&1 | grep '\$safeNavigationMigration'`
  Expected: Keine `$safeNavigationMigration` Fehler mehr.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/component/event-card/event-card.component.html \
          src/app/pages/kategorie/kategorie.component.html
  git commit -m "fix: remove $safeNavigationMigration migration artifacts from templates"
  ```

---

### Task 4: `currentLang()` → `currentLang` in translate.service.ts

**Files:**
- Modify: `src/app/services/translate.service.ts:101`

**Interfaces:**
- Consumes: nothing
- Produces: korrekter Zugriff auf `currentLang` Property

- [ ] **Step 1: Methodenaufruf in Property-Zugriff ändern**

  ```typescript
  // ❌ vorher (currentLang ist ein Getter, keine Methode)
  return this.translateService.currentLang() || 'de'
  // ✅ nachher
  return this.translateService.currentLang || 'de'
  ```

- [ ] **Step 2: Build testen**

  Run: `npx ng build 2>&1 | grep 'currentLang'`
  Expected: Keine `TS6234` Fehler zu `currentLang`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/services/translate.service.ts
  git commit -m "fix: currentLang is a getter, not a method in ngx-translate v18"
  ```

---

## Phase 2: SurrealDB Service Reparatur

### Task 5: SurrealDB Service TypeScript-Fehler beheben

**Files:**
- Modify: `src/app/services/surrealdb.service.ts`

**Interfaces:**
- Consumes: `surrealdb` package (v2.0.3 — aktuell installiert)
- Produces: type-safe SurrealDB-Wrapper der mit TypeScript 6.0 und SurrealDB SDK v2 kompiliert

**Analyse der 8 Fehler:**

1. **`LiveMessage`, `LiveSubscription` sind keine named exports mehr** → als Typen durch eigene Interfaces ersetzen
2. **`Tokens` nicht exportiert** → durch `Token` ersetzen (Rückgabetyp)
3. **`{}` nicht zuweisbar an `undefined`** → `payload ?? ({} as T)` statt `payload ?? {}`
4. **`.content()` existiert nicht auf `update()` Result** → `update()` direkt verwenden
5. **`.table` existiert nicht auf `RecordId`** → `RecordId` hat andere API
6. **`.collect()` existiert nicht auf Query-Result** → Query-Result ist direkt das Promise-Result
7. **`.diff()` existiert nicht auf Live-Query** → API geändert

- [ ] **Step 1: Typ-Importe korrigieren (Zeile 3)**

  ```typescript
  // ❌ vorher
  import { LiveMessage, LiveSubscription, RecordId, StringRecordId, Surreal, Table, Token, Tokens } from 'surrealdb'
  // ✅ nachher — Tokens entfernt, LiveMessage/LiveSubscription durch lokale Interfaces ersetzt
  import { RecordId, StringRecordId, Surreal, Table, Token } from 'surrealdb'
  ```

  `LiveMessage` und `LiveSubscription` werden nur innerhalb der Klasse verwendet — dafür brauchen wir nur `LiveQueryUpdate<T>` (existiert bereits Zeile 12) und den Rückgabetyp von `super.live()` (der ist `Promise<Uuid>`).

  Die `LiveSubscription` Typ-Referenz in Map (Zeile 33) durch `unknown` ersetzen:
  ```typescript
  private readonly liveQuerySubscriptions = new Map<string, unknown>()
  ```

  Und in `initializeLiveQuery` die subscription Variable als `unknown` typisieren.

- [ ] **Step 2: `post()` Methode fixen (Zeile 189)**

  ```typescript
  // ❌ vorher
  const result = (await super.insert<T>(new Table(table), payload ?? {})) as T[]
  // ✅ nachher — expliziter Typ für leeres Objekt
  const result = (await super.insert<T>(new Table(table), payload ?? ({} as T))) as T[]
  ```

- [ ] **Step 3: `postUpdate()` Methode fixen (Zeile 202-204)**

  ```typescript
  // ❌ vorher
  const updatedRecord = (await super.update<T>(id).content(payload)) as T
  const table = id instanceof RecordId ? id.table.name : this.recordIdToString(id).split(':', 1)[0]
  // ✅ nachher — content() entfernt, table anders ermittelt
  const updatedRecord = (await super.update<T>(id, payload)) as T
  const table = this.getTableFromId(id)
  ```

  Hilfsmethode für table-Extraktion hinzufügen (wiederverwendet in deleteRow Zeile 228):
  ```typescript
  private getTableFromId(id: RecordId<string> | StringRecordId): string {
    if (typeof (id as any).tb === 'string') {
      return (id as any).tb
    }
    return this.recordIdToString(id).split(':')[0]
  }
  ```

- [ ] **Step 4: `deleteRow()` Methode fixen (Zeile 228)**

  ```typescript
  // ❌ vorher
  const table = recordId instanceof RecordId ? recordId.table.name : this.recordIdToString(recordId).split(':', 1)[0]
  // ✅ nachher
  const table = this.getTableFromId(recordId)
  ```

- [ ] **Step 5: `fulltextSearchEvents()` fixen — `collect()` entfernen (Zeile 278)**

  In SurrealDB SDK v2 returned `super.query()` bereits das Result direkt:
  ```typescript
  // ❌ vorher
  const queryResult = (await super.query<[AppEvent[]]>(ftsSql, { q }).collect())[0]
  // ✅ nachher — collect() existiert nicht, query liefert direkt Promise<[AppEvent[]]>
  const queryResult = (await super.query<[AppEvent[]]>(ftsSql, { q }))[0]
  ```

- [ ] **Step 6: `initializeLiveQuery()` fixen — `diff()` entfernen (Zeile 378-380)**

  ```typescript
  // ❌ vorher
  const livePromise = super.live<T>(new Table(table))
  const subscription = await (diff ? livePromise.diff() : livePromise)
  // ✅ nachher — diff() existiert nicht, super.live() direkt verwenden
  const subscription = await super.live<T>(new Table(table))
  ```

  Die subscription ist jetzt vom Typ `Uuid` (Rückgabetyp von `super.live()`). Anpassungen im weiteren Code:
  - `subscription.kill()` → `await super.kill(subscription)`
  - `subscription.subscribe(...)` → anders handhaben

  **Wichtig:** Der Live-Query Mechanismus muss komplett überarbeitet werden da das SurrealDB SDK v2 eine andere Live-Query API hat. Statt `subscription.subscribe()` muss ein Callback-Mechanismus oder ein Observable-basierter Ansatz verwendet werden.

  ```typescript
  // Vollständig korrigierte initializeLiveQuery
  private async initializeLiveQuery<T extends Record<string, unknown>>(
    queryKey: string,
    table: string,
    _diff: boolean,
  ): Promise<void> {
    try {
      await this.initialize()

      const uuid = await super.live<T>(new Table(table), (message) => {
        // SDK v2 verwendet KILLED statt CLOSE.
        let update: LiveQueryUpdate<T>

        if (message.action === 'KILLED') {
          update = { action: 'CLOSE' }
        } else {
          update = {
            action: message.action,
            result: message.value as unknown as T,
          }
        }

        const callbacks = this.liveQueryCallbacks.get(queryKey)
        if (callbacks) {
          callbacks.forEach((callback) => {
            ;(callback as LiveQueryCallback<T>)(update)
          })
        }
      })

      if (!this.liveQueryCallbacks.has(queryKey)) {
        await super.kill(uuid)
        return
      }

      this.liveQuerySubscriptions.set(queryKey, uuid)

      // cleanup on close etc using uuid directly
    } catch (error) {
      console.error('Failed to create live query:', error)
      const update: LiveQueryUpdate<T> = { action: 'CLOSE' }
      const callbacks = this.liveQueryCallbacks.get(queryKey)
      if (callbacks) {
        callbacks.forEach((callback) => {
          ;(callback as LiveQueryCallback<T>)(update)
        })
      }
      this.liveQueryCallbacks.delete(queryKey)
      this.liveQuerySubscriptions.delete(queryKey)
      throw error
    }
  }
  ```

  Anpassung in `liveQuery()` (Zeile 345):
  ```typescript
  // ❌ vorher
  if (subscription) {
    try {
      await subscription.kill()
    ...
  // ✅ nachher — kill ist jetzt statische Methode auf super
  if (subscription) {
    try {
      await super.kill(subscription as Uuid)
    ...
  ```

  Import von `Uuid` ergänzen:
  ```typescript
  import { RecordId, StringRecordId, Surreal, Table, Token, Uuid } from 'surrealdb'
  ```

  Und in `disconnect()` (Zeile 450-456):
  ```typescript
  // ❌ vorher
  await subscription.kill()
  // ✅ nachher
  await super.kill(subscription as Uuid)
  ```

- [ ] **Step 7: Build testen**

  Run: `npx ng build`
  Expected: Alle TypeScript-Fehler im SurrealDB Service behoben. Der Build sollte deutlich weiter kommen.

- [ ] **Step 8: Commit**

  ```bash
  git add src/app/services/surrealdb.service.ts
  git commit -m "fix: adapt SurrealDB service for TS 6.0 strictness and SDK v2 API"
  ```

---

### Task 6: Build sanity check

- [ ] **Step 1: Vollständigen Build laufen lassen**

  Run: `npx ng build 2>&1`
  Expected: Keine Errors mehr. Der Build erzeugt erfolgreich das Bundle.

- [ ] **Step 2: Falls noch Fehler, kategorisieren und iterieren**

  Falls der Build immer noch Fehler wirft, nach folgenden Mustern checken:
  - `NG2012` → Ein importiertes Component-Member hat ein Problem (nicht-standalone, falscher Import)
  - `TS2339` → TypeScript strict mode error
  - Sonstige → Singular-Fehler, einzeln beheben

- [ ] **Step 3: Commit (falls Änderungen nötig waren)**

  ```bash
  git add -A
  git commit -m "fix: additional build fixes"
  ```

---

## Phase 3: Best Practice Verbesserungen

### Task 7: `@Input()`/`@Output()` → `input()`/`output()` in 7 Komponenten

**Files:**
- Modify: `src/app/component/header/header.component.ts`
- Modify: `src/app/component/go-back-button/go-back-button.component.ts`
- Modify: `src/app/component/location-input/location-input.component.ts`
- Modify: `src/app/component/organizer-input/organizer-input.component.ts`
- Modify: `src/app/component/share/share.component.ts`
- Modify: `src/app/component/event-topic-pill-list/event-topic-pill-list.component.ts`
- Modify: `src/app/component/image-upload/image-upload.component.ts`

**Interfaces:**
- Consumes: Tasks 1-6 abgeschlossen (Build läuft)
- Produces: Signal-basierte Inputs/Outputs in allen Komponenten

- [ ] **Step 1: `go-back-button.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  import { Component, inject, Input, ChangeDetectionStrategy } from '@angular/core'
  // ...
  @Input() goBackParams?: string | null = null

  // ✅ nachher
  import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core'
  // ...
  readonly goBackParams = input<string | null | undefined>(undefined)
  ```

  **Hinweis zur Template-Nutzung:** Wenn die Componente `goBackParams` im Template verwendet, dort ggf. von `goBackParams` auf `goBackParams()` ändern (Signal in Templates automatisch gelesen → bleibt `goBackParams`).

- [ ] **Step 2: `header.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  @Input() logo: LogoSet = { ... }
  @Input() shrinkThreshold = 20
  @Input() showWave = true

  // ✅ nachher
  readonly logo = input<LogoSet>({ ... })
  readonly shrinkThreshold = input(20)
  readonly showWave = input(true)
  ```

- [ ] **Step 3: `location-input.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  @Input() locations: Location[] = []
  @Input() selectedLocation: Location | null = null
  @Input() errorLocation = false
  @Output() locationSelected = new EventEmitter<Location | null>()

  // ✅ nachher
  readonly locations = input<Location[]>([])
  readonly selectedLocation = input<Location | null>(null)
  readonly errorLocation = input(false)
  readonly locationSelected = output<Location | null>()
  ```

  EventEmitter Import entfernen, output importieren.

- [ ] **Step 4: `organizer-input.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  @Input() organizers: Organizer[] = []
  @Input() selectedOrganizer: Organizer | null = null
  @Output() organizerSelected = new EventEmitter<Organizer | null>()

  // ✅ nachher
  readonly organizers = input<Organizer[]>([])
  readonly selectedOrganizer = input<Organizer | null>(null)
  readonly organizerSelected = output<Organizer | null>()
  ```

- [ ] **Step 5: `share.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  @Input() event: Event | null = null
  @Input() location: Location | null = null

  // ✅ nachher
  readonly event = input<Event | null>(null)
  readonly location = input<Location | null>(null)
  ```

- [ ] **Step 6: `event-topic-pill-list.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  @Input() event: Event | null = null

  // ✅ nachher
  readonly event = input<Event | null>(null)
  ```

- [ ] **Step 7: `image-upload.component.ts` migrieren**

  ```typescript
  // ❌ vorher
  @Input() previews: string[] = []
  @Input() eventName = ''
  @Input() existingImages: Media[] = []

  // ✅ nachher
  readonly previews = input<string[]>([])
  readonly eventName = input('')
  readonly existingImages = input<Media[]>([])
  ```

- [ ] **Step 8: Build testen**

  Run: `npx ng build`
  Expected: Build erfolgreich.

- [ ] **Step 9: Commit**

  ```bash
  git add src/app/component/header/header.component.ts \
          src/app/component/go-back-button/go-back-button.component.ts \
          src/app/component/location-input/location-input.component.ts \
          src/app/component/organizer-input/organizer-input.component.ts \
          src/app/component/share/share.component.ts \
          src/app/component/event-topic-pill-list/event-topic-pill-list.component.ts \
          src/app/component/image-upload/image-upload.component.ts
  git commit -m "refactor: migrate @Input/@Output decorators to signal-based input()/output()"
  ```

---

### Task 8: `[ngClass]`/`[ngStyle]` → `[class]`/`[style]` Bindings

**Files:** (bis zu 10+ Templates, je nach Projektstand)

**Interfaces:**
- Consumes: Task 7 abgeschlossen
- Produces: Moderne Class/Style-Bindings in allen Templates

- [ ] **Step 1: Templates identifizieren**

  Alle Templates mit `[ngClass]` oder `[ngStyle]` suchen:
  ```bash
  grep -rn 'ngClass\|ngStyle' src/app/ --include='*.html'
  ```

- [ ] **Step 2: Häufige Patterns ersetzen**

  ```html
  <!-- ❌ ngClass pattern -->
  <div [ngClass]="condition ? 'class-a' : 'class-b'">
  <!-- ✅ [class] binding -->
  <div [class]="condition ? 'class-a' : 'class-b'">

  <!-- ❌ ngStyle pattern -->
  <div [ngStyle]="{ color: dynamicColor }">
  <!-- ✅ [style] binding -->
  <div [style.color]="dynamicColor">
  ```

  **Achtung:** Objekt-basiertes `[ngClass]="{ active: isActive }"` kann NICHT 1:1 durch `[class]` ersetzt werden. Dafür gibt es zwei Optionen:
  - Mehrere `[class.active]="isActive"` Bindings
  - Oder eine computed Function die den String zurückgibt

- [ ] **Step 3: Build testen**

  Run: `npx ng build`
  Expected: Build erfolgreich.

- [ ] **Step 4: Commit**

  ```bash
  git add -A
  git commit -m "refactor: migrate ngClass/ngStyle to [class]/[style] bindings"
  ```

---

### Task 9: Vollständigen Build und Lint-Suite laufen lassen

- [ ] **Step 1: Build**

  Run: `npx ng build`
  Expected: SUCCESS

- [ ] **Step 2: Lint**

  Run: `npm run lint 2>&1` (falls konfiguriert)
  Expected: Keine Errors

- [ ] **Step 3: Git Status prüfen**

  Run: `git status`
  Verify: Nur intended files geändert, nichts versehentlich committed

- [ ] **Step 4: Finaler Commit (wenn nötig)**

  ```bash
  git add -A
  git commit -m "chore: final cleanup after Angular 22 migration fixes"
  ```

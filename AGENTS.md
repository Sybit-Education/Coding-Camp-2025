# Konsolidierte Angular 20 Agenten-Anweisung für KI-Programmier-Copiloten

> **Version**: 1.0 | **Zielversion**: Angular 20+ (Standalone First)

---

## 🎯 Persona

Du bist eine:r engagierte:r Angular-Entwickler:in (v20+) mit **Fokus auf moderne Best Practices**. Du arbeitest **standalone-first**, setzt **Signals** für reaktiven State, nutzt den **neuen Control Flow** (`@if`, `@for`, `@switch`) und optimierst konsequent Rendering & Change Detection (gern auch **zoneless**). Du kennst die neuesten APIs & Best Practices und schreibst sauberen, wartbaren, performanten Code.

---

## 🏗️ Kern-Prinzipien

### 1. **Standalone Components (Standard)**
- **Keine NgModule für neue Features** – Standalone by default
- Explizit `standalone: true` **nicht mehr nötig** (implizit seit Angular 14+, in v20 Standard)
- Alle neuen Komponenten/Direktiven/Pipes sind standalone

### 2. **Signals für State Management**
- **Writable State**: `signal(initialValue)` für mutablen State
- **Derived/Computed State**: `computed()` für abgeleitete Signale
- **Reactive Updates**: `signal.update(oldVal => newVal)` oder `signal.set(newVal)`
- **RxJS-Integration**: `toSignal()` für Observable → Signal Umwandlung

### 3. **Control Flow (Neuer Standard)**
Verwende **IMMER** den neuen Control Flow statt Legacy-Direktiven:
- ✅ `@if (condition)` statt `*ngIf`
- ✅ `@for (item of items; track item.id)` statt `*ngFor` (mit `track` für Performance)
- ✅ `@switch (value) { @case (x) { ... } @default { ... } }` statt `*ngSwitch`
- ✅ `@let varName = expression;` für Template-lokale Variablen

### 4. **Change Detection & Performance**
- **OnPush Standard**: `changeDetection: ChangeDetectionStrategy.OnPush` in **JEDEM** `@Component`
- **Zoneless Optional**: Für extreme Performance kann `provideZonelessChangeDetection()` genutzt werden
  - Bei Zoneless: **Immer** Signals/`toSignal()`/`async`-Pipe für State-Bindings nutzen
  - Fremde Callbacks (`WebSocket`, Chart-Libs, etc.): `signal.set(...)` oder `ChangeDetectorRef.markForCheck()`

### 5. **Input/Output als Funktionen (v19+)**
- ✅ `input()` / `input.required<T>()` statt `@Input()`
- ✅ `output()` statt `@Output()`
- ✅ `model()` für Two-Way-Binding (neue Alternative)
- 🔍 Read-Only: Markiere Input/Output-Properties als `readonly`

```ts
// Modern (Angular 20)
import { Component, input, output, model } from '@angular/core';

@Component({ /* ... */ })
export class UserCard {
  readonly userId = input.required<string>();
  readonly userSelected = output<string>();
  readonly toggleStatus = model(false);  // Two-Way-Binding
}
```

### 6. **Dependency Injection**
- **`inject()` statt Constructor-Parameter**: Mehr Lesbarkeit, bessere Type-Inference
- **`providedIn: 'root'`** für Singleton-Services (Standard)

```ts
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({ /* ... */ })
export class UserList {
  private http = inject(HttpClient);
  private router = inject(Router);
}
```

---

## 📋 Best Practices & Kodier-Standards

### Dateien & Struktur

1. **Datei-Naming** (per Angular Style Guide):
   - Komponenten: `user-profile.ts`, `user-profile.html`, `user-profile.css`
   - Services: `user.service.ts`
   - Spezialisten: `*.pipe.ts`, `*.guard.ts`, `*.interceptor.ts`

2. **Projektorganisation**:
   - Nach **Feature/Domain** organisieren, nicht nach Typ (❌ kein `/components`, `/services`, `/pipes`)
   - Beispiel: `src/features/user-management/`, `src/features/products/`
   - Gemeinsame/Shared: `src/shared/`

3. **Separation of Concerns**:
   - **Logik → `.ts`**, **Markup → `.html`**, **Styles → `.scss` / `.css`**
   - Pro Component: 1 `.ts` + 1 `.html` + 1 `.scss` (ggf. mehrere `.scss` bei großen Komponenten)

### TypeScript & Type Safety

- ✅ **Strict Mode** in `tsconfig.json` (immer aktiviert)
- ✅ **Explizite Typen** für Public APIs; Type Inference bei offensichtlichen Typen
- ❌ **Keine `any`**; nutze `unknown` bei Unsicherheit
- ✅ **Type Guards** & **Union Types** für robustes Type-Checking

### Komponenten-Regeln

```ts
// ✅ MODERN (Angular 20 Best Practice)
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-profile',
  templateUrl: 'user-profile.html',
  styleUrl: 'user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ← IMMER
})
export class UserProfileComponent {
  // Inputs/Outputs
  readonly userId = input.required<string>();
  readonly onSave = output<UserData>();

  // Dependencies
  private http = inject(HttpClient);

  // Local State
  protected editMode = signal(false);
  protected userData = toSignal(this.http.get<UserData>(`/api/users/${this.userId()}`), {
    initialValue: null,
  });

  // Derived State
  protected isLoading = computed(() => this.userData() === null);
  protected displayName = computed(
    () => this.userData()?.name ?? 'Unbekannt'
  );

  // Methods
  toggleEdit() {
    this.editMode.update(mode => !mode);
  }

  save(data: UserData) {
    this.onSave.emit(data);
  }
}
```

### Template-Standards

```html
<!-- ✅ MODERN -->
<div class="container">
  @if (editMode()) {
    <form (ngSubmit)="save(formData)">
      <input
        type="text"
        [value]="displayName()"
        [disabled]="isLoading()"
      />
      <button type="submit">Speichern</button>
    </form>
  } @else {
    <p>{{ displayName() }}</p>
    <button (click)="toggleEdit()">Bearbeiten</button>
  }

  @if (isLoading()) {
    <p>Wird geladen...</p>
  }

  @let userName = userData()?.name;
  @if (userName) {
    <span>Benutzer: {{ userName }}</span>
  }
</div>

<!-- ✅ Styling (Class/Style Bindings) -->
<div
  [class.active]="editMode()"
  [class.loading]="isLoading()"
  [style.opacity]="isLoading() ? 0.5 : 1"
>
  ...
</div>

<!-- ❌ VERALTET (v20: Nicht mehr verwenden!) -->
<!-- <div *ngIf="editMode"> ... </div> -->
<!-- <div *ngFor="let item of items"> ... </div> -->
<!-- <div [ngClass]="{ active: isActive }"> ... </div> -->
<!-- <div [ngStyle]="{ opacity: opacity }"> ... </div> -->
```

### Services

```ts
// ✅ Modern Service
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' }) // ← Singleton by default
export class UserService {
  private http = inject(HttpClient);

  getUser(id: string) {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
```

### Reactive Forms (Bevorzugt)

- ✅ **Reactive Forms** (TypeScript-driven, testbar, robust)
- ❌ **Template-driven Forms** (nur für sehr einfache Cases)

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  template: `...`,
  imports: [ReactiveFormsModule],
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  submit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

### Router mit Input-Binding

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

const routes = [
  { path: 'user/:id', component: UserDetailComponent },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding())],
});

// user-detail.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  template: `<p>User ID: {{ userId() }}</p>`,
})
export class UserDetailComponent {
  userId = input<string>(); // ← Route-Parameter automatisch gebunden
}
```

### Async Daten & RxJS-Integration

```ts
// ✅ Bevorzugt: Signals mit toSignal()
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-users',
  template: `
    @let list = users();
    @if (list?.length) {
      <ul>
        @for (u of list; track u.id) {
          <li>{{ u.name }}</li>
        }
      </ul>
    } @else {
      <p>Keine Nutzer gefunden.</p>
    }
  `,
})
export class UsersComponent {
  private http = inject(HttpClient);
  protected users = toSignal(
    this.http.get<User[]>('/api/users'),
    { initialValue: [] }
  );
}

// ✅ Alternative: AsyncPipe (auch zoneless-compatible)
@Component({
  template: `
    @let users = users$ | async;
    @if (users) {
      <ul>
        @for (u of users; track u.id) {
          <li>{{ u.name }}</li>
        }
      </ul>
    }
  `,
})
export class UsersAltComponent {
  private http = inject(HttpClient);
  protected users$ = this.http.get<User[]>('/api/users');
}
```

### Image Optimization

- ✅ **NgOptimizedImage** für statische Bilder verwenden
- ❌ `<img>` ohne Optimierung

```ts
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-hero',
  template: `
    <img
      ngSrc="./assets/hero.jpg"
      width="1200"
      height="600"
      alt="Hero Banner"
      priority
    />
  `,
  imports: [NgOptimizedImage],
})
export class HeroComponent {}
```

### Performance: Defer-Loading

```html
<!-- Schwere Komponenten nur bei Bedarf laden -->
@defer (on viewport) {
  <heavy-analytics-dashboard />
} @placeholder {
  <skeleton-dashboard />
} @loading (after 500ms) {
  <p>Wird geladen...</p>
}

<!-- Immediate: Sofort laden, aber verzögert rendern -->
@defer (on immediate) {
  <feature-flag-panel />
}
```

### Lifecycle & Post-Render Init

```ts
import { Component, afterNextRender } from '@angular/core';

@Component({ /* ... */ })
export class ChartHostComponent {
  constructor() {
    // Läuft NACH dem nächsten Render-Zyklus
    // Nutze für DOM-Init, Chart.js, Leaflet, ResizeObserver, etc.
    afterNextRender(() => {
      this.initChart();
    });
  }

  private initChart() {
    // 3rd-Party-Libraries hier initialisieren
  }
}
```

---

## 🔧 Zoneless Angular 20 (Optional für Extreme Performance)

### Aktivierung

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});

// angular.json: Entferne Zone.js aus Polyfills
// polyfills.ts: Entferne `import 'zone.js';` und `import 'zone.js/testing';`
```

### Checkliste für Zoneless-Stabilität

1. **State-Binding immer via Signals/`toSignal()`/`async`-Pipe**
   ```ts
   // ✅ Funktioniert zoneless
   users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
   
   // ✅ Alternative mit AsyncPipe
   users$ = this.http.get<User[]>('/api/users');
   // Template: @let users = users$ | async;
   ```

2. **3rd-Party-Callbacks → Signal.set()**
   ```ts
   private cdr = inject(ChangeDetectorRef);

   constructor() {
     this.ws.onmessage = (msg) => {
       this.dataSignal.set(parse(msg)); // ← Signals triggern CD
       // Oder als Fallback: this.cdr.markForCheck();
     };
   }
   ```

3. **Post-Render-Init mit `afterNextRender()`**
   ```ts
   constructor() {
     afterNextRender(() => {
       this.chart = new Chart(...); // Chart nach erstem Render
     });
   }
   ```

4. **Test**: Signal-based Komponente → Rendern sofort sichtbar? ✅ Zoneless ready.

---

## 🧪 Qualität & Tooling

### Lint & Type Checking

- **ESLint (angular-eslint)**: `npm run lint` vor jedem Commit
- **TypeScript**: `strict: true` in `tsconfig.json`
- **Template Checking**: `strictTemplates: true` in `angular.json`

### Build Pipeline

```bash
# Entwicklung
ng serve

# Production
ng build --configuration production

# Lint
npm run lint

# Tests
npm run test

# E2E (ggf. Cypress/Playwright)
npm run e2e
```

### Commit-Workflow

1. Schreibe Code
2. `npm run lint` ← Muss clean sein
3. `npm run test` ← Tests grün
4. `ng build` ← Build erfolgreich
5. Commit

---

## 📚 Ressourcen (Angular 20 Essentials)

- [Components & Standalone](https://angular.dev/essentials/components)
- [Signals & Reactivity](https://angular.dev/essentials/signals)
- [Templates & Control Flow](https://angular.dev/essentials/templates)
- [Dependency Injection](https://angular.dev/essentials/dependency-injection)
- [Inputs/Outputs (Signal-API)](https://angular.dev/guide/components/inputs)
- [RxJS-Interop (toSignal)](https://angular.dev/guide/signals/rxjs-interop)
- [Defer & Performance](https://angular.dev/guide/defer)
- [Router Input Binding](https://angular.dev/guide/router/inputs)
- [NgOptimizedImage](https://angular.dev/guide/image-directive)
- [Hydration (SSR)](https://angular.dev/guide/hydration)
- [Style Guide](https://angular.dev/style-guide)
- [ESLint Rules](https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin/docs/rules)

---

## ⚠️ Häufige Unstimmigkeiten & Klarstellungen

### 1. **`standalone: true` explizit deklarieren?**
**Antwort**: **NEIN** (seit Angular 14+). In Angular 20 ist Standalone der Standard. Es muss nicht explizit deklariert werden.

```ts
// ❌ Nicht nötig (und veraltet-aussehend)
@Component({ ..., standalone: true })

// ✅ Einfach weglassen
@Component({ ... })
```

### 2. **`@Input` / `@Output` Decorators vs. `input()` / `output()`?**
**Antwort**: Für **neue Code**: `input()` / `output()` Funktionen. Diese sind:
- Moderner & lesbarer
- Signal-basiert (bessere Reactivity)
- Bessere Type-Inference
- Dekoratoren funktionieren noch, sind aber "legacy" für neue Features

```ts
// ✅ Modern (Angular 20)
readonly userId = input.required<string>();
readonly userSaved = output<UserData>();

// ⚠️ Legacy (noch unterstützt)
@Input() required userId!: string;
@Output() userSaved = new EventEmitter<UserData>();
```

### 3. **`ngClass` / `ngStyle` vs. `class` / `style` Bindings?**
**Antwort**: **IMMER** `class` / `style` Bindings nutzen. Diese sind:
- Performanter
- Lesbarer
- Standardkonformer

```ts
// ✅ Modern
[class.active]="isActive()"
[style.color]="accentColor()"

// ❌ Legacy
[ngClass]="{ active: isActive() }"
[ngStyle]="{ color: accentColor() }"
```

### 4. **Zoneless oder nicht?**
**Antwort**: 
- Zoneless ist **optional** & für **Performance-kritische Apps**.
- Bei Zoneless: **IMMER** Signals/`toSignal()`/`async`-Pipe für State verwenden.
- Test vorher, ob deine 3rd-Party-Libs (Charts, Maps) zoneless kompatibel sind.

### 5. **Wann `computed()` vs. `effect()`?**
**Antwort**:
- **`computed()`**: Für abgeleitete Werte, die sich re-computieren, wenn Dependencies ändern. **Read-only**. Lazy (nur wenn gelesen).
- **`effect()`**: Für Side-Effects (Logging, API-Calls, DOM-Manipulation). **Läuft automatisch** wenn Dependencies ändern.

```ts
// computed: Wert ableiten
protected fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

// effect: Side-Effect ausführen
effect(() => {
  console.log('Name geändert:', this.fullName());
  this.apiService.updateName(this.fullName());
});
```

---

## 🎯 Checkliste für neue Komponenten

- [ ] `ChangeDetectionStrategy.OnPush` gesetzt
- [ ] Inputs/Outputs als `input()` / `output()` Funktionen
- [ ] State via `signal()` / `computed()`
- [ ] Async-Daten via `toSignal()` oder `async`-Pipe
- [ ] Template nutzt `@if` / `@for` / `@switch` (nicht `*ngIf` / `*ngFor` / `*ngSwitch`)
- [ ] Keine `ngClass` / `ngStyle` (nutze `[class]` / `[style]`)
- [ ] CSS-Datei separat (`.html` + `.css` + `.ts`)
- [ ] Dependencies via `inject()` (nicht Constructor)
- [ ] Reactive Forms für komplexe Formulare
- [ ] `readonly` auf Input/Output/Query-Properties
- [ ] `protected` für Template-verwendete Methoden/Properties
- [ ] Lint: `npm run lint` ✅
- [ ] Tests schreiben (falls erforderlich)

---

## 💡 Tipps & Anti-Patterns

### ✅ DO
- Signals für **Alles** nutzen (State, Inputs, Outputs, Computed)
- `toSignal()` für Observables (RxJS → Signal Bridge)
- `@defer` für Heavy Components
- `afterNextRender()` für DOM-Init
- Komponenten klein & fokussiert halten
- Services für Business Logic
- `trackBy` in `@for` Schleifen

### ❌ DON'T
- Manuelle `subscribe()` ohne `unsubscribe()` (nutze Signals stattdessen)
- Complex Logic in Templates (→ `computed()` Signals auslagern)
- Globale `any` Types
- NgModule in neuem Code
- `ngClass` / `ngStyle` (→ `[class]` / `[style]`)
- Zone.js bei Zoneless angelassen
- CSS Global (immer Component-scoped mit ViewEncapsulation)

---

**Version**: 1.0 | **Last Updated**: November 2025 | **Für Angular 20+**

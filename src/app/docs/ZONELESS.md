# Zoneless Angular - Leitfaden

Dieses Projekt verwendet Angular im zoneless-Modus für bessere Performance und Kontrolle über die Change Detection.

## Was bedeutet "zoneless"?

- **Ohne Zone.js**: Die Anwendung läuft ohne Zone.js, was bedeutet, dass Change Detection nicht automatisch ausgelöst wird.
- **Explizite Change Detection**: Wir müssen explizit angeben, wann Change Detection ausgeführt werden soll.
- **Bessere Performance**: Weniger unnötige Render-Zyklen führen zu besserer Performance.

## Wichtige Konzepte

### 1. Signals für reaktiven State

```typescript
// Komponente mit Signal
export class ServerStatusComponent {
  isServerRunning = signal(true);
  
  toggleServer() {
    this.isServerRunning.update(status => !status);
  }
}
```

```html
<!-- Template mit Signal -->
<div>
  @if (isServerRunning()) {
    <span>Server läuft</span>
  } @else {
    <span>Server gestoppt</span>
  }
  <button (click)="toggleServer()">Umschalten</button>
</div>
```

### 2. RxJS mit toSignal

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

// Observable in Signal umwandeln
users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
```

### 3. AsyncPipe für Observables

```typescript
// Observable in Komponente
users$ = this.http.get<User[]>('/api/users');
```

```html
<!-- AsyncPipe im Template -->
@let users = users$ | async;
@if (users) {
  <ul>
    @for (user of users; track user.id) {
      <li>{{ user.name }}</li>
    }
  </ul>
}
```

### 4. DOM-Initialisierung nach dem Rendering

```typescript
import { afterNextRender } from '@angular/core';

constructor() {
  afterNextRender(() => {
    // Chart, Map oder andere DOM-Manipulation hier
    this.initializeChart();
  });
}
```

## Häufige Probleme und Lösungen

### Problem: Komponente wird nicht aktualisiert

**Symptom**: Daten ändern sich, aber die UI wird nicht aktualisiert.

**Lösung**:
1. Verwende Signals statt einfacher Variablen
2. Bei RxJS: Nutze `toSignal()` oder die `async`-Pipe
3. Bei manuellen Updates: `ChangeDetectorRef.markForCheck()`

```typescript
export class MyComponent {
  private cdr = inject(ChangeDetectorRef);
  
  onExternalEvent() {
    this.data = newData;
    this.cdr.markForCheck();
  }
}
```

### Problem: Third-Party-Bibliotheken

**Symptom**: Callbacks von externen Bibliotheken aktualisieren die UI nicht.

**Lösung**:
1. Verwende Signals für den State
2. Rufe `markForCheck()` in Callbacks auf
3. Initialisiere Bibliotheken mit `afterNextRender()`

## Hilfreiche Utilities

Wir haben einige Hilfsfunktionen in `src/app/utils/zoneless-helpers.ts` bereitgestellt:

- `injectMarkForCheck()`: Einfacher Zugriff auf markForCheck
- `initAfterRender()`: Wrapper für afterNextRender
- `toTypedSignal()`: Typsicherer Wrapper für toSignal
- `createSignalWithSetter()`: Erstellt ein Signal mit Getter/Setter-API

## Weitere Ressourcen

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [RxJS Interop](https://angular.dev/guide/signals/rxjs-interop)
- [Rendering Lifecycle](https://angular.dev/guide/change-detection#rendering-lifecycle-utilities)

import {
  afterNextRender,
  ChangeDetectorRef,
  inject,
  signal,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Observable } from 'rxjs'

/**
 * Hilfsfunktion zum Markieren der Change Detection in zoneless Angular
 * Verwende diese Funktion in Komponenten, die manuelle CD benötigen
 *
 * @example
 * ```ts
 * export class MyComponent {
 *   private markForCheck = injectMarkForCheck();
 *
 *   onExternalEvent() {
 *     // Daten aktualisieren
 *     this.data = newData;
 *     // Change Detection auslösen
 *     this.markForCheck();
 *   }
 * }
 * ```
 */
export function injectMarkForCheck(): () => void {
  const cdr = inject(ChangeDetectorRef)
  return () => cdr.markForCheck()
}

/**
 * Hilfsfunktion für die Initialisierung von DOM-Elementen nach dem Rendering
 * Besonders nützlich für Third-Party-Bibliotheken wie Charts, Maps, etc.
 *
 * @example
 * ```ts
 * export class ChartComponent {
 *   constructor() {
 *     afterNextRender(() => {
 *       // Chart initialisieren
 *       this.initChart();
 *     });
 *   }
 *
 *   private initChart() {
 *     // Chart-Bibliothek initialisieren
 *   }
 * }
 * ```
 */
export function initAfterRender(callback: () => void): void {
  afterNextRender(() => {
    callback()
  })
}

/**
 * Konvertiert einen Observable in ein Signal mit Typinferenz
 * Vereinfacht die Verwendung von RxJS in zoneless Angular
 *
 * @example
 * ```ts
 * export class UserComponent {
 *   private http = inject(HttpClient);
 *   users = toTypedSignal(this.http.get<User[]>('/api/users'), []);
 * }
 * ```
 */
export function toTypedSignal<T>(source$: Observable<T>, initialValue: T) {
  return toSignal(source$, { initialValue })
}

/**
 * Erstellt ein Signal mit einem initialen Wert und einem Setter
 * Vereinfacht die Verwendung von Signals in Komponenten
 *
 * @example
 * ```ts
 * export class CounterComponent {
 *   counter = createSignalWithSetter(0);
 *
 *   increment() {
 *     this.counter.set(this.counter() + 1);
 *   }
 * }
 * ```
 */
export function createSignalWithSetter<T>(initialValue: T) {
  const sig = signal<T>(initialValue)

  // Erstelle ein Funktionsobjekt mit zusätzlichen Methoden
  const result = () => sig()

  // Füge Methoden hinzu
  result.set = (value: T) => sig.set(value)
  result.update = (updater: (value: T) => T) => sig.update(updater)

  return result as {
    (): T
    set: (value: T) => void
    update: (updater: (value: T) => T) => void
  }
}

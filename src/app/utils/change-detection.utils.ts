import { ChangeDetectorRef, inject } from '@angular/core';

/**
 * Hilfsfunktion für zoneless Change Detection
 * 
 * Verwendet in Komponenten, die mit externen Bibliotheken oder Callbacks arbeiten,
 * die außerhalb der Angular-Zone ausgeführt werden.
 * 
 * @example
 * ```typescript
 * // In einer Komponente:
 * private markForCheck = injectChangeDetection();
 * 
 * someExternalCallback() {
 *   this.data = newData;
 *   this.markForCheck();
 * }
 * ```
 */
export function injectChangeDetection(): () => void {
  const cdr = inject(ChangeDetectorRef);
  return () => cdr.markForCheck();
}

import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'

/**
 * Beobachtet den Online/Offline-Status und leitet auf eine Offline-Seite um.
 * Dank Preloading stehen die Lazy-Chunks in der Regel bereits zur Verfügung.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly router = inject(Router)

  constructor() {
    // Initialzustand prüfen
    if (typeof navigator !== 'undefined' && navigator && 'onLine' in navigator) {
      if (!navigator.onLine) {
        this.safeNavigateToOffline()
      }
    }

    // Browser-Events abonnieren
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', () => this.safeNavigateToOffline())
      window.addEventListener('online', () => this.safeNavigateOnline())
    }
  }

  private async safeNavigateToOffline(): Promise<void> {
    try {
      if (this.router.url !== '/offline') {
        await this.router.navigate(['/offline'])
      }
    } catch {
      // Navigation kann fehlschlagen, wenn Router noch nicht initialisiert ist.
      // In dem Fall ignorieren wir den Fehler – ein späteres Event fängt es ab.
    }
  }

  private async safeNavigateOnline(): Promise<void> {
    try {
      if (this.router.url === '/offline') {
        await this.router.navigate(['/'])
      }
    } catch {
      // Siehe oben
    }
  }
}

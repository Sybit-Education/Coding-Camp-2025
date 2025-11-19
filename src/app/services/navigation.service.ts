import { Injectable, inject } from '@angular/core'
import { Router, NavigationExtras } from '@angular/router'
import { injectMarkForCheck } from '../utils/zoneless-helpers'

/**
 * Service für Navigation
 * Optimiert für zoneless Angular mit expliziter Change Detection
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly router = inject(Router)
  private readonly markForCheck = injectMarkForCheck()

  /**
   * Navigiert zu einer Route und löst Change Detection aus
   * @param commands Die Routing-Befehle (Route-Pfad)
   * @param extras Zusätzliche Routing-Optionen
   */
  async navigateTo(commands: Parameters<Router['navigate']>[0], extras?: NavigationExtras): Promise<boolean> {
    const result = await this.router.navigate(commands, extras)

    // Stelle sicher, dass Change Detection ausgelöst wird
    this.markForCheck()

    return result
  }

  /**
   * Navigiert zurück in der Browser-Historie
   */
  goBack(): void {
    window.history.back()
    this.markForCheck()
  }
}

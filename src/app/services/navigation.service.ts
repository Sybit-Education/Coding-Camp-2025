import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

/**
 * Service für Navigation und Scroll-Verhalten
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(private router: Router) {}

  /**
   * Navigiert zu einer Route und scrollt zum Seitenanfang
   * @param commands Die Routing-Befehle (Route-Pfad)
   * @param extras Zusätzliche Routing-Optionen
   */
  navigateTo(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    // Stelle sicher, dass scrollPositionRestoration auf 'top' gesetzt ist
    const navigationExtras: NavigationExtras = {
      ...extras,
      scrollPositionRestoration: 'top'
    };
    
    return this.router.navigate(commands, navigationExtras);
  }

  /**
   * Scrollt manuell zum Seitenanfang
   */
  scrollToTop(): void {
    window.scrollTo(0, 0);
  }
}

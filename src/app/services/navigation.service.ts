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
    
    // Führe die Navigation aus und scrolle dann manuell nach oben
    return this.router.navigate(commands, navigationExtras).then(success => {
      if (success) {
        // Warte einen Moment, bis die Navigation abgeschlossen ist
        setTimeout(() => {
          this.scrollToTop();
        }, 100);
      }
      return success;
    });
  }

  /**
   * Scrollt manuell zum Seitenanfang
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // 'auto' ist schneller als 'smooth'
    });
    
    // Sicherheitsmaßnahme: Scrolle nochmals nach einer kurzen Verzögerung
    setTimeout(() => {
      window.scrollTo(0, 0);
      
      // Versuche auch, das Dokument-Element zu scrollen (für einige Browser)
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0; // Für Safari
    }, 50);
  }
}

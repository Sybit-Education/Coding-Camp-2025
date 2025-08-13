import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

/**
 * Service für Navigation
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(private router: Router) {}

  /**
   * Navigiert zu einer Route
   * @param commands Die Routing-Befehle (Route-Pfad)
   * @param extras Zusätzliche Routing-Optionen
   */
  navigateTo(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate(commands, extras);
  }
}
